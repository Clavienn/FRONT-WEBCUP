"use client"

import { useEffect, useState, useSyncExternalStore, type FormEvent } from "react"
import { useSearchParams } from "next/navigation"
import { ArrowRightLeft, CircleAlert, Clock3, Footprints, MapPin, RefreshCw, Route, Search, ShieldCheck, Star } from "lucide-react"

import { LineDetail } from "@/components/transport/line-detail"
import { AlternativeList, DisruptionCard, LineChip, StateBadge } from "@/components/transport/transport-ui"
import { useMyLines, useTransportStatus } from "@/components/transport/use-transport"
import { useLanguage } from "@/components/i18n/language-provider"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { AuthApiError } from "@/repository/auth.repository"
import {
  transportRepository,
  type Journey,
  type JourneyOption,
  type StopCard,
  type StopSummary,
} from "@/repository/transport.repository"

type Tab = "network" | "journey" | "stop"

// ── Trajet habituel, mémorisé sur l'appareil : on vérifie d'abord s'il est touché ──
const JOURNEY_KEY = "terra-nova:my-journey"
const JOURNEY_EVENT = "terra-nova:my-journey-change"
let journeyRaw: string | null = null
let journeyValue: { from: string; to: string } | null = null

function readJourney() {
  try {
    const raw = window.localStorage.getItem(JOURNEY_KEY)
    if (raw !== journeyRaw) {
      journeyRaw = raw
      journeyValue = raw ? (JSON.parse(raw) as { from: string; to: string }) : null
    }
    return journeyValue
  } catch {
    return null
  }
}

function subscribeJourney(onChange: () => void) {
  window.addEventListener(JOURNEY_EVENT, onChange)
  window.addEventListener("storage", onChange)
  return () => {
    window.removeEventListener(JOURNEY_EVENT, onChange)
    window.removeEventListener("storage", onChange)
  }
}

function saveJourney(value: { from: string; to: string } | null) {
  try {
    if (value) window.localStorage.setItem(JOURNEY_KEY, JSON.stringify(value))
    else window.localStorage.removeItem(JOURNEY_KEY)
  } catch {
    // stockage indisponible : sans conséquence
  }
  window.dispatchEvent(new Event(JOURNEY_EVENT))
}

// ── Onglet « Réseau » ──────────────────────────────────────
function NetworkTab({ onOpenLine }: { onOpenLine: (code: string) => void }) {
  const { t, locale } = useLanguage()
  const lang = locale === "en" ? "en" : "fr"
  const { status, error, reload } = useTransportStatus()
  const { lines: myLines, toggle } = useMyLines()
  const [onlyMine, setOnlyMine] = useState(false)

  if (error && !status) {
    return (
      <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
        <span className="flex items-start gap-2">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </span>
        <Button variant="outline" size="sm" onClick={() => void reload()}>{t("transport.retry")}</Button>
      </div>
    )
  }
  if (!status) return <Skeleton className="h-64 rounded-xl" />

  const lines = onlyMine && myLines.length > 0 ? status.lines.filter((line) => myLines.includes(line.code)) : status.lines
  const touched = lines.filter((line) => line.state !== "normal")
  const normal = lines.filter((line) => line.state === "normal")
  const allGood = status.summary.interrupted === 0 && status.summary.delayed === 0

  return (
    <div className="space-y-5">
      <div
        role="status"
        className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 px-4 py-3 ${
          allGood ? "border-emerald-600/50 bg-emerald-500/10" : "border-red-600/50 bg-red-600/10"
        }`}
      >
        <p className="flex items-center gap-2 text-sm font-semibold">
          {allGood ? <ShieldCheck className="size-5 text-emerald-600" aria-hidden="true" /> : <CircleAlert className="size-5 text-red-600" aria-hidden="true" />}
          {allGood
            ? t("transport.allNormal")
            : t("transport.summary", { interrupted: status.summary.interrupted, delayed: status.summary.delayed })}
        </p>
        <Button variant="ghost" size="icon-sm" onClick={() => void reload()} aria-label={t("transport.refresh")}>
          <RefreshCw aria-hidden="true" />
        </Button>
      </div>

      {myLines.length > 0 && (
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" checked={onlyMine} onChange={(event) => setOnlyMine(event.target.checked)} />
          {t("transport.onlyMine", { count: myLines.length })}
        </label>
      )}

      {touched.length > 0 && (
        <section aria-label={t("transport.affectedLines")} className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t("transport.affectedLines")}</h2>
          {touched.map((line) => (
            <div key={line.code} className="space-y-2">
              {line.disruptions.map((disruption) => (
                <DisruptionCard key={disruption.id} disruption={disruption} />
              ))}
              <Button variant="outline" size="sm" onClick={() => onOpenLine(line.code)}>
                {t("transport.seeLine", { code: line.code })}
              </Button>
            </div>
          ))}
        </section>
      )}

      <section aria-label={t("transport.allLines")} className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t("transport.allLines")}</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {[...touched, ...normal].map((line) => (
            <li key={line.code} className="flex items-center gap-3 rounded-xl border border-border/80 bg-card/70 p-3">
              <button type="button" className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left" onClick={() => onOpenLine(line.code)}>
                <LineChip line={line} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{line.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {line.stops[0]} ↔ {line.stops[line.stops.length - 1]}
                    {line.frequencyMinutes ? ` · ${t("transport.everyMinutes", { count: line.frequencyMinutes })}` : ""}
                  </span>
                </span>
                <StateBadge state={line.state} label={line.stateLabel[lang]} />
              </button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-pressed={myLines.includes(line.code)}
                aria-label={t(myLines.includes(line.code) ? "transport.unfollow" : "transport.follow", { code: line.code })}
                onClick={() => toggle(line.code)}
              >
                <Star className={myLines.includes(line.code) ? "fill-amber-400 text-amber-500" : ""} />
              </Button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

// ── Onglet « Mon trajet » ──────────────────────────────────
function OptionCard({ option, best }: { option: JourneyOption; best: boolean }) {
  const { t, locale } = useLanguage()
  const lang = locale === "en" ? "en" : "fr"
  return (
    <li className={`rounded-xl border-2 p-4 ${best ? "border-primary bg-primary/5" : "border-border/80 bg-card/70"}`}>
      <div className="flex flex-wrap items-center gap-2">
        {option.legs.map((leg, index) => (
          <span key={index} className="flex items-center gap-1.5">
            {index > 0 && <ArrowRightLeft className="size-3.5 text-muted-foreground" aria-hidden="true" />}
            <LineChip line={leg.line} replacement={leg.line.replacement} />
          </span>
        ))}
        {best && <span className="rounded bg-primary px-1.5 py-0.5 text-[11px] font-bold uppercase text-primary-foreground">{t("transport.recommended")}</span>}
        {option.usesReplacement && <span className="rounded border border-amber-600/50 bg-amber-500/15 px-1.5 py-0.5 text-[11px] font-semibold">{t("transport.usesReplacement")}</span>}
        {option.delayed && <span className="rounded border border-amber-600/50 bg-amber-500/15 px-1.5 py-0.5 text-[11px] font-semibold">{t("transport.delayedFlag")}</span>}
      </div>

      <p className="mt-2 text-sm font-medium">{option.summary[lang]}</p>

      <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        {option.departure && option.arrival ? (
          <span className="font-semibold tabular-nums">
            {option.tomorrow ? `${t("transport.tomorrow")} ` : ""}
            {option.departure} → {option.arrival}
          </span>
        ) : (
          <span className="text-muted-foreground">{t("transport.noService")}</span>
        )}
        {option.durationMinutes !== null && (
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Clock3 className="size-3.5" aria-hidden="true" />
            {t("transport.minutes", { count: option.durationMinutes })}
          </span>
        )}
        {option.waitMinutes !== null && option.waitMinutes > 0 && (
          <span className="text-muted-foreground">{t("transport.waitMinutes", { count: option.waitMinutes })}</span>
        )}
        <span className="text-muted-foreground">
          {option.transfers === 0 ? t("transport.direct") : t("transport.transfers", { count: option.transfers })}
        </span>
      </p>

      <ol className="mt-3 space-y-1 border-l-2 border-border pl-3 text-sm">
        {option.legs.map((leg, index) => (
          <li key={index}>
            <span className="font-medium">{leg.departure ?? "—"}</span> {leg.from} →{" "}
            <span className="font-medium">{leg.arrival ?? "—"}</span> {leg.to}
            <span className="text-muted-foreground"> · {t("transport.towards", { stop: leg.direction })}</span>
          </li>
        ))}
      </ol>
    </li>
  )
}

function JourneyTab({ stops }: { stops: StopSummary[] }) {
  const { t, locale } = useLanguage()
  const lang = locale === "en" ? "en" : "fr"
  const saved = useSyncExternalStore(subscribeJourney, readJourney, () => null)
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [result, setResult] = useState<Journey | null>(null)
  const [error, setError] = useState("")
  const [suggestions, setSuggestions] = useState<string[]>([])
  // Champ dont l'arrêt est inconnu (« from » ou « to ») : c'est lui que la suggestion remplace
  const [badField, setBadField] = useState<"from" | "to">("from")
  const [loading, setLoading] = useState(false)

  const search = async (origin: string, destination: string) => {
    setError("")
    setSuggestions([])
    setLoading(true)
    try {
      const journey = await transportRepository.journey(origin.trim(), destination.trim())
      setResult(journey)
      setFrom(journey.from)
      setTo(journey.to)
      saveJourney({ from: journey.from, to: journey.to })
    } catch (cause) {
      setResult(null)
      if (cause instanceof AuthApiError && cause.code === "unknown_stop") {
        const body = cause.body as { suggestions?: string[]; field?: "from" | "to" } | undefined
        setSuggestions(body?.suggestions ?? [])
        setBadField(body?.field === "to" ? "to" : "from")
      }
      setError(cause instanceof Error ? cause.message : t("transport.loadError"))
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void search(from, to)
  }

  return (
    <div className="space-y-5">
      <datalist id="transport-stops">
        {stops.map((stop) => (
          <option key={stop.name} value={stop.name} />
        ))}
      </datalist>

      {saved && (
        <Button variant="outline" size="sm" onClick={() => void search(saved.from, saved.to)} disabled={loading}>
          <Star className="fill-amber-400 text-amber-500" aria-hidden="true" />
          {t("transport.myJourney", { from: saved.from, to: saved.to })}
        </Button>
      )}

      <form onSubmit={handleSubmit} className="grid gap-3 rounded-xl border border-border/80 bg-card/70 p-4 sm:grid-cols-[1fr_auto_1fr_auto] sm:items-end">
        <div className="grid gap-1.5">
          <Label htmlFor="tr-from">{t("transport.from")}</Label>
          <Input id="tr-from" list="transport-stops" value={from} onChange={(event) => setFrom(event.target.value)} required minLength={2} autoComplete="off" />
        </div>
        <Button type="button" variant="ghost" size="icon" aria-label={t("transport.swap")} onClick={() => { setFrom(to); setTo(from) }}>
          <ArrowRightLeft aria-hidden="true" />
        </Button>
        <div className="grid gap-1.5">
          <Label htmlFor="tr-to">{t("transport.to")}</Label>
          <Input id="tr-to" list="transport-stops" value={to} onChange={(event) => setTo(event.target.value)} required minLength={2} autoComplete="off" />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? <Spinner /> : <Search aria-hidden="true" />}
          {t("transport.search")}
        </Button>
      </form>

      {error && (
        <div role="alert" className="space-y-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
          <p className="flex items-start gap-2">
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {error}
          </p>
          {suggestions.length > 0 && (
            <p className="flex flex-wrap items-center gap-2 text-foreground">
              {t("transport.didYouMean")}
              {suggestions.map((name) => (
                <Button key={name} type="button" variant="outline" size="sm" onClick={() => (badField === "from" ? setFrom(name) : setTo(name))}>
                  {name}
                </Button>
              ))}
            </p>
          )}
        </div>
      )}

      {result && (
        <div className="space-y-4">
          {result.usual && (
            <div
              role="status"
              className={`rounded-xl border-2 px-4 py-3 ${result.usual.affected ? "border-red-600/60 bg-red-600/10" : "border-emerald-600/50 bg-emerald-500/10"}`}
            >
              <p className="text-sm font-semibold">{result.usual.affected ? t("transport.usualAffected") : t("transport.usualOk")}</p>
              {result.usual.disruptions.map((disruption) => (
                <p key={disruption.id} className="mt-1 text-sm">{t("transport.usualReason", { reason: disruption.reason })}</p>
              ))}
            </div>
          )}

          {result.options.length > 0 ? (
            <ul className="space-y-3">
              {result.options.map((option, index) => (
                <OptionCard key={index} option={option} best={index === 0} />
              ))}
            </ul>
          ) : (
            <div className="space-y-3 rounded-xl border border-border/80 bg-card/70 p-4">
              <p className="flex items-center gap-2 font-medium">
                <Footprints className="size-4" aria-hidden="true" />
                {result.message ? result.message[lang] : t("transport.noRoute")}
              </p>
              {result.otherSolutions.length > 0 && <AlternativeList alternatives={result.otherSolutions} />}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Onglet « Un arrêt » ────────────────────────────────────
function StopTab({ stops }: { stops: StopSummary[] }) {
  const { t } = useLanguage()
  const [name, setName] = useState("")
  const [card, setCard] = useState<StopCard | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const open = async (stop: string) => {
    setError("")
    setLoading(true)
    try {
      setCard(await transportRepository.stopCard(stop.trim()))
    } catch (cause) {
      setCard(null)
      setError(cause instanceof Error ? cause.message : t("transport.loadError"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <datalist id="transport-stops-card">
        {stops.map((stop) => (
          <option key={stop.name} value={stop.name} />
        ))}
      </datalist>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          void open(name)
        }}
        className="flex flex-wrap items-end gap-3 rounded-xl border border-border/80 bg-card/70 p-4"
      >
        <div className="grid min-w-52 flex-1 gap-1.5">
          <Label htmlFor="tr-stop">{t("transport.stopLabel")}</Label>
          <Input id="tr-stop" list="transport-stops-card" value={name} onChange={(event) => setName(event.target.value)} required minLength={2} autoComplete="off" />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? <Spinner /> : <MapPin aria-hidden="true" />}
          {t("transport.showStop")}
        </Button>
      </form>

      {error && (
        <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      {card && (
        <div className="space-y-4">
          <div className="rounded-xl border-2 border-primary bg-primary/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("transport.stopAt", { stop: card.stop, time: card.nowLabel })}</p>
            <p className="mt-1 text-base font-semibold leading-7">{card.advice}</p>
          </div>
          <ul className="space-y-3">
            {card.lines.map((item) => (
              <li key={item.line.code} className="space-y-2 rounded-xl border border-border/80 bg-card/70 p-4">
                <div className="flex items-center gap-2">
                  <LineChip line={item.line} />
                  <span className="text-sm font-medium">{item.line.name}</span>
                </div>
                {item.disruption && <DisruptionCard disruption={item.disruption} showLine={false} />}
                <ul className="space-y-1.5">
                  {item.directions.map((direction) => (
                    <li key={direction.towards} className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-medium">{t("transport.towards", { stop: direction.towards })}</span>
                      {!direction.served ? (
                        <StateBadge state="interrupted" label={t("transport.notServed")} />
                      ) : direction.departures.length === 0 ? (
                        <span className="text-muted-foreground">{t("transport.noDeparture")}</span>
                      ) : (
                        direction.departures.map((departure) => (
                          <span key={departure.time + departure.tomorrow} className="rounded-md bg-muted px-2 py-0.5 text-xs font-semibold tabular-nums">
                            {departure.tomorrow ? `${t("transport.tomorrow")} ` : ""}
                            {departure.time}
                            {!departure.tomorrow && ` · ${t("transport.inMinutes", { count: departure.inMinutes })}`}
                          </span>
                        ))
                      )}
                      {direction.delayed && <StateBadge state="delayed" label={t("transport.delayedFlag")} />}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ── Module « Transports » : état du réseau, trajet de remplacement, fiche d'arrêt ──
export function TransportView() {
  const { t } = useLanguage()
  const params = useSearchParams()
  const initial = (["network", "journey", "stop"] as Tab[]).find((value) => value === params.get("tab")) ?? "network"
  const [tab, setTab] = useState<Tab>(initial)
  const [stops, setStops] = useState<StopSummary[]>([])
  const [lineCode, setLineCode] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    transportRepository
      .stops()
      .then((list) => mounted && setStops(list))
      .catch(() => undefined)
    return () => {
      mounted = false
    }
  }, [])

  const tabs: { value: Tab; label: string; icon: typeof Route }[] = [
    { value: "network", label: t("transport.tabs.network"), icon: Route },
    { value: "journey", label: t("transport.tabs.journey"), icon: ArrowRightLeft },
    { value: "stop", label: t("transport.tabs.stop"), icon: MapPin },
  ]

  return (
    <>
      <section>
        <p className="text-sm font-medium text-primary">{t("transport.eyebrow")}</p>
        <h1 className="mt-1 text-3xl font-medium tracking-tight sm:text-4xl">{t("transport.title")}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{t("transport.subtitle")}</p>
      </section>

      <div role="tablist" aria-label={t("transport.title")} className="flex flex-wrap gap-2">
        {tabs.map(({ value, label, icon: Icon }) => (
          <Button
            key={value}
            role="tab"
            aria-selected={tab === value}
            size="sm"
            variant={tab === value ? "default" : "outline"}
            onClick={() => setTab(value)}
          >
            <Icon aria-hidden="true" />
            {label}
          </Button>
        ))}
      </div>

      <div role="tabpanel">
        {tab === "network" && <NetworkTab onOpenLine={setLineCode} />}
        {tab === "journey" && <JourneyTab stops={stops} />}
        {tab === "stop" && <StopTab stops={stops} />}
      </div>

      <Dialog open={lineCode !== null} onOpenChange={(open) => !open && setLineCode(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("transport.lineTitle", { code: lineCode ?? "" })}</DialogTitle>
            <DialogDescription>{t("transport.lineDescription")}</DialogDescription>
          </DialogHeader>
          {lineCode && <LineDetail code={lineCode} />}
        </DialogContent>
      </Dialog>
    </>
  )
}
