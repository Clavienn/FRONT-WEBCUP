import { authorizedRequest } from "@/repository/auth.repository"

export interface AppNotification {
  id: number
  type: string
  title: string
  body: string
  appointmentId: number | null
  read: boolean
  createdAt: string
}

export interface NotificationPage {
  notifications: AppNotification[]
  limit: number
  offset: number
  total: number
  unread: number
}

function list(onlyUnread?: boolean): Promise<NotificationPage> {
  return authorizedRequest<NotificationPage>(`/notifications${onlyUnread ? "?onlyUnread=true" : ""}`)
}

async function unreadCount(): Promise<number> {
  const { unread } = await authorizedRequest<{ unread: number }>("/notifications/unread-count")
  return unread
}

function markRead(id: number): Promise<void> {
  return authorizedRequest<void>(`/notifications/${id}/read`, { method: "PATCH" })
}

async function markAllRead(): Promise<number> {
  const { updated } = await authorizedRequest<{ updated: number }>("/notifications/read-all", { method: "POST" })
  return updated
}

export const notificationRepository = { list, unreadCount, markRead, markAllRead }
