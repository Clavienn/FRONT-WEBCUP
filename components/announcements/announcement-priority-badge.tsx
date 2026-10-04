"use client"

import { Siren, TriangleAlert } from "lucide-react"

import { useLanguage } from "@/components/i18n/language-provider"
import { Badge } from "@/components/ui/badge"
import type { AnnouncementPriority } from "@/repository/announcement.repository"

// Priorité d'une annonce. "default" n'affiche rien : une pastille sur chaque annonce
// noierait la liste pour une information qui n'a rien d'urgent.
const TONES: Record<Exclude<AnnouncementPriority, "default">, string> = {
  medium: "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200",
  max: "border-destructive/40 bg-destructive/10 text-destructive",
}

export function AnnouncementPriorityBadge({ priority }: { priority: AnnouncementPriority }) {
  const { t } = useLanguage()
  if (priority === "default") return null

  const Icon = priority === "max" ? Siren : TriangleAlert
  return (
    <Badge variant="outline" className={`gap-1 ${TONES[priority]}`}>
      <Icon className="size-3" aria-hidden="true" />
      {t(`announcementPriorities.${priority}`)}
    </Badge>
  )
}