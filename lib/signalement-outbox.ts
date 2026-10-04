import { NetworkError } from "@/lib/network"
import { AuthApiError } from "@/repository/auth.repository"
import { signalementRepository, type NewSignalementInput } from "@/repository/signalement.repository"

// File d'attente des signalements d'urgence : sans réseau (ou pendant une panne de base, 503), le signalement est
// gardé sur l'appareil avec un identifiant client (`clientRef`) et l'heure du constat (`reportedAt`), puis renvoyé
// au retour de la connexion. Le même `clientRef` ne crée JAMAIS un second signalement : l'API répond « duplicate ».

const KEY = "terra-nova:signalement-outbox"
export const OUTBOX_EVENT = "terra-nova:outbox-change"

export interface QueuedSignalement {
  clientRef: string
  reportedAt: string
  // Le compte qui a fait le signalement : un autre compte connecté sur le même appareil ne l'envoie pas
  userId: number
  input: NewSignalementInput
}

function read(): QueuedSignalement[] {
  try {
    const raw = window.localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as QueuedSignalement[]) : []
  } catch {
    return []
  }
}

function write(items: QueuedSignalement[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items))
  } catch {
    // stockage plein ou indisponible : l'envoi en direct reste possible, seule l'attente échoue
  }
  window.dispatchEvent(new Event(OUTBOX_EVENT))
}

// 8 à 64 caractères [A-Za-z0-9_-] : un UUID sans tirets de séparation superflus convient
export const newClientRef = () => globalThis.crypto.randomUUID()

// Une erreur qui vaut la peine d'être retentée : réseau coupé, délai dépassé, serveur indisponible (503...)
export function isRetryable(error: unknown): boolean {
  if (error instanceof NetworkError) return true
  return error instanceof AuthApiError && (error.status === 502 || error.status === 503 || error.status === 504)
}

export function enqueue(userId: number, input: NewSignalementInput) {
  const item: QueuedSignalement = {
    clientRef: input.clientRef ?? newClientRef(),
    reportedAt: input.reportedAt ?? new Date().toISOString(),
    userId,
    input,
  }
  write([...read().filter((existing) => existing.clientRef !== item.clientRef), item])
  return item
}

export function pending(userId: number): QueuedSignalement[] {
  return read().filter((item) => item.userId === userId)
}

let flushing = false

/**
 * Envoie les signalements en attente de ce compte. Ceux qui échouent encore pour une raison réseau restent en
 * file ; ceux que l'API refuse pour de bon (400, 403...) sont retirés : les réessayer ne servirait à rien.
 * Renvoie le nombre de signalements transmis.
 */
export async function flushOutbox(userId: number): Promise<number> {
  if (flushing) return 0
  flushing = true
  let sent = 0
  try {
    for (const item of pending(userId)) {
      try {
        await signalementRepository.create({ ...item.input, clientRef: item.clientRef, reportedAt: item.reportedAt })
        write(read().filter((other) => other.clientRef !== item.clientRef))
        sent += 1
      } catch (error) {
        if (isRetryable(error)) break
        write(read().filter((other) => other.clientRef !== item.clientRef))
      }
    }
  } finally {
    flushing = false
  }
  return sent
}
