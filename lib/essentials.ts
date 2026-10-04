import { API_URL } from "@/lib/api-url"

// Kit essentiel gardé sur l'appareil (GET /api/public/essentials, sans compte, ~15 Ko) : numéro d'urgence,
// conduite à tenir, alertes en cours, horaires bruts des lignes, services. Il est relu sans réseau quand la
// connexion est perdue : en crise, l'essentiel reste consultable avec l'heure de la dernière mise à jour.

export interface EssentialsAlert {
  id: number
  title: string
  message: string
  headline: { fr: string; en: string }
  color: "blue" | "yellow" | "orange" | "red"
  actionRequired: boolean
  zoneLabels: { fr: string[]; en: string[] }
  instructions: string[]
  expiresAt: string
}

export interface EssentialsLine {
  code: string
  name: string
  color: string
  state: "normal" | "delayed" | "interrupted"
  stops: string[]
  minutesBetweenStops: number
  serviceDays: number[]
  // Départs du terminus (« HH:MM ») : à l'arrêt d'indice i, départ + i × minutesBetweenStops
  terminusDepartures: string[]
  disruptions: { headline: { fr: string; en: string }; reason: string; unservedStops: string[]; alternatives: string[] }[]
}

export interface Essentials {
  emergency: {
    number: string
    label: { fr: string; en: string }
    note: { fr: string; en: string }
  }
  offlineGuide: { fr: string[]; en: string[] }
  alerts: EssentialsAlert[]
  transport: { lines: EssentialsLine[] }
  services: { code: string; name: string; description: string | null; icon: string | null }[]
  version: string
  // La copie du serveur est elle-même la dernière connue (base de données en panne)
  stale: boolean
  savedAt: string
  // Faux : seuls le numéro d'urgence et la conduite à tenir sont fournis
  complete: boolean
}

const KEY = "terra-nova:essentials"

interface Stored {
  etag: string | null
  // Date de la dernière relecture réussie sur cet appareil
  fetchedAt: string
  data: Essentials
}

export function readEssentials(): Stored | null {
  try {
    const raw = window.localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Stored) : null
  } catch {
    return null
  }
}

/**
 * Relit le kit essentiel et le garde sur l'appareil. `If-None-Match` : si rien n'a changé, le serveur répond 304
 * et rien n'est retéléchargé (précieux sur un réseau faible). Renvoie la copie locale, à jour ou non.
 */
export async function refreshEssentials(): Promise<Stored | null> {
  const stored = readEssentials()
  if (!API_URL) return stored
  try {
    const response = await fetch(`${API_URL}/public/essentials`, {
      headers: stored?.etag ? { "If-None-Match": stored.etag } : undefined,
      cache: "no-cache",
    })
    if (response.status === 304 && stored) {
      const refreshed = { ...stored, fetchedAt: new Date().toISOString() }
      window.localStorage.setItem(KEY, JSON.stringify(refreshed))
      return refreshed
    }
    if (!response.ok) return stored
    const next: Stored = { etag: response.headers.get("ETag"), fetchedAt: new Date().toISOString(), data: await response.json() }
    window.localStorage.setItem(KEY, JSON.stringify(next))
    return next
  } catch {
    // Réseau perdu : on garde ce qu'on a
    return stored
  }
}
