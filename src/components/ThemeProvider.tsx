import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  THEME_STORAGE_KEY,
  applyThemeToDocument,
  getSystemTheme,
  readStoredTheme,
  resolveTheme,
  writeStoredTheme,
  type ResolvedTheme,
  type ThemeMode,
} from "../lib/theme";

export type Theme = ThemeMode;

export interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: ThemeMode;
  storageKey?: string;
}

export interface ThemeProviderState {
  /** Selected user preference (`"light"`, `"dark"`, or `"system"`). */
  theme: ThemeMode;
  /** Effective applied theme (`"light"` or `"dark"`). */
  resolvedTheme: ResolvedTheme;
  /** Updates and persists the theme preference. */
  setTheme: (theme: ThemeMode) => void;
}

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined);

/**
 * Manages the application's theme preference (`light | dark | system`),
 * synchronizes `<html data-theme>` and `.dark`/`.light` classes, listens for
 * live OS `prefers-color-scheme` changes when in `system` mode, and persists
 * choices in `localStorage` wrapped in `try/catch`.
 */
export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = THEME_STORAGE_KEY,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeMode>(
    () => readStoredTheme(storageKey) ?? defaultTheme,
  );
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() => getSystemTheme());

  const resolvedTheme = resolveTheme(theme, systemTheme);

  useEffect(() => {
    applyThemeToDocument(resolvedTheme);
  }, [resolvedTheme]);

  useEffect(() => {
    if (theme !== "system") {
      return;
    }
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemTheme(event.matches ? "dark" : "light");
    };

    setSystemTheme(mediaQuery.matches ? "dark" : "light");

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    mediaQuery.addListener?.(handleChange);
    return () => mediaQuery.removeListener?.(handleChange);
  }, [theme]);

  const setTheme = useCallback(
    (nextTheme: ThemeMode) => {
      writeStoredTheme(nextTheme, storageKey);
      setThemeState(nextTheme);
    },
    [storageKey],
  );

  const value = useMemo<ThemeProviderState>(
    () => ({
      theme,
      resolvedTheme,
      setTheme,
    }),
    [theme, resolvedTheme, setTheme],
  );

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export function useTheme(): ThemeProviderState {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
