"use client"

import { Moon, Sun } from "lucide-react"

import { useLanguage } from "@/components/i18n/language-provider"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/hooks/use-theme"

export function ThemeToggle() {
  const { t } = useLanguage()
  const { theme, toggleTheme } = useTheme()
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