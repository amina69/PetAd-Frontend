import { Monitor, Moon, Sun } from "lucide-react";
import { getNextThemeMode, THEME_MODES, type ThemeMode } from "../lib/theme";
import { useTheme } from "./ThemeProvider";

export interface ThemeToggleProps {
  /**
   * `"button"` renders a compact cycling button (ideal for navbars);
   * `"segmented"` renders an explicit Light / Dark / System radio group.
   */
  variant?: "button" | "segmented";
  className?: string;
}

const MODE_LABELS: Record<ThemeMode, string> = {
  light: "Light",
  dark: "Dark",
  system: "System",
};

const MODE_ICONS: Record<ThemeMode, typeof Sun> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

/**
 * Accessible theme switcher supporting `"light"`, `"dark"`, and `"system"`
 * modes.
 */
export function ThemeToggle({ variant = "button", className }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();

  if (variant === "segmented") {
    return (
      <div
        role="radiogroup"
        aria-label="Theme"
        className={[
          "inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {THEME_MODES.map((mode) => {
          const Icon = MODE_ICONS[mode];
          const isSelected = theme === mode;
          return (
            <button
              key={mode}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => setTheme(mode)}
              className={[
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                isSelected
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-slate-100"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white",
              ].join(" ")}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{MODE_LABELS[mode]}</span>
            </button>
          );
        })}
      </div>
    );
  }

  const nextTheme = getNextThemeMode(theme);
  const ActiveIcon = MODE_ICONS[theme];
  const label = `Theme: ${MODE_LABELS[theme]} (${resolvedTheme}). Switch to ${MODE_LABELS[nextTheme]} theme`;

  return (
    <button
      type="button"
      onClick={() => setTheme(nextTheme)}
      aria-label={label}
      title={label}
      data-theme-mode={theme}
      data-resolved-theme={resolvedTheme}
      className={[
        "relative inline-flex items-center justify-center rounded-full bg-gray-50 p-2.5 text-gray-700 transition-colors hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <ActiveIcon className="h-5 w-5" aria-hidden="true" />
    </button>
  );
}
