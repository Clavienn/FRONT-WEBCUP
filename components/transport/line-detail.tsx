"use client"

import { useEffect, useState } from "react"
import { Accessibility, CircleAlert } from "lucide-react"

import { useLanguage } from "@/components/i18n/language-provider"
import { DisruptionCard, LineChip, StateBadge } from "@/components/transport/transport-ui"
import { Skeleton } from "@/components/ui/skeleton"
import { transportRepository, type LineDetail as LineDetailData } from "@/repository/transport.repository"

// Une ligne : son état, ses infos pratiques, ses arrêts (ceux qui ne sont plus desservis en rouge),
// ses horaires et les prochains départs des deux terminus
export function LineDetail({ code }: { code: string }) {
  const { t, locale } = useLanguage()
  const lang = locale === "en" ? "en" : "fr"
  const [line, setLine] = useState<LineDetailData | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    let mounted = true
    transportRepository
      .line(code)
      .then((data) => mounted && setLine(data))
      .catch((cause) => mounted && setError(cause instanceof Error ? cause.message : t("transport.loadError")))
    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- une ligne à la fois
  }, [code])

  if (error) {
    return (
      <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
        <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        {error}
      </p>
    )
  }
  if (!line) return <Skeleton className="h-64 rounded-xl" />

  const unserved = new Set(line.disruptions.flatMap((disruption) => disruption.unservedStops))
  const info = line.timetable

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <LineChip line={line} size="lg" />
        <StateBadge state={line.state} label={line.stateLabel[lang]} />
        <span className="text-sm text-muted-foreground">{line.modeLabel[lang]}</span>
        {line.info.accessible && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <Accessibility className="size-3.5" aria-hidden="true" />
            {t("transport.accessible")}
          </span>
        )}
      </div>

      {line.disruptions.map((disruption) => (
        <DisruptionCard key={disruption.id} disruption={disruption} showLine={false} />
      ))}

      <dl className="grid gap-3 rounded-xl border border-border/70 bg-background/50 p-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-muted-foreground">{t("transport.service")}</dt>
          <dd>{info.days ? info.days[lang] : "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">{t("transport.hours")}</dt>
          <dd>{info.first && info.last ? `${info.first} – ${info.last}` : "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">{t("transport.frequency")}</dt>
          <dd>{info.frequencyMinutes ? t("transport.everyMinutes", { count: info.frequencyMinutes }) : "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">{t("transport.travelTime")}</dt>
          <dd>{t("transport.minutes", { count: info.travelMinutes })}</dd>
        </div>
        {info.peaks.length > 0 && (
          <div className="sm:col-span-2">
            <dt className="text-xs text-muted-foreground">{t("transport.peaks")}</dt>
            <dd>{info.peaks.map((peak) => `${peak.from}–${peak.to} : ${t("transport.everyMinutes", { count: peak.every })}`).join(" · ")}</dd>
          </div>
        )}
        {info.notes && (
          <div className="sm:col-span-2">
            <dt className="text-xs text-muted-foreground">{t("transport.notes")}</dt>
            <dd>{info.notes}</dd>
          </div>
        )}
      </dl>

      <section aria-label={t("transport.stopsTitle")}>
        <h3 className="mb-2 text-sm font-semibold">{t("transport.stopsTitle")}</h3>
        <ol className="relative ml-2 space-y-0 border-l-4" style={{ borderColor: line.color }}>
          {line.stops.map((stop) => {
            const cut = unserved.has(stop)
            return (
              <li key={stop} className="relative -ml-px pb-3 pl-5 last:pb-0">
                <span
                  className={`absolute -left-[9px] top-1 size-3.5 rounded-full border-2 bg-background ${cut ? "border-red-600" : ""}`}
                  style={cut ? undefined : { borderColor: line.color }}
                  aria-hidden="true"
                />
                <span className={`text-sm ${cut ? "font-semibold text-red-700 line-through dark:text-red-300" : ""}`}>{stop}</span>
                {cut && <span className="ml-2 text-xs font-semibold text-red-700 dark:text-red-300">{t("transport.notServed")}</span>}
              </li>
            )
          })}
        </ol>
      </section>

      <section aria-label={t("transport.nextDepartures")} className="space-y-2">
        <h3 className="text-sm font-semibold">{t("transport.nextDepartures")}</h3>
        <ul className="grid gap-2 sm:grid-cols-2">
          {line.nextFromTermini.map((terminus) => (
            <li key={terminus.from} className="rounded-xl border border-border/70 bg-background/50 p-3 text-sm">
              <p className="font-medium">{terminus.from} → {terminus.towards}</p>
              <p className="mt-1 flex flex-wrap gap-2">
                {terminus.departures.length === 0 ? (
                  <span className="text-muted-foreground">{t("transport.noDeparture")}</span>
                ) : (
                  terminus.departures.map((departure) => (
                    <span key={departure.time + departure.tomorrow} className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold tabular-nums">
                      {departure.tomorrow ? `${t("transport.tomorrow")} ` : ""}
                      {departure.time}
                      {!departure.tomorrow && ` · ${t("transport.inMinutes", { count: departure.inMinutes })}`}
                    </span>
                  ))
                )}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-label={t("transport.timetable")} className="space-y-2">
        <h3 className="text-sm font-semibold">{t("transport.timetable")}</h3>
        <p className="text-xs text-muted-foreground">{t("transport.timetableHint")}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {info.directions.map((direction) => (
            <div key={direction.towards} className="rounded-xl border border-border/70 bg-background/50 p-3 text-sm">
              <p className="mb-1 font-medium">{t("transport.towards", { stop: direction.towards })}</p>
              <ul className="space-y-0.5">
                {direction.stops.map((stop) => (
                  <li key={stop.name} className="flex justify-between gap-2">
                    <span className={unserved.has(stop.name) ? "text-red-700 line-through dark:text-red-300" : ""}>{stop.name}</span>
                    <span className="tabular-nums text-muted-foreground">+{stop.minutesFromStart} min</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
