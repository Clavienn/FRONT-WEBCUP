export type Locale = "fr" | "en"

export const LOCALES: Locale[] = ["fr", "en"]
export const DEFAULT_LOCALE: Locale = "fr"

export function isLocale(value: unknown): value is Locale {
  return value === "fr" || value === "en"
}

// Clé de persistance partagée avec le LanguageProvider. Exposée ici (et non dans le
// provider) pour que le repository puisse lire la locale sans dépendre de React.
export const LOCALE_STORAGE_KEY = "terra-nova-locale"

/**
 * Locale courante hors contexte React, pour le code non-React (repository).
 * Le provider reste la source de vérité pour l'UI ; cette lecture sert uniquement à
 * envoyer le bon Accept-Language à l'API.
 */
export function getAppLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE
  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY)
  return isLocale(stored) ? stored : DEFAULT_LOCALE
}
