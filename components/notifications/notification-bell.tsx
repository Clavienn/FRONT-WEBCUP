"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Bell, CheckCheck, CircleAlert } from "lucide-react"

import { useLanguage } from "@/components/i18n/language-provider"
import type { Locale } from "@/lib/i18n/types"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
import { notificationRepository, type AppNotification } from "@/repository/notification.repository"

// La date d'émission est formatée dans la locale de l'interface : un horodatage reste
// lisible même si le corps du rappel a été généré dans l'autre langue (rappel plus ancien,
// créé avant un changement de langue).
function formatTimestamp(value: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value))
}

// Pas de WebSocket dans ce projet : un sondage espacé suffit à faire apparaître un
// rappel sans recharger la page, sans justifier une connexion persistante.
const POLL_MS = 45_000

// Corps d'une notification, partagé par la variante lien et la variante bouton : seul l'élément
// interactif change selon qu'il existe une destination à ouvrir.
function renderContent(
  notification: AppNotification,
  locale: Locale,
  t: (key: string) => string,
) {
  return (
    <>
      <p className="flex items-start gap-2 text-sm font-medium">
        {!notification.read && (
          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
        )}
        <span>{notification.title}</span>
      </p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{notification.body}</p>
      <p className="mt-1 text-[11px] text-muted-foreground/80">
        {formatTimestamp(notification.createdAt, locale)}
        {notification.requestId && (
          <span className="ml-1 font-medium text-primary">{t("notifications.viewRequest")}</span>
        )}
      </p>
    </>
  )
}

export function NotificationBell() {
  const { t, locale } = useLanguage()
  const [unread, setUnread] = useState(0)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [notifications, setNotifications] = useState<AppNotification[] | null>(null)

  const refreshUnread = useCallback(() => {
    notificationRepository.unreadCount().then(setUnread).catch(() => undefined)
  }, [])

  useEffect(() => {
    refreshUnread()
    const interval = setInterval(refreshUnread, POLL_MS)
    return () => clearInterval(interval)
  }, [refreshUnread])

  const loadList = useCallback(() => {
    setLoading(true)
    setError("")
    notificationRepository
      .list()
      .then((page) => {
        setNotifications(page.notifications)
        setUnread(page.unread)
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : t("notifications.errorLoad")))
      .finally(() => setLoading(false))
  }, [t])

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (next) loadList()
  }

  const handleMarkRead = (id: number) => {
    notificationRepository
      .markRead(id)
      .then(() => {
        setNotifications((list) => list?.map((n) => (n.id === id ? { ...n, read: true } : n)) ?? null)
        setUnread((count) => Math.max(0, count - 1))
      })
      .catch(() => undefined)
  }

  const handleMarkAllRead = () => {
    notificationRepository
      .markAllRead()
      .then(() => {
        setNotifications((list) => list?.map((n) => ({ ...n, read: true })) ?? null)
        setUnread(0)
      })
      .catch(() => undefined)
  }

  const hasUnreadInList = notifications?.some((n) => !n.read) ?? false

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={<Button variant="ghost" size="icon" className="relative" aria-label={t("notifications.bellAriaLabel")} />}
      >
        <Bell aria-hidden="true" />
        {unread > 0 && (
          <span
            aria-hidden="true"
            className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground"
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border/70 px-3 py-2">
          <p className="text-sm font-semibold">{t("notifications.title")}</p>
          {hasUnreadInList && (
            <Button variant="ghost" size="sm" onClick={handleMarkAllRead} className="h-7 px-2 text-xs">
              <CheckCheck className="size-3.5" aria-hidden="true" />
              {t("notifications.markAllRead")}
            </Button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto p-2">
          {loading && (
            <div className="space-y-2 p-1" aria-hidden="true">
              <Skeleton className="h-14 w-full rounded-lg" />
              <Skeleton className="h-14 w-full rounded-lg" />
            </div>
          )}

          {!loading && error && (
            <p role="alert" className="flex items-start gap-2 p-2 text-xs text-destructive">
              <CircleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              {error}
            </p>
          )}

          {!loading && !error && notifications?.length === 0 && (
            <p className="p-3 text-center text-sm text-muted-foreground">{t("notifications.empty")}</p>
          )}

          {!loading && !error && notifications && notifications.length > 0 && (
            <ul className="space-y-1.5">
              {notifications.map((notification) => (
                <li key={notification.id}>
                  {/* Une notification de demande se consulte sur place : un lien, sinon le citoyen
                      doit retrouver son dossier lui-même après avoir lu "refusée, motif : ..." */}
                  {notification.requestId ? (
                    <Link
                      href="/dashboard/my-requests"
                      onClick={() => !notification.read && handleMarkRead(notification.id)}
                      className={`block rounded-lg p-2.5 transition-colors hover:bg-accent/60 ${notification.read ? "opacity-60" : "bg-accent/30"}`}
                    >
                      {renderContent(notification, locale, t)}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => !notification.read && handleMarkRead(notification.id)}
                      className={`w-full rounded-lg p-2.5 text-left transition-colors hover:bg-accent/60 ${notification.read ? "opacity-60" : "bg-accent/30"}`}
                    >
                      {renderContent(notification, locale, t)}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
