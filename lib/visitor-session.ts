const VISITOR_EXPIRY_KEY = "terra-nova-visitor-expires-at"
const VISITOR_SESSION_EVENT = "terra-nova:visitor-session-change"
const SERVER_SNAPSHOT = "server"
export const VISITOR_SESSION_DURATION_MS = 10 * 60 * 1000

// Une session de découverte ne crée ni utilisateur ni rôle citoyen.
export function startVisitorSession(now = Date.now()): number | null {
  if (typeof window === "undefined") return null

  const expiresAt = now + VISITOR_SESSION_DURATION_MS
  try {
    window.sessionStorage.setItem(VISITOR_EXPIRY_KEY, String(expiresAt))
    window.dispatchEvent(new Event(VISITOR_SESSION_EVENT))
    return expiresAt
  } catch {
    return null
  }
}

export function getVisitorSessionSnapshot(): string {
  try {
    return window.sessionStorage.getItem(VISITOR_EXPIRY_KEY) ?? "missing"
  } catch {
    return "missing"
  }
}

export function getServerVisitorSessionSnapshot() {
  return SERVER_SNAPSHOT
}

export function subscribeToVisitorSession(onChange: () => void) {
  if (typeof window === "undefined") return () => undefined
  window.addEventListener(VISITOR_SESSION_EVENT, onChange)
  return () => window.removeEventListener(VISITOR_SESSION_EVENT, onChange)
}

export function endVisitorSession() {
  if (typeof window === "undefined") return
  try {
    window.sessionStorage.removeItem(VISITOR_EXPIRY_KEY)
    window.dispatchEvent(new Event(VISITOR_SESSION_EVENT))
  } catch {
    // A browser with blocked session storage has no visitor session to persist.
  }
}