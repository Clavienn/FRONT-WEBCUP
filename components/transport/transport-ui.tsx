"use client"

import Link from "next/link"
import { Bus, CableCar, Footprints, PhoneCall, Route, Ship, TramFront, TriangleAlert, type LucideIcon } from "lucide-react"

import { useLanguage } from "@/components/i18n/language-provider"
import type { Alternative, AlternativeKind, Disruption, LineRef, LineState, TransportMode } from "@/repository/transport.repository"

const MODE_ICONS: Record<TransportMode, LucideIcon> = { bus: Bus, tram: TramFront, shuttle: Ship, cable: CableCar }

// Noir ou blanc selon la luminosité de la couleur de la ligne : le code reste lisible sur toute couleur
function contrastColor(hex: string): string {
  const match = /^#?([0-9a-f]{6})$/i.exec(hex)
  if (!match) return "#ffffff"
  const value = parseInt(match[1], 16)
  const luminance = (0.299 * ((value >> 16) & 255) + 0.587 * ((value >> 8) & 255) + 0.114 * (value & 255)) / 255
  return luminance > 0.6 ? "#111827" : "#ffffff"
}

// Pastille de ligne : sa couleur, son code, son mode. C'est ce qui est écrit sur le véhicule.
export function LineChip({ line, size = "md", replacement }: { line: LineRef; size?: "sm" | "md" | "lg"; replacement?: boolean }) {
  const { t } = useLanguage()
  const Icon = MODE_ICONS[line.mode] ?? Bus
  const sizes = { sm: "px-1.5 py-0.5 text-xs", md: "px-2 py-1 text-sm", lg: "px-3 py-1.5 text-base" }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md font-bold ${sizes[size]}`}
      style={{ backgroundColor: line.color, color: contrastColor(line.color) }}
      title={line.name}
    >
      <Icon className={size === "sm" ? "size-3" : "size-4"} aria-hidden="true" />
      {line.code}
      {replacement && <span className="text-[10px] font-semibold uppercase opacity-90">{t("transport.replacementShort")}</span>}
    </span>
  )
}

const STATE_STYLES: Record<LineState, string> = {
  normal: "border-emerald-600/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
  delayed: "border-amber-600/50 bg-amber-500/15 text-amber-900 dark:text-amber-100",
  interrupted: "border-red-600/50 bg-red-600/10 text-red-800 dark:text-red-200",
}

export function StateBadge({ state, label }: { state: LineState; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATE_STYLES[state]}`}>
      {state !== "normal" && <TriangleAlert className="size-3" aria-hidden="true" />}
      {label}
    </span>
  )
}

const ALTERNATIVE_ICONS: Record<AlternativeKind, LucideIcon> = {
  line: Route,
  replacement_bus: Bus,
  walk: Footprints,
  on_demand: PhoneCall,
  other: Route,
}

// Solutions de remplacement proposées par les services : phrases à lire telles quelles
export function AlternativeList({ alternatives }: { alternatives: Alternative[] }) {
  const { locale } = useLanguage()
  const lang = locale === "en" ? "en" : "fr"
  if (alternatives.length === 0) return null
  return (
    <ul className="space-y-1.5">
      {alternatives.map((alternative, index) => {
        const Icon = ALTERNATIVE_ICONS[alternative.kind] ?? Route
        return (
          <li key={index} className="flex items-start gap-2 text-sm">
            <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>
              {alternative.kindLabel && <span className="font-semibold">{alternative.kindLabel[lang]} : </span>}
              {alternative.text}
              {alternative.extraMinutes ? <span className="text-muted-foreground"> (+{alternative.extraMinutes} min)</span> : null}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

export function formatClock(value: string | null | undefined, locale: string): string {
  if (!value) return "—"
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return "—"
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(date)
}

// Une interruption : ce qui se passe, pourquoi, jusqu'à quand, QUE FAIRE à la place
export function DisruptionCard({ disruption, showLine = true }: { disruption: Disruption; showLine?: boolean }) {
  const { t, locale } = useLanguage()
  const lang = locale === "en" ? "en" : "fr"
  const cut = disruption.kind === "interrupted"
  return (
    <article
      role="status"
      className={`rounded-xl border-2 p-4 ${cut ? "border-red-600/60 bg-red-600/10" : "border-amber-500/60 bg-amber-500/10"}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        {showLine && <LineChip line={disruption.line} />}
        <p className="font-semibold">{disruption.headline[lang]}</p>
      </div>
      <p className="mt-1.5 text-sm">{t("transport.reason", { reason: disruption.reason })}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {disruption.expectedEndAt
          ? t("transport.expectedEnd", { date: formatClock(disruption.expectedEndAt, locale) })
          : t("transport.noExpectedEnd")}
      </p>

      {disruption.unservedStops.length > 0 && (
        <p className="mt-2 text-sm">
          <span className="font-semibold">{t("transport.unservedStops")} </span>
          {disruption.unservedStops.join(", ")}
        </p>
      )}

      {disruption.alternatives.length > 0 && (
        <div className="mt-3">
          <p className="mb-1 text-xs font-bold uppercase tracking-wide">{t("transport.whatToDo")}</p>
          <AlternativeList alternatives={disruption.alternatives} />
        </div>
      )}

      {disruption.suggestedLines.length > 0 && (
        <div className="mt-3">
          <p className="mb-1 text-xs font-bold uppercase tracking-wide">{t("transport.stillServed")}</p>
          <ul className="flex flex-wrap gap-2">
            {disruption.suggestedLines.map((line) => (
              <li key={line.code} className="flex items-center gap-1.5 text-xs">
                <LineChip line={line} size="sm" />
                <span className="text-muted-foreground">{line.servesStops.slice(0, 3).join(", ")}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  )
}

// Lien vers le planificateur de trajet, depuis une alerte ou une ligne touchée
export function FindRouteLink({ href = "/transports?tab=journey" }: { href?: string }) {
  const { t } = useLanguage()
  return (
    <Link href={href} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-red-700 underline-offset-4 hover:underline">
      <Route className="size-4" aria-hidden="true" />
      {t("transport.findRoute")}
    </Link>
  )
}
