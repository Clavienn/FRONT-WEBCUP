"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { BellRing, CircleAlert, Hand, Phone, RefreshCw, Search, Siren, TriangleAlert } from "lucide-react"

import Link from "next/link"
import { useAuth } from "@/components/auth/auth-provider"
import { useLanguage } from "@/components/i18n/language-provider"
import { PriorityBadge, StatusBadge, formatMinutes } from "@/components/signalements/signalement-badges"
import { useStaffChannel } from "@/components/signalements/use-staff-channel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { AuthApiError } from "@/repository/auth.repository"
import {
  SIGNALEMENT_PRIORITIES,
  SIGNALEMENT_STATUSES,
  signalementRepository,
  type SignalementPage,
  type SignalementPriority,
  type SignalementStatus,
  type SignalementSummary,
  type SignalementType,
  type StaffQuery,
  type StaffSignalement,
  type StaffSignalementDetail,
} from "@/repository/signalement.repository"

const PAGE_SIZE = 20
// Type de signalement -> type de danger de l'alerte à la population (pour pré-remplir la publication)
const HAZARD_FOR_TYPE: Partial<Record<SignalementType, string>> = {
  flood: "flood",
  heavy_rain: "heavy_rain",
  cyclone: "cyclone",
  fire: "fire",
  security: "security",
  medical: "health",
}
const TYPES: SignalementType[] = ["medical", "fire", "flood", "cyclone", "accident", "security", "breakdown", "heavy_rain", "other"]

// Vues rapides : chacune répond à « qu'est-ce qui demande mon attention ? ». La liste reste triée par le
// serveur (urgent non pris > en retard > important > ...) : jamais retriée par date ici.
type View = "open" | "urgent" | "unacknowledged" | "overdue" | "unassigned" | "mine" | "closed"
const VIEW_QUERY: Record<View, Omit<StaffQuery, "page" | "limit" | "q" | "type">> = {
  open: { status: "open" },
  urgent: { status: "open", priority: "urgent" },
  unacknowledged: { status: "new" },
  overdue: { status: "open", overdue: true },
  unassigned: { status: "open", assigned: "none" },
  mine: { status: "open", assigned: "me" },
  closed: { status: "closed" },
}

interface Result {
  key: string
  data?: SignalementPage
  error?: string
}

// ── Détail et traitement d'un signalement ───────────────────
function Detail({
  item,
  canManage,
  currentUserId,
  onChanged,
}: {
  item: StaffSignalement
  canManage: boolean
  currentUserId: number
  onChanged: () => void
}) {
  const { t, locale } = useLanguage()
  const [detail, setDetail] = useState<StaffSignalementDetail | null>(null)
  const [error, setError] = useState("")
  const [status, setStatus] = useState<SignalementStatus>(item.status)
  const [priority, setPriority] = useState<SignalementPriority>(item.priority)
  const [note, setNote] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let mounted = true
    signalementRepository
      .getStaff(item.id)
      .then((data) => mounted && setDetail(data))
      .catch((cause) => mounted && setError(cause instanceof Error ? cause.message : t("signalements.staff.detailError")))
    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement unique par signalement
  }, [item.id])

  const formatter = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "fr-FR", { dateStyle: "medium", timeStyle: "short" })
  const noteRequired = status === "cancelled" && item.status !== "cancelled"
  const changed = status !== item.status || priority !== item.priority

  const apply = async (input: Parameters<typeof signalementRepository.update>[1]) => {
    setSaving(true)
    try {
      setDetail(await signalementRepository.update(item.id, input))
      setNote("")
      toast.add({ title: t("signalements.staff.saved"), type: "success" })
      onChanged()
    } catch (cause) {
      toast.add({ title: t("signalements.staff.saveError"), description: cause instanceof Error ? cause.message : undefined, type: "error" })
    } finally {
      setSaving(false)
    }
  }

  const save = () =>
    apply({
      ...(status !== item.status ? { status } : {}),
      ...(priority !== item.priority ? { priority } : {}),
      ...(note.trim() ? { note: note.trim() } : {}),
    })

  if (error) return <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>
  if (!detail) return <Skeleton className="mt-3 h-24 rounded-lg" />

  const person = (p: { firstName: string; lastName: string } | null) => (p ? `${p.firstName} ${p.lastName}`.trim() : "—")
  // Une date absente ou illisible n'est jamais passée au formateur (RangeError) : « — »
  const formatDate = (value: string | null | undefined) => {
    const date = value ? new Date(value) : null
    return date && Number.isFinite(date.getTime()) ? formatter.format(date) : "—"
  }
  // Ce qu'a changé la ligne : l'état si elle en change un, sinon la priorité ou l'assignation
  const describe = (entry: StaffSignalementDetail["history"][number]) => {
    const parts: string[] = []
    if (entry.newStatus && entry.newStatus !== entry.oldStatus) parts.push(t(`signalements.status.${entry.newStatus}`))
    if (entry.newPriority && entry.oldPriority && entry.newPriority !== entry.oldPriority) {
      parts.push(
        t("signalements.staff.priorityChanged", {
          from: t(`signalements.priority.${entry.oldPriority}`),
          to: t(`signalements.priority.${entry.newPriority}`),
        })
      )
    }
    if (parts.length === 0 && entry.action.includes("assign")) parts.push(t("signalements.staff.assignmentChanged"))
    return parts.length > 0 ? parts.join(" · ") : t("signalements.staff.updated")
  }

  return (
    <div className="mt-4 space-y-4 border-t border-border/70 pt-4">
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-muted-foreground">{t("signalements.staff.reporter")}</dt>
          <dd>{person(detail.reporter)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">{t("signalements.staff.phone")}</dt>
          <dd>
            {detail.contactPhone ? (
              <a href={`tel:${detail.contactPhone}`} className="inline-flex items-center gap-1 font-medium text-primary underline-offset-4 hover:underline">
                <Phone className="size-3.5" aria-hidden="true" />
                {detail.contactPhone}
              </a>
            ) : (
              "—"
            )}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs text-muted-foreground">{t("signalements.staff.descriptionLabel")}</dt>
          <dd className="whitespace-pre-line">{detail.description || "—"}</dd>
        </div>
      </dl>

      {canManage && (
        <div className="space-y-3 rounded-xl border border-border/70 bg-background/50 p-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <label htmlFor={`st-${item.id}`} className="text-xs font-medium text-muted-foreground">{t("signalements.staff.statusLabel")}</label>
              <NativeSelect id={`st-${item.id}`} value={status} onChange={(event) => setStatus(event.target.value as SignalementStatus)}>
                {SIGNALEMENT_STATUSES.map((value) => (
                  <NativeSelectOption key={value} value={value}>{t(`signalements.status.${value}`)}</NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            <div className="space-y-1.5">
              <label htmlFor={`pr-${item.id}`} className="text-xs font-medium text-muted-foreground">{t("signalements.staff.priorityLabel")}</label>
              <NativeSelect id={`pr-${item.id}`} value={priority} onChange={(event) => setPriority(event.target.value as SignalementPriority)}>
                {SIGNALEMENT_PRIORITIES.map((value) => (
                  <NativeSelectOption key={value} value={value}>{t(`signalements.priority.${value}`)}</NativeSelectOption>
                ))}
              </NativeSelect>
            </div>
            {item.assignedTo === currentUserId ? (
              <Button variant="outline" size="sm" disabled={saving} onClick={() => void apply({ assignedTo: null })}>
                {t("signalements.staff.release")}
              </Button>
            ) : (
              <Button variant="outline" size="sm" disabled={saving} onClick={() => void apply({ assignedTo: currentUserId })}>
                {t("signalements.staff.assignToMe")}
              </Button>
            )}
          </div>
          <Textarea
            aria-label={t("signalements.staff.noteLabel")}
            rows={2}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={t("signalements.staff.notePlaceholder")}
          />
          {noteRequired && !note.trim() && <p className="text-xs text-muted-foreground">{t("signalements.staff.noteRequired")}</p>}
          <Button size="sm" disabled={saving || !changed || (noteRequired && !note.trim())} onClick={() => void save()}>
            {saving && <Spinner />}
            {t("signalements.staff.save")}
          </Button>
        </div>
      )}

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("signalements.staff.history")}</p>
        <ol className="space-y-2 border-l-2 border-border pl-4">
          {detail.history.map((entry, index) => (
            <li key={`${entry.at}-${index}`} className="relative text-sm">
              <span className="absolute -left-[21px] top-1.5 size-2.5 rounded-full bg-primary" aria-hidden="true" />
              <p className="font-medium">{describe(entry)}</p>
              {entry.note && <p className="text-muted-foreground">{entry.note}</p>}
              <p className="text-xs text-muted-foreground">
                {formatDate(entry.at)} · {person(entry.author)}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

// ── Page du personnel ───────────────────────────────────────
export function StaffSignalements() {
  const { user } = useAuth()
  const { t, locale } = useLanguage()
  const canManage = user?.permissions.includes("agent.signalements.manage") ?? false
  const canAlert = user?.permissions.includes("agent.alerts.manage") ?? false

  const [view, setView] = useState<View>("open")
  const [type, setType] = useState<SignalementType | "">("")
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [page, setPage] = useState(1)
  const [reloadKey, setReloadKey] = useState(0)
  const [result, setResult] = useState<Result | null>(null)
  const [summary, setSummary] = useState<SignalementSummary | null>(null)
  const [openId, setOpenId] = useState<number | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const key = `${view}|${type}|${debouncedSearch}|${page}|${reloadKey}`
  const current = result?.key === key ? result : null

  useEffect(() => {
    let mounted = true
    signalementRepository
      .listStaff({ ...VIEW_QUERY[view], type: type || undefined, q: debouncedSearch || undefined, page, limit: PAGE_SIZE })
      .then((data) => mounted && setResult({ key, data }))
      .catch((cause) => mounted && setResult({ key, error: cause instanceof Error ? cause.message : t("signalements.staff.loadError") }))
    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- key résume les entrées de la requête
  }, [key])

  useEffect(() => {
    let mounted = true
    signalementRepository
      .summary()
      .then((data) => mounted && setSummary(data))
      .catch(() => undefined)
    return () => {
      mounted = false
    }
  }, [reloadKey])

  const reload = useCallback(() => setReloadKey((value) => value + 1), [])

  // Temps réel : un événement recharge la file et les compteurs (au plus une fois par demi-seconde,
  // pour qu'une rafale de signalements ne déclenche pas une rafale de requêtes)
  const reloadTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const channel = useStaffChannel(
    useCallback(
      () => {
        // L'alerte sonore/visuelle (toast) est gérée par la barre latérale, présente sur toutes les pages
        if (reloadTimer.current) clearTimeout(reloadTimer.current)
        reloadTimer.current = setTimeout(reload, 500)
      },
      [reload]
    ),
    true
  )
  useEffect(() => () => {
    if (reloadTimer.current) clearTimeout(reloadTimer.current)
  }, [])

  const acknowledge = async (item: StaffSignalement) => {
    setBusyId(item.id)
    try {
      await signalementRepository.acknowledge(item.id)
      toast.add({ title: t("signalements.staff.acknowledged"), type: "success" })
    } catch (cause) {
      // 409 already_acknowledged : un autre agent l'a pris, la liste est rechargée pour le montrer
      toast.add({
        title: cause instanceof AuthApiError && cause.status === 409 ? t("signalements.staff.alreadyTaken") : t("signalements.staff.saveError"),
        description: cause instanceof Error ? cause.message : undefined,
        type: "error",
      })
    } finally {
      setBusyId(null)
      reload()
    }
  }

  const data = current?.data
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1
  const alertCount = (summary?.urgentOpen ?? 0) + (summary?.overdue ?? 0)

  const tabs: { value: View; label: string; count?: number }[] = [
    { value: "open", label: t("signalements.staff.views.open"), count: summary?.open },
    { value: "urgent", label: t("signalements.staff.views.urgent"), count: summary?.urgentOpen },
    { value: "unacknowledged", label: t("signalements.staff.views.unacknowledged"), count: summary?.unacknowledged },
    { value: "overdue", label: t("signalements.staff.views.overdue"), count: summary?.overdue },
    { value: "unassigned", label: t("signalements.staff.views.unassigned"), count: summary?.unassigned },
    { value: "mine", label: t("signalements.staff.views.mine"), count: summary?.mine },
    { value: "closed", label: t("signalements.staff.views.closed") },
  ]

  return (
    <>
      <section className="relative overflow-hidden rounded-2xl border border-border/80 bg-card/85 p-6 shadow-sm backdrop-blur-xl sm:p-7">
        <div className="mb-3 flex items-center justify-between border-b border-border/60 pb-2.5 text-[11px] font-mono tracking-wider text-muted-foreground">
          <span className="flex items-center gap-2 font-medium text-amber-500">
            <span className="size-2 rounded-full bg-amber-400 animate-pulse" />
            CENTRE DE CONTRÔLE DES INCIDENTS // DÔMES TERRA NOVA
          </span>
          <span className="hidden sm:inline font-mono text-xs uppercase text-muted-foreground">
            SÉCURITÉ & LOGISTIQUE URBAINE
          </span>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">{t("signalements.staff.eyebrow")}</p>
            <h1 className="font-display mt-1 text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
              {t("signalements.staff.title")}
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">{t("signalements.staff.subtitle")}</p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/60 px-3 py-1 font-mono text-xs text-muted-foreground"
              title={t(channel === "live" ? "signalements.staff.liveOn" : "signalements.staff.liveOff")}
            >
              <span className={`size-2 rounded-full ${channel === "live" ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/50"}`} aria-hidden="true" />
              {t(channel === "live" ? "signalements.staff.liveOn" : "signalements.staff.liveOff")}
            </span>
            <Button variant="outline" size="icon" onClick={reload} aria-label={t("signalements.staff.refresh")}>
              <RefreshCw aria-hidden="true" />
            </Button>
          </div>
        </div>
      </section>

      {/* Point chaud : plusieurs signalements du même type dans un quartier, et aucune alerte : prévenir la population ? */}
      {canAlert &&
        (summary?.hotspots ?? [])
          .filter((hotspot) => !hotspot.alertActive)
          .map((hotspot) => (
            <div
              key={`${hotspot.zone}-${hotspot.type}`}
              role="status"
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 border-amber-500/70 bg-amber-500/10 px-4 py-3"
            >
              <p className="flex items-center gap-2 text-sm font-medium">
                <BellRing className="size-4 shrink-0 text-amber-600" aria-hidden="true" />
                {t("alerts.staff.hotspot", {
                  count: hotspot.count,
                  type: t(`signalements.types.${hotspot.type}`),
                  zone: t(`alerts.zones.${hotspot.zone}`),
                })}
              </p>
              <Button
                size="sm"
                nativeButton={false}
                render={<Link href={`/dashboard/agent/alerts?new=1&hazard=${HAZARD_FOR_TYPE[hotspot.type] ?? "other"}&zone=${hotspot.zone}`} />}
              >
                {t("alerts.staff.hotspotAction")}
              </Button>
            </div>
          ))}

      {summary && alertCount > 0 && (
        <div role="alert" className="flex flex-wrap items-center gap-3 rounded-xl border-2 border-red-600/70 bg-red-600/10 px-4 py-3">
          <TriangleAlert className="size-5 shrink-0 text-red-600" aria-hidden="true" />
          <p className="text-sm font-semibold text-red-900 dark:text-red-100">
            {t("signalements.staff.banner", { urgent: summary.urgentOpen, overdue: summary.overdue })}
            {summary.oldestUnacknowledgedMinutes !== null && summary.unacknowledged > 0 && (
              <span className="ml-2 font-normal">
                {t("signalements.staff.oldestWaiting", { duration: formatMinutes(summary.oldestUnacknowledgedMinutes) })}
              </span>
            )}
          </p>
        </div>
      )}

      <div role="group" aria-label={t("signalements.staff.viewsLabel")} className="flex flex-wrap gap-2">
        {tabs.map(({ value, label, count }) => (
          <Button
            key={value}
            size="sm"
            variant={view === value ? "default" : "outline"}
            aria-pressed={view === value}
            onClick={() => {
              setView(value)
              setPage(1)
              setOpenId(null)
            }}
          >
            {label}
            {count !== undefined && <span className="tabular-nums opacity-80">({count})</span>}
          </Button>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            type="search"
            aria-label={t("signalements.staff.search")}
            placeholder={t("signalements.staff.search")}
            className="pl-9"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <NativeSelect
          aria-label={t("signalements.staff.typeFilter")}
          value={type}
          onChange={(event) => {
            setType(event.target.value as SignalementType | "")
            setPage(1)
          }}
        >
          <NativeSelectOption value="">{t("signalements.staff.allTypes")}</NativeSelectOption>
          {TYPES.map((value) => (
            <NativeSelectOption key={value} value={value}>{t(`signalements.types.${value}`)}</NativeSelectOption>
          ))}
        </NativeSelect>
      </div>

      {current?.error ? (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
          <span className="flex items-start gap-2">
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {current.error}
          </span>
          <Button variant="outline" size="sm" onClick={reload}>{t("signalements.retry")}</Button>
        </div>
      ) : !data ? (
        <div className="space-y-3">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
      ) : data.signalements.length === 0 ? (
        <p className="rounded-2xl border border-border/80 bg-card/70 p-8 text-center text-sm text-muted-foreground">
          {t("signalements.staff.empty")}
        </p>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">{t("signalements.staff.total", { count: data.total })}</p>
          <ul className="space-y-3">
            {data.signalements.map((item) => {
              const expanded = openId === item.id
              const stripe =
                item.priority === "urgent" ? "border-l-red-600" : item.priority === "high" ? "border-l-orange-500" : "border-l-border"
              return (
                <li key={item.id} className={`rounded-xl border border-l-4 border-border/80 ${stripe} bg-card/75 p-4 shadow-sm`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold">{item.title || item.label[locale]}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {item.label[locale]} · {item.location}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-1.5">
                      {item.overdue && (
                        <Badge variant="outline" className="gap-1 border-red-600/50 bg-red-600/10 text-red-700 dark:text-red-300">
                          <Siren className="size-3" aria-hidden="true" />
                          {t("signalements.staff.overdue")}
                        </Badge>
                      )}
                      <PriorityBadge priority={item.priority} />
                      <StatusBadge status={item.status} />
                    </div>
                  </div>

                  <p className="mt-2 text-xs text-muted-foreground">
                    {t("signalements.staff.age", { duration: formatMinutes(item.ageMinutes), target: formatMinutes(item.slaMinutes) })}
                    {" · "}
                    {item.assignee
                      ? t("signalements.staff.assignedTo", { name: `${item.assignee.firstName} ${item.assignee.lastName}`.trim() })
                      : t("signalements.staff.unassigned")}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {canManage && item.status === "new" && (
                      <Button size="sm" disabled={busyId === item.id} onClick={() => void acknowledge(item)} className="bg-red-600 text-white hover:bg-red-700">
                        {busyId === item.id ? <Spinner /> : <Hand aria-hidden="true" />}
                        {t("signalements.staff.takeCharge")}
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" aria-expanded={expanded} onClick={() => setOpenId(expanded ? null : item.id)}>
                      {expanded ? t("signalements.staff.hideDetail") : t("signalements.staff.showDetail")}
                    </Button>
                  </div>

                  {expanded && user && (
                    <Detail item={item} canManage={canManage} currentUserId={user.id} onChanged={reload} />
                  )}
                </li>
              )
            })}
          </ul>

          {totalPages > 1 && (
            <nav aria-label={t("signalements.staff.pagination")} className="flex items-center justify-center gap-3">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                {t("signalements.staff.previous")}
              </Button>
              <span className="text-sm text-muted-foreground">{t("signalements.staff.page", { page, pages: totalPages })}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                {t("signalements.staff.next")}
              </Button>
            </nav>
          )}
        </>
      )}
    </>
  )
}
