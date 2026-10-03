"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

import { dictionary, type DictionaryNode } from "@/lib/i18n/dictionary"
import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, isLocale, type Locale } from "@/lib/i18n/types"

const STORAGE_KEY = LOCALE_STORAGE_KEY

interface LanguageContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, vars?: Record<string, string | number>) => string
  tList: (key: string) => string[]
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

function resolve(node: DictionaryNode | undefined, path: string[]): DictionaryNode | undefined {
  let current: DictionaryNode | undefined = node
  for (const part of path) {
    if (typeof current !== "object" || Array.isArray(current)) return undefined
    current = current[part]
  }
  return current
}

function interpolate(template: string, vars?: Record<string, string | number>) {
  if (!vars) return template
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) =>
    key in vars ? String(vars[key]) : match
  )
}

export function LanguageProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE)

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (isLocale(stored)) setLocaleState(stored)
  }, [])

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    window.localStorage.setItem(STORAGE_KEY, next)
  }, [])

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const path = key.split(".")
      const value = resolve(dictionary[locale], path) ?? resolve(dictionary[DEFAULT_LOCALE], path)
      return typeof value === "string" ? interpolate(value, vars) : key
    },
    [locale]
  )

  const tList = useCallback(
    (key: string) => {
      const path = key.split(".")
      const value = resolve(dictionary[locale], path) ?? resolve(dictionary[DEFAULT_LOCALE], path)
      return Array.isArray(value) ? value : []
    },
    [locale]
  )

  const contextValue = useMemo(() => ({ locale, setLocale, t, tList }), [locale, setLocale, t, tList])

  return <LanguageContext.Provider value={contextValue}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider")
  return ctx
}
