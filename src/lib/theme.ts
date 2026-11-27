import type { StatusColorToken } from "./statusConfig";

export const THEME_STORAGE_KEY = "petad-ui-theme";
export const THEME_MODES = ["light", "dark", "system"] as const;

export type ThemeMode = (typeof THEME_MODES)[number];
export type ResolvedTheme = "light" | "dark";

export interface ThemeColorPair {
  readonly bg: string;
  readonly text: string;
}

/**
 * Contrast-verified status badge colour pairs for both light and dark themes.
 * Mirrors the `--status-badge-*-bg` and `--status-badge-*-text` custom
 * properties in `src/index.css`. Every pair meets WCAG 2.1 AA (>= 4.5:1).
 */
export const STATUS_BADGE_THEME_TOKENS: Record<
  ResolvedTheme,
  Record<StatusColorToken, ThemeColorPair>
> = {
  light: {
    gray: { bg: "#f3f4f6", text: "#374151" },
    blue: { bg: "#dbeafe", text: "#1d4ed8" },
    teal: { bg: "#ccfbf1", text: "#0f766e" },
    green: { bg: "#dcfce7", text: "#15803d" },
    amber: { bg: "#fef3c7", text: "#b45309" },
    red: { bg: "#fee2e2", text: "#b91c1c" },
  },
  dark: {
    gray: { bg: "#1f2937", text: "#e5e7eb" },
    blue: { bg: "#1e3a5f", text: "#bfdbfe" },
    teal: { bg: "#134e4a", text: "#99f6e4" },
    green: { bg: "#14532d", text: "#bbf7d0" },
    amber: { bg: "#451a03", text: "#fde68a" },
    red: { bg: "#450a0a", text: "#fecaca" },
  },
};

export function isThemeMode(value: unknown): value is ThemeMode {
  return value === "light" || value === "dark" || value === "system";
}

/**
 * Safely reads the persisted theme preference from `localStorage`.
 * Returns `null` when unset, invalid, or when storage throws.
 */
export function readStoredTheme(storageKey = THEME_STORAGE_KEY): ThemeMode | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return null;
    }
    const raw = window.localStorage.getItem(storageKey);
    return isThemeMode(raw) ? raw : null;
  } catch {
    return null;
  }
}

/**
 * Safely persists the user's theme preference to `localStorage`.
 * Returns `false` if storage access fails (e.g. private browsing / quota).
 */
export function writeStoredTheme(
  theme: ThemeMode,
  storageKey = THEME_STORAGE_KEY,
): boolean {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return false;
    }
    window.localStorage.setItem(storageKey, theme);
    return true;
  } catch {
    return false;
  }
}

/** Reads the OS/browser colour scheme preference via `prefers-color-scheme`. */
export function getSystemTheme(): ResolvedTheme {
  try {
    if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
  } catch {
    // Fall back to light if matchMedia throws in a restricted environment.
  }
  return "light";
}

/** Resolves a `ThemeMode` (`light | dark | system`) to an effective `light | dark`. */
export function resolveTheme(
  theme: ThemeMode,
  systemTheme: ResolvedTheme = getSystemTheme(),
): ResolvedTheme {
  return theme === "system" ? systemTheme : theme;
}

/**
 * Applies the resolved theme onto `<html>` via `data-theme`, class list,
 * and `color-scheme` so both CSS token selectors (`[data-theme="dark"]`) and
 * Tailwind `.dark` utilities stay in sync.
 */
export function applyThemeToDocument(
  resolved: ResolvedTheme,
  root: HTMLElement | null = typeof document !== "undefined" ? document.documentElement : null,
): void {
  if (!root) {
    return;
  }
  root.setAttribute("data-theme", resolved);
  root.classList.remove("light", "dark");
  root.classList.add(resolved);
  root.style.colorScheme = resolved;
}

/** Returns the next mode in the cycle `light -> dark -> system -> light`. */
export function getNextThemeMode(current: ThemeMode): ThemeMode {
  const index = THEME_MODES.indexOf(current);
  return THEME_MODES[(index + 1) % THEME_MODES.length] ?? "light";
}

/** Computes WCAG 2.1 relative luminance for a `#rrggbb` hex colour. */
export function getRelativeLuminance(hex: string): number {
  const cleaned = hex.replace(/^#/, "");
  const r = Number.parseInt(cleaned.slice(0, 2), 16) / 255;
  const g = Number.parseInt(cleaned.slice(2, 4), 16) / 255;
  const b = Number.parseInt(cleaned.slice(4, 6), 16) / 255;

  const toLinear = (channel: number) =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;

  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/** Computes the WCAG 2.1 contrast ratio (`1` to `21`) between two `#rrggbb` hex colours. */
export function getContrastRatio(foregroundHex: string, backgroundHex: string): number {
  const l1 = getRelativeLuminance(foregroundHex);
  const l2 = getRelativeLuminance(backgroundHex);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}
