"use client"

import * as React from "react"

export type Theme = "light" | "dark"

const THEME_STORAGE_KEY = "webcup-theme"

function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.classList.toggle("dark", theme === "dark")
  root.classList.toggle("light", theme === "light")
  root.style.colorScheme = theme
}

export function useTheme() {
  const [theme, setThemeState] = React.useState<Theme>("light")
  // Ref miroir : permet un toggle sans dépendre de l'état, qui serait périmé dans un callback
  const themeRef = React.useRef<Theme>("light")

  React.useEffect(() => {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
    const initialTheme =
      storedTheme === "light" || storedTheme === "dark"
        ? storedTheme
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"

    applyTheme(initialTheme)
    themeRef.current = initialTheme
    setThemeState(initialTheme)
  }, [])

  const setTheme = React.useCallback((nextTheme: Theme) => {
    applyTheme(nextTheme)
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
    themeRef.current = nextTheme
    setThemeState(nextTheme)
  }, [])

  const toggleTheme = React.useCallback(() => {
    setTheme(themeRef.current === "dark" ? "light" : "dark")
  }, [setTheme])

  return { theme, setTheme, toggleTheme }
}