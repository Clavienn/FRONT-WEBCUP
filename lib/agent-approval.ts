"use client"

// Statut de validation d'un compte agent, déduit des données que l'API renvoie.
//
// L'API sépare deux agents (API-WEBCUP/src/utils/staffAccess.ts) :
//   - agent VALIDÉ     : un administrateur a confirmé son rôle -> coordonnées complètes,
//                        modification et activation de comptes citoyens autorisées ;
//   - agent EN ATTENTE : il s'est inscrit lui-même -> e-mail masqué (« a***@domaine »),
//                        téléphone et adresse retirés, écritures refusées en 403, et
//                        consultations de dossiers plafonnées puis journalisées.
//
// La réponse d'authentification n'indique pas ce statut, et aucune route ne renvoie de drapeau :
// on le reconnaît donc aux données elles-mêmes. C'est une reconnaissance, pas une déclaration —
// d'où le troisième état « unknown », qui vaut « on n'a rien vu encore » et non « pas worried ».

import { useCallback, useSyncExternalStore } from "react"

import { AuthApiError } from "@/repository/auth.repository"

/** Le serveur sépare la partie locale d'un e-mail masqué par cette suite (API : maskEmail). */
const MASK = "***"

// Codes métier émis par l'API pour la validation d'agent et le plafond de lecture
export const AGENT_NOT_VALIDATED = "agent_not_validated"
export const SENSITIVE_RATE_LIMITED = "sensitive_rate_limited"

export type AgentApproval = "unknown" | "pending" | "approved"

/** Champ minimal nécessaire pour reconnaître une valeur masquée. */
export interface MaskableContact {
  email: string | null | undefined
}

/** « a***@exemple.fr » vient du serveur ; un e-mail réel peut-il contenir « *** » ? Non. */
export function isMaskedEmail(email: string | null | undefined): boolean {
  if (!email) return false
  const [local] = email.split("@")
  return local.includes(MASK)
}

/**
 * Déduit le statut d'un lot de contacts citoyens.
 *
 * Le serveur masque la liste entière d'un coup (`view.map(maskContactDetails)`) : un seul e-mail
 * masqué prouve donc que le compte est en attente, et une liste non vide où aucun ne l'est prouve
 * qu'il est validé. Une liste vide ne prouve rien : on ne conclut pas « validé » par défaut, ce
 * qui laisserait croire à tort à un agent en attente que ses données sont ouvertes.
 */
export function inferApproval(contacts: readonly MaskableContact[]): AgentApproval {
  if (contacts.length === 0) return "unknown"
  return contacts.some((contact) => isMaskedEmail(contact.email)) ? "pending" : "approved"
}

/** Un 403 « pas encore validé » est une preuve directe, quel que soit le lot reçu auparavant. */
export function isNotValidatedError(error: unknown): boolean {
  return error instanceof AuthApiError && error.code === AGENT_NOT_VALIDATED
}

/** Plafond de consultations atteint : le serveur renseigne le délai avant de pouvoir réessayer. */
export function isRateLimitError(error: unknown): boolean {
  return error instanceof AuthApiError && error.code === SENSITIVE_RATE_LIMITED
}

// ── Mémoire de session ───────────────────────────────────────
// Le statut ne se déduit que des écrans qui servent réellement des données de citoyens. Il est
// donc retenu en mémoire et en sessionStorage pour que la bannière reste stable d'un écran à
// l'autre, sans refaire une requête sonde à chaque navigation. Mémorisé par compte : deux agents
// qui se succèdent sur le même poste ne partagent pas leur statut.

const STORAGE_KEY = "terra-nova:agent-approval"

interface Cache {
  userId: number | null
  approval: AgentApproval
}

let cache: Cache = { userId: null, approval: "unknown" }
const listeners = new Set<() => void>()

function persist(userId: number | null, approval: AgentApproval) {
  if (typeof window === "undefined") return
  try {
    if (approval === "unknown" || userId === null) window.sessionStorage.removeItem(STORAGE_KEY)
    else window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ userId, approval }))
  } catch {
    // Navigation privée, quota plein : l'inférence repartira simplement de la prochaine réponse
  }
}

function readStored(userId: number | null): AgentApproval {
  if (userId === null || typeof window === "undefined") return "unknown"
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return "unknown"
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== "object") return "unknown"
    const { userId: storedId, approval } = parsed as { userId?: unknown; approval?: unknown }
    if (storedId !== userId) return "unknown"
    return approval === "pending" || approval === "approved" ? approval : "unknown"
  } catch {
    return "unknown"
  }
}

function commit(userId: number | null, approval: AgentApproval) {
  if (cache.userId === userId && cache.approval === approval) return
  cache = { userId, approval }
  persist(userId, approval)
  for (const listener of listeners) listener()
}

/** À la déconnexion : plus rien du compte précédent ne doit être réutilisé. */
export function resetAgentApproval() {
  cache = { userId: null, approval: "unknown" }
  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      // Rien à nettoyer
    }
  }
  for (const listener of listeners) listener()
}

/**
 * Statut de validation du compte agent connecté.
 *
 * `reportContacts` est à appeler par tout écran qui reçoit des contacts citoyens : c'est de cet
 * échantillon que le statut est déduit. `reportDenial` enregistre un refus explicite du serveur.
 * Un compte sans droit sur les données de citoyens (un simple agent de traitement, un
 * administrateur) reste « unknown » : ce n'est pas un défaut, il n'a simplement rien à voir.
 */
export function useAgentApproval(userId: number | null) {
  const subscribe = useCallback((listener: () => void) => {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }, [])

  const getSnapshot = useCallback(() => {
    if (cache.userId === userId) return cache.approval
    // Compte changé : relire la session plutôt que de prêter l'état du précédent.
    return readStored(userId)
  }, [userId])

  // Côté serveur il n'y a pas de session : le rendu initial vaut toujours « rien vu ». Reprendre
  // `getSnapshot` comme instantané serveur ferait produire « en attente » dès la première
  // hydratation, alors que le HTML reçu ne contenait aucune bannière. React réconcilierait ensuite
  // un balisage différent de celui du serveur. Avec cet instantané neutre, la bannière apparaît
  // juste après l'hydratation, par le ré-rendu que `useSyncExternalStore` fait sur divergence.
  const getServerSnapshot = useCallback(() => "unknown" as const, [])

  const approval = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const reportContacts = useCallback(
    (contacts: readonly MaskableContact[]) => {
      const inferred = inferApproval(contacts)
      // Un refus du serveur ne doit jamais être effacé par un lot vide ou non masqué.
      if (inferred === "unknown") return
      if (cache.userId === userId && cache.approval === "pending" && inferred === "approved") return
      commit(userId, inferred)
    },
    [userId]
  )

  const reportDenial = useCallback(() => {
    commit(userId, "pending")
  }, [userId])

  return { approval, reportContacts, reportDenial }
}