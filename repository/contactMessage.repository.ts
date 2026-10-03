import { authorizedRequest } from "@/repository/auth.repository"

export type ContactStatus = "new" | "read" | "processed"

export interface ContactMessage {
  id: number
  subject: string
  message: string
  status: ContactStatus
  sentAt: string
  confirmedAt: string | null
  // Présent uniquement dans la vue des agents ; null si le compte de l'expéditeur a été supprimé
  sender?: { id: number; email: string; firstName: string; lastName: string } | null
}

export interface ContactReceipt {
  confirmation: string
  contactMessage: ContactMessage
}

export interface ContactInbox {
  messages: ContactMessage[]
  // Total par statut sur tous les messages, quel que soit le filtre
  counts: Record<ContactStatus, number>
  page: number
  limit: number
  total: number
}

export interface ContactInboxQuery {
  status?: ContactStatus | "all"
  q?: string
  page?: number
  limit?: number
}

export const contactStatusLabels: Record<ContactStatus, string> = {
  new: "Nouveau",
  read: "Lu",
  processed: "Traité",
}

export const contactMessageRepository = {
  // Citoyen : envoyer un message aux services municipaux
  send: (data: { subject: string; message: string }) =>
    authorizedRequest<ContactReceipt>("/contact-messages", { method: "POST", body: JSON.stringify(data) }),

  // Citoyen : suivre ses messages
  listMine: () => authorizedRequest<ContactMessage[]>("/contact-messages/mine"),

  get: (id: number) => authorizedRequest<ContactMessage>(`/contact-messages/${id}`),

  // Agent / admin : boîte de réception
  listInbox(query: ContactInboxQuery = {}) {
    const params = new URLSearchParams()
    if (query.status) params.set("status", query.status)
    if (query.q) params.set("q", query.q)
    if (query.page) params.set("page", String(query.page))
    if (query.limit) params.set("limit", String(query.limit))
    const search = params.toString()
    return authorizedRequest<ContactInbox>(`/contact-messages${search ? `?${search}` : ""}`)
  },

  setStatus: (id: number, status: ContactStatus) =>
    authorizedRequest<ContactMessage>(`/contact-messages/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
}
