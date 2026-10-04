import { resilientFetch } from "@/lib/network"
import { withStaleFallback } from "@/lib/stale-cache"

export interface Announcement {
  id: number
  title: string
  content: string
  // Date de publication (ISO)
  date: string
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
}

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "")

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
    announcements: body.announcements.map(({ id, title, content, publishedAt }) => ({
      id,
      title,
      content,
      date: publishedAt,
    })),
  }
}
