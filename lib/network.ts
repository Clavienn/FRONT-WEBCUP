// Outils de résilience réseau : connexion lente, hors ligne, serveur lent ou surchargé.

interface NetworkInformation {
  saveData?: boolean
  effectiveType?: string
}

// Mode « économie de données » activé, ou connexion 2G : on allège ce qui est décoratif
// (séquence d'images de la page d'accueil) sans toucher aux informations ni aux actions.
export function isConstrainedConnection(): boolean {
  if (typeof navigator === "undefined") return false
  const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection
  return connection?.saveData === true || connection?.effectiveType === "2g" || connection?.effectiveType === "slow-2g"
}

export type NetworkErrorKind = "offline" | "timeout" | "unreachable"

export class NetworkError extends Error {
  constructor(readonly kind: NetworkErrorKind, message: string) {
    super(message)
    this.name = "NetworkError"
  }
}

const REQUEST_TIMEOUT_MS = 15_000
const MAX_RETRIES = 2
// Un serveur qui répond ceci est surchargé ou redémarre : réessayer a de bonnes chances de réussir
const RETRYABLE_STATUS = new Set([429, 502, 503, 504])
const MAX_RETRY_WAIT_MS = 5_000

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

// Attente avant la nouvelle tentative : Retry-After si le serveur l'indique, sinon délai exponentiel
// avec un peu d'aléa, pour que des milliers de clients ne reviennent pas tous au même instant.
function retryDelay(attempt: number, response?: Response): number {
  const retryAfter = Number(response?.headers.get("Retry-After"))
  if (Number.isFinite(retryAfter) && retryAfter > 0) return Math.min(retryAfter * 1000, MAX_RETRY_WAIT_MS)
  return Math.min(400 * 2 ** attempt + Math.random() * 250, MAX_RETRY_WAIT_MS)
}

async function fetchOnce(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController()
  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, REQUEST_TIMEOUT_MS)

  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } catch {
    if (timedOut) throw new NetworkError("timeout", "Le serveur met trop de temps à répondre. Réessayez dans un instant.")
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      throw new NetworkError("offline", "Vous êtes hors connexion. Vérifiez votre réseau puis réessayez.")
    }
    throw new NetworkError("unreachable", "Impossible de joindre l’API. Vérifiez que le serveur est démarré.")
  } finally {
    clearTimeout(timer)
  }
}

// Connexion et inscription sont refusées avec 503/429 AVANT tout traitement quand le serveur est saturé
// (file d'attente du hachage des mots de passe pleine) : les rejouer ne peut ni créer deux comptes ni
// consommer deux fois un jeton. En pleine affluence, c'est ce qui évite à l'habitant de voir une erreur.
const REFUSAL_REPLAYABLE = /\/auth\/(login|register)$/

/**
 * fetch avec délai maximal et nouvelles tentatives. Seules les lectures (GET/HEAD) sont rejouées
 * sur toute erreur : rejouer un POST pourrait créer deux demandes, ou consommer deux fois un refresh token.
 * Les connexions/inscriptions ne sont rejouées que si le serveur les a REFUSÉES (429/503), jamais sur une
 * erreur réseau (on ne sait pas si la requête a abouti).
 * Hors ligne, on n'insiste pas : une erreur claire vaut mieux qu'une attente.
 */
export async function resilientFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const method = (init.method ?? "GET").toUpperCase()
  const readOnly = method === "GET" || method === "HEAD"
  const replayRefusals = method === "POST" && REFUSAL_REPLAYABLE.test(url.split("?")[0])
  // Plus de tentatives que pour une lecture : l'attente côté serveur peut durer quelques secondes en rafale
  const retries = readOnly ? MAX_RETRIES : replayRefusals ? MAX_RETRIES + 2 : 0

  for (let attempt = 0; ; attempt += 1) {
    try {
      const response = await fetchOnce(url, init)
      // Un 429 avec un long Retry-After n'est pas une surcharge passagère (adresse bloquée par la protection
      // anti-robots) : réessayer ne servirait qu'à aggraver le blocage, on rend la réponse telle quelle
      const retryAfter = Number(response.headers.get("Retry-After"))
      const longBlock = response.status === 429 && Number.isFinite(retryAfter) && retryAfter > 30
      if (attempt < retries && !longBlock && RETRYABLE_STATUS.has(response.status) && (readOnly || response.status === 429 || response.status === 503)) {
        await wait(retryDelay(attempt, response))
        continue
      }
      return response
    } catch (error) {
      const retryable = readOnly && error instanceof NetworkError && error.kind !== "offline"
      if (attempt >= retries || !retryable) throw error
      await wait(retryDelay(attempt))
    }
  }
}
