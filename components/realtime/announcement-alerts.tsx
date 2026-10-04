"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { io } from "socket.io-client"

import { useAuth } from "@/components/auth/auth-provider"
import { useLanguage } from "@/components/i18n/language-provider"
import { toast } from "@/components/ui/toast"

// Événement émis par l'API (src/realtime/announcementChannel.ts)
const PUBLISHED_EVENT = "announcement:published"

// L'API est exposée sous /api pour le HTTP ; socket.io se connecte à la racine du même hôte.
const SOCKET_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "").replace(/\/api$/, "")

// La description peut faire 65 000 caractères : la bulle n'en montre qu'un extrait
const MAX_DESCRIPTION_LENGTH = 180

interface BroadcastAnnouncement {
  id: number
  title: string
  content: string
  priority: "default" | "medium" | "max"
  publishedAt: string | null
}

// Alerte temps réel des annonces : rouge pour le Haut Conseil (max), jaune pour une annonce
// prioritaire (medium), rien pour une annonce normale (default).
// Monté à la racine du site, donc présent sur la page publique comme dans les tableaux de bord.
export function AnnouncementAlerts() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const router = useRouter()
  // La destination dépend de la session, qui est rafraîchie périodiquement : on la garde dans une
  // ref pour ne pas reconnecter le canal à chaque rafraîchissement.
  const isAuthenticated = useRef(false)
  useEffect(() => {
    isAuthenticated.current = user !== null
  }, [user])

  useEffect(() => {
    if (!SOCKET_URL) return

    const socket = io(SOCKET_URL, { transports: ["websocket", "polling"] })

    const openAnnouncement = (id: number) => () =>
      // Un visiteur anonyme n'a pas accès au détail : on le renvoie à la liste publique
      router.push(isAuthenticated.current ? `/dashboard/announcements/detail?id=${id}` : "/#annonces")

    const onPublished = (announcement: BroadcastAnnouncement) => {
      if (announcement.priority === "default") return
      const urgent = announcement.priority === "max"
      toast.add({
        title: t(urgent ? "announcementAlerts.urgentTitle" : "announcementAlerts.cautionTitle"),
        description: `${announcement.title} — ${announcement.content.slice(0, MAX_DESCRIPTION_LENGTH)}${
          announcement.content.length > MAX_DESCRIPTION_LENGTH ? "…" : ""
        }`,
        // "urgent" et "caution" sont des types additionsnels du composant Toast (teinte rouge / jaune)
        type: urgent ? "urgent" : "caution",
        priority: "high",
        actionProps: {
          children: t("announcementAlerts.view"),
          onClick: openAnnouncement(announcement.id),
        },
      })
    }

    socket.on(PUBLISHED_EVENT, onPublished)
    return () => {
      socket.off(PUBLISHED_EVENT, onPublished)
      socket.disconnect()
    }
  }, [t, router])

  return null
}