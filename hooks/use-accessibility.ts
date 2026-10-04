"use client"

import * as React from "react"

export type TextSize = "normal" | "large" | "xlarge"

const TEXT_SIZE_STORAGE_KEY = "webcup-text-size"
const TEXT_SIZE_CLASSES: Record<TextSize, string | null> = {
  normal: null,
  large: "text-size-large",
  xlarge: "text-size-xlarge",
}
const TEXT_SIZE_ORDER: TextSize[] = ["normal", "large", "xlarge"]

function isTextSize(value: string | null): value is TextSize {
  return value === "normal" || value === "large" || value === "xlarge"
}

function applyTextSize(size: TextSize) {
  const root = document.documentElement
  for (const className of Object.values(TEXT_SIZE_CLASSES)) {
    if (className) root.classList.remove(className)
  }
  const className = TEXT_SIZE_CLASSES[size]
  if (className) root.classList.add(className)
}

// Taille de texte confortable pour la lecture, indépendante du thème clair/sombre.
// Même mécanique de persistance que useTheme (voir use-theme.ts).
export function useAccessibility() {
  const [textSize, setTextSizeState] = React.useState<TextSize>("normal")
  const textSizeRef = React.useRef<TextSize>("normal")

  React.useEffect(() => {
    const stored = window.localStorage.getItem(TEXT_SIZE_STORAGE_KEY)
    const initial = isTextSize(stored) ? stored : "normal"

    applyTextSize(initial)
    textSizeRef.current = initial
    setTextSizeState(initial)
  }, [])

  const setTextSize = React.useCallback((next: TextSize) => {
    applyTextSize(next)
    window.localStorage.setItem(TEXT_SIZE_STORAGE_KEY, next)
    textSizeRef.current = next
    setTextSizeState(next)
  }, [])

  const cycleTextSize = React.useCallback(() => {
    const currentIndex = TEXT_SIZE_ORDER.indexOf(textSizeRef.current)
    setTextSize(TEXT_SIZE_ORDER[(currentIndex + 1) % TEXT_SIZE_ORDER.length])
  }, [setTextSize])

  return { textSize, setTextSize, cycleTextSize }
}
