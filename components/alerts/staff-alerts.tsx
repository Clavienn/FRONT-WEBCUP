"use client"

import { useCallback, useEffect, useState, type FormEvent } from "react"
import { useSearchParams } from "next/navigation"
import { BellRing, CircleAlert, MegaphoneOff, RefreshCw } from "lucide-react"

import { AlertCard } from "@/components/alerts/alert-card"
import { AlertForm, InstructionsEditor, durationLabel, type AlertPrefill } from "@/components/alerts/alert-form"
import { useLanguage } from "@/components/i18n/language-provider"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import {
  ALERT_HAZARDS,
  ALERT_SEVERITIES,
  ALERT_ZONES,
  SEVERITY_REQUIRES_ACTION,
  alertRepository,
  type AlertHazard,
  type AlertPage,
  type AlertSeverity,
  type AlertZone,
  type StaffAlert,
} from "@/repository/alert.repository"

const PAGE_SIZE = 10
const EXTENSIONS = [60, 180, 360, 720, 1440]

const errorMessage = (cause: unknown) => (cause instanceof Error ? cause.message : "")

// Mise à jour de la situation : ce qui a changé, éventuellement la gravité, les consignes, la durée
function UpdateForm({ alert, onDone }: { alert: StaffAlert; onDone: () => void }) {
  const { t } = useLanguage()
  const [message, setMessage] = useState("")
  const [severity, setSeverity] = useState<AlertSeverity>(alert.severity)
  const [editInstructions, setEditInstructions] = useState(false)
  const [instructions, setInstructions] = useState<string[]>(alert.instructions)
  const [extend, setExtend] = useState("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const clean = instructions.map((item) => item.trim()).filter(Boolean)
    const finalInstructions = editInstructions ? clean : alert.instructions
    if (SEVERITY_REQUIRES_ACTION[severity] && finalInstructions.length === 0) {
      return setError(t("alerts.staff.instructionsRequired"))
    }
    setError("")
    setSaving(true)
    try {
      await alertRepository.update(alert.id, {
        message: message.trim(),
        ...(severity !== alert.severity ? { severity } : {}),
        ...(editInstructions ? { instructions: clean } : {}),
        ...(extend ? { expiresInMinutes: Number(extend) } : {}),
      })
      toast.add({ title: t("alerts.staff.updated"), type: "success" })
      onDone()
    } catch (cause) {
      setError(errorMessage(cause) || t("alerts.staff.saveError"))
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="up-message">{t("alerts.staff.updateMessage")}</Label>
        <Textarea
          id="up-message"
          rows={3}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          minLength={5}
          maxLength={1000}
          required
          placeholder={t("alerts.staff.updatePlaceholder")}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="up-severity">{t("alerts.staff.severity")}</Label>
          <NativeSelect id="up-severity" className="w-full" value={severity} onChange={(event) => setSeverity(event.target.value as AlertSeverity)}>
            {ALERT_SEVERITIES.map((value) => (
              <NativeSelectOption key={value} value={value}>{t(`alerts.severity.${value}`)}</NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="up-extend">{t("alerts.staff.extend")}</Label>
          <NativeSelect id="up-extend" className="w-full" value={extend} onChange={(event) => setExtend(event.target.value)}>
            <NativeSelectOption value="">{t("alerts.staff.extendNone")}</NativeSelectOption>
            {EXTENSIONS.map((minutes) => (
              <NativeSelectOption key={minutes} value={minutes}>{t("alerts.staff.extendFromNow", { duration: durationLabel(minutes) })}</NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
      </div>
      <div className="grid gap-2">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={editInstructions} onChange={(event) => setEditInstructions(event.target.checked)} />
          {t("alerts.staff.editInstructions")}
        </label>
        {editInstructions && <InstructionsEditor value={instructions} onChange={setInstructions} />}
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={saving}>
        {saving && <Spinner />}
        {t("alerts.staff.sendUpdate")}
      </Button>
    </form>
  )
}

// Fin d'alerte : dire que le danger est passé fait partie de l'information
function EndForm({ alert, onDone }: { alert: StaffAlert; onDone: () => void }) {
  const { t } = useLanguage()
  const [endMessage, setEndMessage] = useState("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setSaving(true)
    try {
      await alertRepository.end(alert.id, endMessage.trim())
      toast.add({ title: t("alerts.staff.ended"), type: "success" })
      onDone()
    } catch (cause) {
      setError(errorMessage(cause) || t("alerts.staff.saveError"))
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="end-message">{t("alerts.staff.endMessage")}</Label>
        <Textarea
          id="end-message"
          rows={3}
          value={endMessage}
          onChange={(event) => setEndMessage(event.target.value)}
          minLength={5}
          maxLength={1000}
          required
          placeholder={t("alerts.staff.endPlaceholder")}
        />
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={saving} className="bg-emerald-600 text-white hover:bg-emerald-700">
        {saving && <Spinner />}
        {t("alerts.staff.endAlert")}
      </Button>
    </form>
  )
}

interface Result {
  key: string
  data?: AlertPage
  error?: string
}

// Console du personnel : publier, mettre à jour et terminer les alertes à la population
export function StaffAlerts() {
  const { t } = useLanguage()
  const params = useSearchParams()

  const [tab, setTab] = useState<"active" | "ended">("active")
  const [page, setPage] = useState(1)
  const [reloadKey, setReloadKey] = useState(0)
  const [result, setResult] = useState<Result | null>(null)

  // Ouverture depuis un point chaud de signalements : formulaire pré-rempli (?new=1&hazard=flood&zone=south)
  const initialPrefill: AlertPrefill | null =
    params.get("new") === "1"
      ? {
          hazard: ALERT_HAZARDS.includes(params.get("hazard") as AlertHazard) ? (params.get("hazard") as AlertHazard) : undefined,
          zone: ALERT_ZONES.includes(params.get("zone") as AlertZone) ? (params.get("zone") as AlertZone) : undefined,
        }
      : null
  const [publishing, setPublishing] = useState<AlertPrefill | null>(initialPrefill)
  const [updating, setUpdating] = useState<StaffAlert | null>(null)
  const [ending, setEnding] = useState<StaffAlert | null>(null)

  const key = `${tab}|${page}|${reloadKey}`
  const current = result?.key === key ? result : null
  const data = current?.data

  useEffect(() => {
    let mounted = true
    alertRepository
      .listStaff(tab, page, PAGE_SIZE)
      .then((response) => mounted && setResult({ key, data: response }))
      .catch((cause) => mounted && setResult({ key, error: errorMessage(cause) || t("alerts.staff.loadError") }))
    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- key résume les entrées de la requête
  }, [key])

  const reload = useCallback(() => setReloadKey((value) => value + 1), [])
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1

  return (
    <>
      <section className="relative overflow-hidden rounded-2xl border border-red-500/30 bg-card/85 p-6 shadow-sm backdrop-blur-xl sm:p-7">
        <div className="mb-3 flex items-center justify-between border-b border-border/60 pb-2.5 text-[11px] font-mono tracking-wider text-muted-foreground">
          <span className="flex items-center gap-2 font-medium text-red-500">
            <span className="size-2 rounded-full bg-red-500 animate-ping" />
            DIFFUSION D'ALERTE POPULATION // CONSOLE AGENTS
          </span>
          <span className="hidden sm:inline font-mono text-xs uppercase text-muted-foreground">
            RÉSEAU RADIO TERRA NOVA
          </span>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-red-500">{t("alerts.staff.eyebrow")}</p>
            <h1 className="font-display mt-1 text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
              {t("alerts.staff.title")}
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">{t("alerts.staff.subtitle")}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={reload} aria-label={t("alerts.staff.refresh")}>
              <RefreshCw aria-hidden="true" />
            </Button>
            <Button onClick={() => setPublishing({})} className="h-11 rounded-xl bg-red-600 px-5 text-sm font-semibold uppercase tracking-wider text-white shadow-[0_0_24px_rgba(220,38,38,0.35)] hover:bg-red-700">
              <BellRing aria-hidden="true" />
              {t("alerts.staff.new")}
            </Button>
          </div>
        </div>
      </section>

      <div role="group" aria-label={t("alerts.staff.tabsLabel")} className="flex gap-2">
        {(["active", "ended"] as const).map((value) => (
          <Button
            key={value}
            size="sm"
            variant={tab === value ? "default" : "outline"}
            aria-pressed={tab === value}
            onClick={() => {
              setTab(value)
              setPage(1)
            }}
          >
            {t(`alerts.staff.tabs.${value}`)}
          </Button>
        ))}
      </div>

      {current?.error ? (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
          <span className="flex items-start gap-2">
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {current.error}
          </span>
          <Button variant="outline" size="sm" onClick={reload}>{t("alerts.staff.retry")}</Button>
        </div>
      ) : !data ? (
        <div className="space-y-3">
          <Skeleton className="h-36 rounded-xl" />
          <Skeleton className="h-36 rounded-xl" />
        </div>
      ) : data.alerts.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-border/80 bg-card/70 p-10 text-center">
          <MegaphoneOff className="size-6 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">{t(tab === "active" ? "alerts.staff.emptyActive" : "alerts.staff.emptyEnded")}</p>
        </div>
      ) : (
        <>
          <ul className="space-y-4">
            {data.alerts.map((alert) => (
              <li key={alert.id} className="space-y-2">
                <AlertCard alert={alert} zone={null} defaultOpen />
                <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                  <p className="text-xs text-muted-foreground">
                    {t("alerts.staff.publishedBy", { name: alert.createdBy ? `${alert.createdBy.firstName} ${alert.createdBy.lastName}`.trim() : "—" })}
                  </p>
                  {alert.status === "active" && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setUpdating(alert)}>{t("alerts.staff.addUpdate")}</Button>
                      <Button variant="outline" size="sm" onClick={() => setEnding(alert)}>{t("alerts.staff.endAlert")}</Button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {totalPages > 1 && (
            <nav aria-label={t("alerts.staff.pagination")} className="flex items-center justify-center gap-3">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>{t("alerts.staff.previous")}</Button>
              <span className="text-sm text-muted-foreground">{t("alerts.staff.page", { page, pages: totalPages })}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>{t("alerts.staff.next")}</Button>
            </nav>
          )}
        </>
      )}

      <Dialog open={publishing !== null} onOpenChange={(open) => !open && setPublishing(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("alerts.staff.publishTitle")}</DialogTitle>
            <DialogDescription>{t("alerts.staff.publishDescription")}</DialogDescription>
          </DialogHeader>
          {publishing && (
            <AlertForm
              prefill={publishing}
              onPublished={() => {
                setPublishing(null)
                setTab("active")
                setPage(1)
                reload()
                toast.add({ title: t("alerts.staff.published"), type: "success" })
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={updating !== null} onOpenChange={(open) => !open && setUpdating(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("alerts.staff.addUpdate")}</DialogTitle>
            <DialogDescription>{updating?.title}</DialogDescription>
          </DialogHeader>
          {updating && <UpdateForm alert={updating} onDone={() => { setUpdating(null); reload() }} />}
        </DialogContent>
      </Dialog>

      <Dialog open={ending !== null} onOpenChange={(open) => !open && setEnding(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("alerts.staff.endAlert")}</DialogTitle>
            <DialogDescription>{ending?.title}</DialogDescription>
          </DialogHeader>
          {ending && <EndForm alert={ending} onDone={() => { setEnding(null); reload() }} />}
        </DialogContent>
      </Dialog>
    </>
  )
}
