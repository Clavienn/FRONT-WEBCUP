import type { Announcement, AnnouncementPriority } from "@/repository/announcement.repository"

// ── Rappel durable des annonces prioritaires ─────────────────
//
// L'alerte temps réel de la publication ne vit que quelques secondes : l'habitant qui n'était pas
// devant son écran la rate définitivement. La notification de la cloche couvre ce cas, mais elle
// reste un compteur passif derrière un clic, et elle est générée par l'API à la lecture.
//
// Ce module choisit la même annonce que celle que l'API notifierait, pour que le rappel et la
// cloche parlent de la même chose. Les règles sont volontairement identiques à
// `ensureAnnouncementNotifications` (API-WEBCUP/src/models/notification.model.ts) :
//   - priorité medium ou max (une annonce standard n'est pas une alerte),
//   - publiée, pas brouillon ni archive,
//   - publiée depuis moins de sept jours (au-delà, ce n'est plus une actualité),
//   - écrite par quelqu'un d'autre (on ne relance pas son auteur sur sa propre annonce).
//
// Aucune nouvelle donnée n'est demandée à l'API : la liste des annonces contient déjà tout ça.

export const ANNOUNCEMENT_ALERT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

/** Nombre d'annonces inspectées au chargement. Au-delà d'une ou deux alertes, l'ordre de tri
 *  du serveur place de toute façon l'annonce la plus récente en tête. */
export const ANNOUNCEMENT_ALERT_LOOKUP_LIMIT = 5

const isAlertPriority = (priority: AnnouncementPriority) => priority === "medium" || priority === "max"

/**
 * Annonce prioritaire la plus récente que cet utilisateur n'a pas encore vue, ou `null`.
 *
 * `now` et `userId` sont injectable pour que la décision soit testable et explicite : la
 * fraîcheur et l'auteur sont deux critères d'affichage, pas des détails de l'horloge.
 */
export function pickAlertAnnouncement(
  announcements: readonly Announcement[],
  userId: number,
  now: number = Date.now()
): Announcement | null {
  const eligible = announcements.filter((announcement) => {
    if (!isAlertPriority(announcement.priority)) return false
    // L'auteur ne voit pas le rappel de sa propre annonce.
    if (announcement.author?.id === userId) return false

    const publishedAt = announcement.publishedAt ? Date.parse(announcement.publishedAt) : Number.NaN
    // Date absente ou illisible : on ne devine pas l'actualité, on n'alerte pas.
    if (Number.isNaN(publishedAt)) return false

    return now - publishedAt < ANNOUNCEMENT_ALERT_MAX_AGE_MS
  })

  if (eligible.length === 0) return null

  // Le serveur trie déjà par publication décroissante, mais la décision ici ne doit pas
  // dépendre de cet ordre : deux annonces publiées le même jour peuvent être rangées par id.
  return eligible.reduce((latest, announcement) =>
    Date.parse(announcement.publishedAt as string) > Date.parse(latest.publishedAt as string)
      ? announcement
      : latest
  )
}

// ── Annonces mises de côté ──────────────────────────────
//
// Stockage local et non session : « Ne plus afficher » doit survivre à la fermeture du
// navigateur, sinon le rappel reviendrait le lendemain, ce qui en ferait une annonce plutôt
// qu'un rappel. Mémorisé par compte, pour que deux personnes qui se succèdent sur le même poste
// ne se cachent mutuellement la même annonce.

const STORAGE_KEY = "terra-nova:announcement-alerts"

// Garde-fou contre une liste qui grossit indéfiniment : seules les alertes récentes
// importent, l'ancien identifiant n'est plus jamais resélectionné.
const MAX_REMEMBERED = 30

interface Dismissals {
  userId: number
  ids: number[]
}

function readDismissals(userId: number): number[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== "object") return []
    const { userId: storedId, ids } = parsed as { userId?: unknown; ids?: unknown }
    if (storedId !== userId || !Array.isArray(ids)) return []
    return ids.filter((id): id is number => typeof id === "number" && Number.isInteger(id))
  } catch {
    return []
  }
}

export function isAlertDismissed(userId: number, announcementId: number): boolean {
  return readDismissals(userId).includes(announcementId)
}

export function dismissAlert(userId: number, announcementId: number): void {
  if (typeof window === "undefined") return
  try {
    const ids = readDismissals(userId).filter((id) => id !== announcementId)
    ids.unshift(announcementId)
    const kept = ids.slice(0, MAX_REMEMBERED)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ userId, ids: kept } satisfies Dismissals))
  } catch {
    // Navigation privée ou quota plein : le rappel réapparaîtra, ce qui vaut mieux que de
    // laisser croire à un masquage qui n'a pas eu lieu.
  }
}