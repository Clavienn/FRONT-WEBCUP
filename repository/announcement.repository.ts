import { authorizedRequest } from "@/repository/auth.repository"

export type AnnouncementStatus = "draft" | "published" | "archived"

export interface Announcement {
  id: number
  title: string
  content: string
  status: AnnouncementStatus
  author: { id: number; firstName: string; lastName: string } | null
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface AnnouncementPage {
  announcements: Announcement[]
  page: number
  limit: number
  total: number
}

export interface AnnouncementInput {
  title: string
  content: string
  status: AnnouncementStatus
}

export interface AnnouncementQuery {
  q?: string
  // Réservé aux gestionnaires (ignoré par le serveur pour un citoyen) ; "all" = tous les statuts
  status?: AnnouncementStatus | "all"
  page?: number
  limit?: number
}

const json = (method: string, data: unknown): RequestInit => ({ method, body: JSON.stringify(data) })

export const announcementRepository = {
  list(query: AnnouncementQuery = {}) {
    const params = new URLSearchParams()
    if (query.q) params.set("q", query.q)
    if (query.status) params.set("status", query.status)
    if (query.page) params.set("page", String(query.page))
    if (query.limit) params.set("limit", String(query.limit))
    const search = params.toString()
    return authorizedRequest<AnnouncementPage>(`/announcements${search ? `?${search}` : ""}`)
  },

  get: (id: number) => authorizedRequest<Announcement>(`/announcements/${id}`),

  create: (data: AnnouncementInput) => authorizedRequest<Announcement>("/announcements", json("POST", data)),

  update: (id: number, data: Partial<AnnouncementInput>) =>
    authorizedRequest<Announcement>(`/announcements/${id}`, json("PATCH", data)),

  remove: (id: number) => authorizedRequest<void>(`/announcements/${id}`, { method: "DELETE" }),
}

export const statusLabels: Record<AnnouncementStatus, string> = {
  draft: "Brouillon",
  published: "Publiée",
  archived: "Archivée",
}
