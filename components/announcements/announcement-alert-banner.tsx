"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Siren, TriangleAlert, X } from "lucide-react"

import {
  ANNOUNCEMENT_ALERT_LOOKUP_LIMIT,
  dismissAlert,
  isAlertDismissed,
  pickAlertAnnouncement,
} from "@/lib/announcement-alerts"
import { useLanguage } from "@/components/i18n/language-provider"
import { Button } from "@/components/ui/button"
import { announcementRepository, type Announcement } from "@/repository/announcement.repository"

// Le rappel prend la couleur de l'alerte temps réel qu'il prolonge : rouge pour le Haut Conseil,
// jaune pour une annonce prioritaire. Rien pour une annonce standard, qui n'est pas une alerte.
const TONES = {
  medium: {
    wrapper: "border-amber-500/40 bg-amber-500/10",
    icon: "text-amber-700 dark:text-amber-300",
    button: "text-amber-800 hover:bg-amber-500/15 dark:text-amber-200 dark:hover:bg-amber-400/15",
  },
  max: {
    wrapper: "border-destructive/40 bg-destructive/10",
    icon: "text-destructive",
    button: "text-destructive hover:bg-destructive/15",
  },
} as const

/**
 * Rappel durable d'une annonce prioritaire que l'habitant n'a pas encore ouverte.
 *
 * L'alerte temps réel ne couvre que l'instant de la publication. Ce bandeau couvre celui qui
 * revient plus tard — le lendemain, la semaine suivante — et disparaît sur demande, pas tout
 * seul : un message du Haut Conseil qu'on laisse disparaître sans qu'on l'ait lu est un message
 * qui n'a pas été diffusé.
 *
 * Monté une fois pour tout le tableau de bord (le layout), il ne coûte qu'une requête par visite
 * et sert une réponse déjà mise en cache par l'API. Rien ne s'affiche tant que la réponse n'est
 * pas là : pas de bandeau qui saute, pas d'espace réservé pour rien.
 */
export function AnnouncementAlertBanner({ userId }: Readonly<{ userId: number }>) {
  const { t } = useLanguage()
  const [announcement, setAnnouncement] = useState<Announcement | null>(null)

  useEffect(() => {
    let active = true

    announcementRepository
      .list({ limit: ANNOUNCEMENT_ALERT_LOOKUP_LIMIT })
      .then((page) => {
        if (!active) return
        const alert = pickAlertAnnouncement(page.announcements, userId)
        setAnnouncement(alert && !isAlertDismissed(userId, alert.id) ? alert : null)
      })
      .catch(() => {
        // Rappel de confort, pas une information obligatoire : une requête en échec ne doit pas
        // laisser d'erreur visible, la cloche et la page des annonces couvrent déjà ce cas.
        if (active) setAnnouncement(null)
      })

    return () => {
      active = false
    }
  }, [userId])

  const handleDismiss = useCallback(() => {
    if (!announcement) return
    dismissAlert(userId, announcement.id)
    setAnnouncement(null)
  }, [announcement, userId])

  if (!announcement) return null

  const tone = TONES[announcement.priority === "max" ? "max" : "medium"]
  const Icon = announcement.priority === "max" ? Siren : TriangleAlert

  return (
    <div
      // role="status" et non "alert" : ce rappel ne signale pas une erreur du côté du lecteur,
      // il apporte une information. La région live l'annonce poliment, sans déplacer le focus :
      // un retrait de focus au milieu d'une saisie serait plus gênant que l'alerte.
      role="status"
      className={`flex flex-wrap items-start gap-x-4 gap-y-3 rounded-2xl border px-5 py-4 ${tone.wrapper}`}
    >
      <Icon className={`mt-0.5 size-5 shrink-0 ${tone.icon}`} aria-hidden="true" />

      <div className="min-w-0 flex-1 space-y-1">
        <p className={`text-sm font-semibold ${tone.icon}`}>
          {announcement.priority === "max"
            ? t("announcementHub.banner.urgentTitle")
            : t("announcementHub.banner.priorityTitle")}
        </p>
        <p className="line-clamp-2 text-sm text-foreground/90">{announcement.title}</p>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-1">
        <Button nativeButton={false} render={<Link href={`/dashboard/announcements/detail?id=${announcement.id}`} />} variant="ghost" size="sm">
          {t("announcementHub.readMore")}
        </Button>
        {/* Libellé explicite plutôt qu'une croix seule : c'est une décision de l'habitant,
            « fermer » et « ne plus me le montrer » ne se confondent pas. */}
        <Button variant="ghost" size="sm" onClick={handleDismiss} className={tone.button}>
          <X aria-hidden="true" />
          {t("announcementHub.banner.dismiss")}
        </Button>
      </div>
    </div>
  )
}
