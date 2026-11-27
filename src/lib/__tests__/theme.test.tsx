import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import {
  STATUS_BADGE_THEME_TOKENS,
  THEME_STORAGE_KEY,
  applyThemeToDocument,
  getContrastRatio,
  getNextThemeMode,
  readStoredTheme,
  resolveTheme,
  writeStoredTheme,
} from "../theme";
import { ThemeProvider, useTheme } from "../../components/ThemeProvider";
import { ThemeToggle } from "../../components/ThemeToggle";

function createMatchMediaMock(initialDark: boolean) {
  let matches = initialDark;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();

  const mql = {
    get matches() {
      return matches;
    },
    media: "(prefers-color-scheme: dark)",
    onchange: null,
    addEventListener: vi.fn((_event: string, listener: (e: MediaQueryListEvent) => void) => {
      listeners.add(listener);
    }),
    removeEventListener: vi.fn((_event: string, listener: (e: MediaQueryListEvent) => void) => {
      listeners.delete(listener);
    }),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };

  const setDark = (nextDark: boolean) => {
    matches = nextDark;
    const event = { matches: nextDark, media: mql.media } as MediaQueryListEvent;
    listeners.forEach((listener) => listener(event));
  };

  return { mql, setDark, listeners };
}

function ThemeProbe() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="resolved">{resolvedTheme}</span>
      <button type="button" onClick={() => setTheme("dark")}>
        Set Dark
      </button>
      <button type="button" onClick={() => setTheme("light")}>
        Set Light
      </button>
      <button type="button" onClick={() => setTheme("system")}>
        Set System
      </button>
    </div>
  );
}

describe("theme utilities (src/lib/theme.ts)", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.classList.remove("light", "dark");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reads and writes valid theme values and ignores corrupt values", () => {
    expect(readStoredTheme()).toBeNull();
    expect(writeStoredTheme("dark")).toBe(true);
    expect(readStoredTheme()).toBe("dark");

    window.localStorage.setItem(THEME_STORAGE_KEY, "invalid-theme");
    expect(readStoredTheme()).toBeNull();
  });

  it("wraps localStorage access in try/catch without throwing when storage fails", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });

    expect(readStoredTheme()).toBeNull();
    expect(writeStoredTheme("dark")).toBe(false);
  });

  it("resolves theme modes and cycles light -> dark -> system -> light", () => {
    expect(resolveTheme("light", "dark")).toBe("light");
    expect(resolveTheme("dark", "light")).toBe("dark");
    expect(resolveTheme("system", "dark")).toBe("dark");
    expect(resolveTheme("system", "light")).toBe("light");

    expect(getNextThemeMode("light")).toBe("dark");
    expect(getNextThemeMode("dark")).toBe("system");
    expect(getNextThemeMode("system")).toBe("light");
  });

  it("applies data-theme, classList, and colorScheme to documentElement", () => {
    applyThemeToDocument("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.classList.contains("light")).toBe(false);
    expect(document.documentElement.style.colorScheme).toBe("dark");

    applyThemeToDocument("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("verifies all status badges meet WCAG 2.1 AA >= 4.5:1 contrast in both light and dark themes", () => {
    for (const mode of ["light", "dark"] as const) {
      const tokens = STATUS_BADGE_THEME_TOKENS[mode];
      for (const [colorName, pair] of Object.entries(tokens)) {
        const ratio = getContrastRatio(pair.text, pair.bg);
        expect(
          ratio,
          `${mode} status badge "${colorName}" (${pair.text} on ${pair.bg}) contrast ratio ${ratio.toFixed(2)}:1`,
        ).toBeGreaterThanOrEqual(4.5);
      }
    }
  });

  it("runs the inline index.html pre-paint script cleanly to set data-theme without flash", () => {
    const html = readFileSync(path.resolve(process.cwd(), "index.html"), "utf8");
    const match = html.match(/<script>([\s\S]*?)<\/script>/);
    expect(match).not.toBeNull();
    const inlineScript = match![1];

    window.localStorage.setItem(THEME_STORAGE_KEY, "dark");
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.classList.remove("light", "dark");

    // Execute the inline pre-paint script before any React render.
    new Function(inlineScript)();

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});

describe("ThemeProvider and ThemeToggle", () => {
  const originalMatchMedia = window.matchMedia;

  function installMatchMedia(initialDark: boolean) {
    const mock = createMatchMediaMock(initialDark);
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: vi.fn().mockReturnValue(mock.mql),
    });
    return mock;
  }

  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.classList.remove("light", "dark");
  });

  afterEach(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: originalMatchMedia,
    });
    vi.restoreAllMocks();
  });

  it("follows system prefers-color-scheme and reacts to live OS theme changes", () => {
    const { setDark } = installMatchMedia(false);

    render(
      <ThemeProvider defaultTheme="system">
        <ThemeProbe />
      </ThemeProvider>,
    );

    expect(screen.getByTestId("theme")).toHaveTextContent("system");
    expect(screen.getByTestId("resolved")).toHaveTextContent("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");

    act(() => {
      setDark(true);
    });

    expect(screen.getByTestId("resolved")).toHaveTextContent("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("persists explicit user selection and switches data-theme via ThemeToggle button", () => {
    installMatchMedia(false);

    render(
      <ThemeProvider defaultTheme="light">
        <ThemeToggle />
      </ThemeProvider>,
    );

    const button = screen.getByRole("button", { name: /Theme: Light/i });
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");

    fireEvent.click(button);
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");

    fireEvent.click(screen.getByRole("button", { name: /Theme: Dark/i }));
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("system");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("supports segmented radiogroup variant for explicit Light/Dark/System selection", () => {
    installMatchMedia(true);

    render(
      <ThemeProvider defaultTheme="light">
        <ThemeToggle variant="segmented" />
      </ThemeProvider>,
    );

    expect(screen.getByRole("radio", { name: "Light" })).toHaveAttribute("aria-checked", "true");

    fireEvent.click(screen.getByRole("radio", { name: "Dark" }));
    expect(screen.getByRole("radio", { name: "Dark" })).toHaveAttribute("aria-checked", "true");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");

    fireEvent.click(screen.getByRole("radio", { name: "System" }));
    expect(screen.getByRole("radio", { name: "System" })).toHaveAttribute("aria-checked", "true");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });
});
