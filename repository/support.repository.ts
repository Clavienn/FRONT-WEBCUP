import { authorizedRequest } from "@/repository/auth.repository"

export type SupportStatus = "open" | "answered" | "closed"

export interface SupportConversation {
  id: string
  requesterId: string
  senderEmail: string
  senderName: string | null
  subject: string
  status: SupportStatus
  lastMessageAt: string | null
  createdAt: string
  latestMessage: string | null
  latestSenderRole: string | null
}

export interface SupportReceipt {
  confirmation: string
  conversation: Pick<SupportConversation, "id" | "subject" | "status" | "createdAt">
}

export const supportRepository = {
  create: (data: { subject: string; message: string }) =>
    authorizedRequest<SupportReceipt>("/support/messages", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  listMine: () => authorizedRequest<SupportConversation[]>("/support/messages/mine"),

  listAdmin: () => authorizedRequest<SupportConversation[]>("/support/messages/admin"),

  reply: (id: string, reply: string) =>
    authorizedRequest<SupportConversation>(`/support/messages/${encodeURIComponent(id)}/reply`, {
      method: "POST",
      body: JSON.stringify({ reply }),
    }),
}