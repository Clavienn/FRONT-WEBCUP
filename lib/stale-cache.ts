// Dernière réponse réussie d'une donnée publique, gardée dans le navigateur. Si l'API est lente ou
// injoignable, la page d'accueil affiche la version précédente plutôt qu'une erreur : les services
// et annonces restent consultables dans de mauvaises conditions réseau.

const PREFIX = "terra-nova:cache:"

interface Entry<T> {
  savedAt: number
  value: T
}

export function saveStale<T>(key: string, value: T) {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify({ savedAt: Date.now(), value } satisfies Entry<T>))
  } catch {
    // stockage plein, désactivé ou navigation privée : le cache est un confort, pas une exigence
  }
}

export function readStale<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(PREFIX + key)
    return raw ? (JSON.parse(raw) as Entry<T>).value : null
  } catch {
    return null
  }
}

/** Charge la donnée ; en cas d'échec, retombe sur la dernière version connue, sinon relance l'erreur. */
export async function withStaleFallback<T>(key: string, load: () => Promise<T>): Promise<T> {
  try {
    const value = await load()
    saveStale(key, value)
    return value
  } catch (error) {
    const cached = readStale<T>(key)
    if (cached !== null) return cached
    throw error
  }
}
