import { resilientFetch } from "@/lib/network"
import { withStaleFallback } from "@/lib/stale-cache"

export type AnnouncementPriority = "default" | "medium" | "max"

export interface Announcement {
  id: number
  title: string
  content: string
  // Date de publication (ISO)
  date: string
  // L'API l'expose sur sa vue publique : sans elle, une alerte rouge du Haut Conseil serait
  // indiscernable d'un communiqué ordinaire sur la page d'accueil.
  priority: AnnouncementPriority
}

export interface AnnouncementsPage {
  announcements: Announcement[]
  total: number
}

interface PublicAnnouncement {
  id: number
  title: string
  content: string
  publishedAt: string
  priority?: AnnouncementPriority
}

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "")

// Une annonce antérieure à cette version de l'API peut ne pas renvoyer de priorité :
// "default" garde le rendu historique plutôt que d'afficher une pastille d'alerte inventée.
const asPriority = (value: PublicAnnouncement["priority"]): AnnouncementPriority =>
  value === "medium" || value === "max" ? value : "default"

/**
 * Annonces publiées par les agents et administrateurs de la ville.
 * Route publique de l'API : aucune session requise.
 */
export function getAnnouncements(page = 1, limit = 9): Promise<AnnouncementsPage> {
  // Repli sur la dernière réponse connue si l'API est lente ou injoignable
  return withStaleFallback(`announcements:${page}:${limit}`, () => fetchAnnouncements(page, limit))
}

async function fetchAnnouncements(page: number, limit: number): Promise<AnnouncementsPage> {
  if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL n'est pas configurée.")

  const response = await resilientFetch(`${API_URL}/public/announcements?page=${page}&limit=${limit}`)
  if (!response.ok) throw new Error(`Erreur ${response.status}`)

  const body: { announcements: PublicAnnouncement[]; total: number } = await response.json()
  return {
    total: body.total,
    announcements: body.announcements.map(({ id, title, content, publishedAt, priority }) => ({
      id,
      title,
      content,
      date: publishedAt,
      priority: asPriority(priority),
    })),
  }
}
