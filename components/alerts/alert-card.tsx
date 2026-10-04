"use client"

import { useState } from "react"
import {
  BadgeCheck,
  ChevronDown,
  CloudRain,
  Droplet,
  Droplets,
  Flame,
  HeartPulse,
  Info,
  OctagonAlert,
  ShieldAlert,
  TriangleAlert,
  Wind,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react"

import { useLanguage } from "@/components/i18n/language-provider"
import { Button } from "@/components/ui/button"
import type { AlertColor, AlertHazard, AlertZone, PublicAlert } from "@/repository/alert.repository"

// Le niveau se lit à la couleur avant de lire le texte : bleu, jaune, orange, rouge
const COLORS: Record<AlertColor, { box: string; chip: string; muted: string }> = {
  blue: {
    box: "border-sky-500 bg-sky-50 text-sky-950 dark:bg-sky-950/70 dark:text-sky-50",
    chip: "bg-sky-600 text-white",
    muted: "text-sky-900/80 dark:text-sky-100/80",
  },
  yellow: {
    box: "border-amber-500 bg-amber-50 text-amber-950 dark:bg-amber-950/70 dark:text-amber-50",
    chip: "bg-amber-500 text-amber-950",
    muted: "text-amber-900/80 dark:text-amber-100/80",
  },
  orange: {
    box: "border-orange-500 bg-orange-50 text-orange-950 dark:bg-orange-950/70 dark:text-orange-50",
    chip: "bg-orange-600 text-white",
    muted: "text-orange-900/80 dark:text-orange-100/80",
  },
  red: {
    box: "border-red-700 bg-red-600 text-white",
    chip: "bg-white text-red-700",
    muted: "text-white/90",
  },
}

const ENDED = {
  box: "border-emerald-600 bg-emerald-50 text-emerald-950 dark:bg-emerald-950/70 dark:text-emerald-50",
  chip: "bg-emerald-600 text-white",
  muted: "text-emerald-900/80 dark:text-emerald-100/80",
}

const HAZARD_ICONS: Record<AlertHazard, LucideIcon> = {
  flood: Droplets,
  heavy_rain: CloudRain,
  cyclone: Wind,
  fire: Flame,
  power_outage: Zap,
  water_outage: Droplet,
  security: ShieldAlert,
  health: HeartPulse,
  other: Info,
}

function formatDate(value: string, locale: string): string {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return "—"
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

interface AlertCardProps {
  alert: PublicAlert
  // Quartier de l'habitant : sert à dire « vous êtes concerné »
  zone: AlertZone | null
  // Ouverte d'emblée : toujours le cas quand il faut agir
  defaultOpen?: boolean
  // Fermeture (alertes d'information et fins d'alerte seulement : une alerte qui demande d'agir ne se ferme pas)
  onDismiss?: () => void
}

/**
 * Une alerte, dans l'ordre de lecture d'une personne inquiète : gravité et danger, où, ce qui se passe,
 * QUE FAIRE (liste numérotée), ce qui a changé depuis, jusqu'à quand. La fin d'alerte s'affiche en vert.
 */
export function AlertCard({ alert, zone, defaultOpen, onDismiss }: AlertCardProps) {
  const { t, locale } = useLanguage()
  const lang = locale === "en" ? "en" : "fr"
  const ended = alert.status === "ended"
  const colors = ended ? ENDED : COLORS[alert.color]
  const [open, setOpen] = useState(defaultOpen ?? alert.actionRequired)
  const [showUpdates, setShowUpdates] = useState(false)

  const HazardIcon = HAZARD_ICONS[alert.hazard] ?? Info
  const SeverityIcon = ended ? BadgeCheck : alert.severity === "emergency" ? OctagonAlert : alert.severity === "warning" ? TriangleAlert : HazardIcon
  const concerned = !!zone && (alert.zones.includes("all") || alert.zones.includes(zone))
  const zoneText = alert.zoneLabels[lang].join(", ")
  const latest = alert.updates[0]

  return (
    <article
      role={alert.actionRequired ? "alert" : "status"}
      aria-label={alert.headline[lang]}
      className={`overflow-hidden rounded-xl border-2 shadow-md ${colors.box}`}
    >
      <div className="flex items-start gap-3 p-4">
        <SeverityIcon className="mt-0.5 size-6 shrink-0" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${colors.chip}`}>
              {ended ? t("alerts.ended") : alert.severityLabel[lang]}
            </span>
            <span className={`inline-flex items-center gap-1 text-xs font-medium ${colors.muted}`}>
              <HazardIcon className="size-3.5" aria-hidden="true" />
              {alert.hazardLabel[lang]}
            </span>
            <span className={`text-xs font-semibold ${colors.muted}`}>· {zoneText}</span>
            {concerned && !ended && (
              <span className="rounded border border-current px-1.5 py-0.5 text-[11px] font-semibold uppercase">
                {t("alerts.concernsYou")}
              </span>
            )}
          </div>

          <h3 className="mt-1.5 text-lg font-bold leading-snug">{alert.title}</h3>

          {ended ? (
            <p className="mt-1 text-sm leading-6">{alert.endMessage || t("alerts.endedDefault")}</p>
          ) : (
            <>
              {/* Bandeau replié : seule la phrase d'en-tête reste, le détail est à un clic */}
              {open && (
                <>
                  <p className="mt-1 text-sm leading-6">{alert.message}</p>

                  {alert.instructions.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-bold uppercase tracking-wide">{t("alerts.whatToDo")}</p>
                      <ol className="mt-1.5 list-decimal space-y-1 pl-5 text-sm font-medium leading-6">
                        {alert.instructions.map((instruction, index) => (
                          <li key={index}>{instruction}</li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {latest && (
                    <div className={`mt-3 text-sm ${colors.muted}`}>
                      <p>
                        <span className="font-semibold">{t("alerts.updateAt", { date: formatDate(latest.at, locale) })}</span> {latest.message}
                      </p>
                      {alert.updates.length > 1 && (
                        <>
                          <button
                            type="button"
                            className="mt-1 cursor-pointer text-xs font-semibold underline underline-offset-2"
                            aria-expanded={showUpdates}
                            onClick={() => setShowUpdates((value) => !value)}
                          >
                            {showUpdates ? t("alerts.hideHistory") : t("alerts.showHistory", { count: alert.updates.length - 1 })}
                          </button>
                          {showUpdates && (
                            <ul className="mt-2 space-y-1.5 border-l-2 border-current pl-3">
                              {alert.updates.slice(1).map((update, index) => (
                                <li key={`${update.at}-${index}`}>
                                  <span className="font-semibold">{formatDate(update.at, locale)}</span> {update.message}
                                </li>
                              ))}
                            </ul>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  <p className={`mt-3 text-xs ${colors.muted}`}>
                    {t("alerts.validUntil", { date: formatDate(alert.expiresAt, locale) })} · {alert.issuer[lang]}
                  </p>
                </>
              )}
            </>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {!ended && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-current hover:bg-black/10 hover:text-current"
              aria-expanded={open}
              aria-label={open ? t("alerts.collapse") : t("alerts.expand")}
              onClick={() => setOpen((value) => !value)}
            >
              <ChevronDown className={`transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
            </Button>
          )}
          {onDismiss && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-current hover:bg-black/10 hover:text-current"
              aria-label={t("alerts.dismiss")}
              onClick={onDismiss}
            >
              <X aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>
    </article>
  )
}
