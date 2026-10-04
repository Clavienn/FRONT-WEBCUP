"use client"

import { Siren } from "lucide-react"

import { useLanguage } from "@/components/i18n/language-provider"
import { Badge } from "@/components/ui/badge"
import type { SignalementPriority, SignalementStatus } from "@/repository/signalement.repository"

// Le niveau d'urgence se lit à la couleur : rouge = à traiter en premier
export const PRIORITY_STYLES: Record<SignalementPriority, string> = {
  urgent: "border-red-600/40 bg-red-600 text-white",
  high: "border-orange-500/40 bg-orange-500/15 text-orange-800 dark:text-orange-200",
  medium: "border-sky-500/30 bg-sky-500/10 text-sky-800 dark:text-sky-200",
  low: "border-border bg-muted/50 text-muted-foreground",
}

export const STATUS_STYLES: Record<SignalementStatus, string> = {
  new: "border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-200",
  acknowledged: "border-sky-500/30 bg-sky-500/10 text-sky-800 dark:text-sky-200",
  in_progress: "border-indigo-500/30 bg-indigo-500/10 text-indigo-800 dark:text-indigo-200",
  resolved: "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
  cancelled: "border-border bg-muted/50 text-muted-foreground",
}

export function PriorityBadge({ priority }: { priority: SignalementPriority }) {
  const { t } = useLanguage()
  return (
    <Badge variant="outline" className={`gap-1 ${PRIORITY_STYLES[priority]}`}>
      {priority === "urgent" && <Siren className="size-3" aria-hidden="true" />}
      {t(`signalements.priority.${priority}`)}
    </Badge>
  )
}

export function StatusBadge({ status }: { status: SignalementStatus }) {
  const { t } = useLanguage()
  return (
    <Badge variant="outline" className={STATUS_STYLES[status]}>
      {t(`signalements.status.${status}`)}
    </Badge>
  )
}

// 135 -> "2 h 15 min" ; 20 -> "20 min"
export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${Math.max(0, Math.round(minutes))} min`
  const hours = Math.floor(minutes / 60)
  const rest = Math.round(minutes % 60)
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`
}
