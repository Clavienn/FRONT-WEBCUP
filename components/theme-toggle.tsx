"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"

import { useLanguage } from "@/components/i18n/language-provider"
import { Button } from "@/components/ui/button"

type Theme = "light" | "dark"

const THEME_STORAGE_KEY = "webcup-theme"

function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.classList.toggle("dark", theme === "dark")
  root.classList.toggle("light", theme === "light")
  root.style.colorScheme = theme
}

export function ThemeToggle() {
  const { t } = useLanguage()
  const [theme, setTheme] = useState<Theme>("light")

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
    const initialTheme =
      storedTheme === "light" || storedTheme === "dark"
        ? storedTheme
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"

    applyTheme(initialTheme)
    setTheme(initialTheme)
  }, [])

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark"
    applyTheme(nextTheme)
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
    setTheme(nextTheme)
  }

  const nextThemeLabel = theme === "dark" ? t("themeToggle.activateLight") : t("themeToggle.activateDark")

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="fixed top-4 right-4 z-40 size-10 rounded-full border-border/80 bg-card/85 shadow-sm backdrop-blur-md"
      onClick={toggleTheme}
      aria-label={nextThemeLabel}
      title={nextThemeLabel}
    >
      {theme === "dark" ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
    </Button>
  )
}