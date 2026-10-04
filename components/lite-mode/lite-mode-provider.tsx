"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

const STORAGE_KEY = "webcup-lite-mode"

interface LiteModeContextValue {
  liteMode: boolean
  setLiteMode: (value: boolean) => void
  toggleLiteMode: () => void
}

const LiteModeContext = createContext<LiteModeContextValue | null>(null)

function applyLiteMode(enabled: boolean) {
  document.documentElement.classList.toggle("lite-mode", enabled)
}

// Préférence « mode allégé » : masque les images et animations non essentielles sur mobile
// ou connexion limitée. Persistée en local (pas de compte requis, utile dès la page publique).
export function LiteModeProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [liteMode, setLiteModeState] = useState(false)

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === "1") {
      setLiteModeState(true)
      applyLiteMode(true)
    }
  }, [])

  const setLiteMode = useCallback((next: boolean) => {
    applyLiteMode(next)
    window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0")
    setLiteModeState(next)
  }, [])

  const toggleLiteMode = useCallback(() => {
    setLiteMode(!liteMode)
  }, [liteMode, setLiteMode])

  const contextValue = useMemo(
    () => ({ liteMode, setLiteMode, toggleLiteMode }),
    [liteMode, setLiteMode, toggleLiteMode]
  )

  return <LiteModeContext.Provider value={contextValue}>{children}</LiteModeContext.Provider>
}

export function useLiteMode() {
  const ctx = useContext(LiteModeContext)
  if (!ctx) throw new Error("useLiteMode must be used within a LiteModeProvider")
  return ctx
}
