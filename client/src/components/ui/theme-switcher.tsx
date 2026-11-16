import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Toggle theme"
        className="h-9 w-9 rounded-full border border-zinc-200 dark:border-white/10"
      />
    )
  }

  const isDark = theme === "dark"

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
      className="
        inline-flex h-9 w-9 items-center justify-center
        rounded-full
        text-zinc-700 dark:text-zinc-200
        transition-all duration-200
        hover:bg-zinc-100 dark:hover:bg-zinc-800
        hover:scale-110
        active:scale-95
      "
    >
      {isDark ? (
        <Sun className="h-[17px] w-[17px]" strokeWidth={2.5} />
      ) : (
        <Moon className="h-[17px] w-[17px]" strokeWidth={2.5} />
      )}
    </button>
  )
}