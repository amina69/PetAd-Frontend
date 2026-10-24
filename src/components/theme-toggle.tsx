import { Moon, Sun } from "lucide-react"
import { useTheme } from "./theme-provider"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="relative p-2.5 bg-gray-50 dark:bg-gray-800 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      title="Toggle theme"
    >
      <Sun className="h-5 w-5 scale-100 dark:scale-0 transition-all absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      <Moon className="h-5 w-5 scale-0 dark:scale-100 transition-all absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      {/* Invisible placeholder to maintain size */}
      <div className="w-5 h-5 opacity-0"></div>
    </button>
  )
}
