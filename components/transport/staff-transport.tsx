"use client"

import { useCallback, useEffect, useState, type FormEvent } from "react"
import { CircleAlert, Plus, RefreshCw, Trash2 } from "lucide-react"

import { useLanguage } from "@/components/i18n/language-provider"
import { DisruptionCard, LineChip, StateBadge } from "@/components/transport/transport-ui"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import {
  ALTERNATIVE_KINDS,
  transportRepository,
  type Alternative,
  type AlternativeKind,
  type DisruptionItemInput,
  type DisruptionKind,
  type DisruptionPage,
  type StaffDisruption,
  type TransportLine,
} from "@/repository/transport.repository"

const PAGE_SIZE = 10
const MAX_ALTERNATIVES = 5
const errorMessage = (cause: unknown) => (cause instanceof Error ? cause.message : "")

// ── Section touchée : toute la ligne, ou entre deux arrêts ──
function SectionEditor({
  line,
  from,
  to,
  onChange,
}: {
  line: TransportLine
  from: string
  to: string
  onChange: (from: string, to: string) => void
}) {
  const { t } = useLanguage()
  const whole = !from && !to
  return (
    <fieldset className="grid gap-2">
      <legend className="text-sm font-medium leading-none">{t("transport.staff.section")}</legend>
      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input type="radio" checked={whole} onChange={() => onChange("", "")} />
        {t("transport.staff.wholeLine")}
      </label>
      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <input type="radio" checked={!whole} onChange={() => onChange(line.stops[0], line.stops[line.stops.length - 1])} />
        {t("transport.staff.betweenStops")}
      </label>
      {!whole && (
        <div className="grid gap-3 sm:grid-cols-2">
          {[["from", from, (value: string) => onChange(value, to)] as const, ["to", to, (value: string) => onChange(from, value)] as const].map(([name, value, set]) => (
            <NativeSelect key={name} className="w-full" aria-label={t(`transport.staff.${name}Stop`)} value={value} onChange={(event) => set(event.target.value)}>
              {line.stops.map((stop) => (
                <NativeSelectOption key={stop} value={stop}>{stop}</NativeSelectOption>
              ))}
            </NativeSelect>
          ))}
        </div>
      )}
    </fieldset>
  )
}

// ── Solutions de remplacement (5 au plus), phrases courtes lues telles quelles par les habitants ──
function AlternativesEditor({
  line,
  lines,
  value,
  onChange,
}: {
  line: TransportLine
  lines: TransportLine[]
  value: Alternative[]
  onChange: (value: Alternative[]) => void
}) {
  const { t } = useLanguage()
  const patch = (index: number, change: Partial<Alternative>) => onChange(value.map((item, i) => (i === index ? { ...item, ...change } : item)))

  return (
    <div className="grid gap-2">
      <p className="text-sm font-medium">{t("transport.staff.alternatives")}</p>
      <p className="text-xs text-muted-foreground">{t("transport.staff.alternativesHint")}</p>
      <ul className="space-y-3">
        {value.map((alternative, index) => (
          <li key={index} className="grid gap-2 rounded-lg border border-border/70 p-3">
            <div className="flex items-center gap-2">
              <NativeSelect
                className="flex-1"
                aria-label={t("transport.staff.alternativeKind")}
                value={alternative.kind}
                onChange={(event) => patch(index, { kind: event.target.value as AlternativeKind })}
              >
                {ALTERNATIVE_KINDS.map((kind) => (
                  <NativeSelectOption key={kind} value={kind}>{t(`transport.staff.kinds.${kind}`)}</NativeSelectOption>
                ))}
              </NativeSelect>
              <Button type="button" variant="ghost" size="icon-sm" aria-label={t("transport.staff.removeAlternative")} onClick={() => onChange(value.filter((_, i) => i !== index))}>
                <Trash2 />
              </Button>
            </div>
            <Input
              value={alternative.text}
              maxLength={160}
              aria-label={t("transport.staff.alternativeText")}
              placeholder={t("transport.staff.alternativePlaceholder")}
              onChange={(event) => patch(index, { text: event.target.value })}
            />
            {alternative.kind === "line" && (
              <NativeSelect className="w-full" aria-label={t("transport.staff.otherLine")} value={alternative.line ?? ""} onChange={(event) => patch(index, { line: event.target.value })}>
                <NativeSelectOption value="">{t("transport.staff.chooseLine")}</NativeSelectOption>
                {lines.filter((other) => other.code !== line.code).map((other) => (
                  <NativeSelectOption key={other.code} value={other.code}>{other.code} — {other.name}</NativeSelectOption>
                ))}
              </NativeSelect>
            )}
            {alternative.kind === "replacement_bus" && (
              <div className="grid gap-2 sm:grid-cols-2">
                {(["from", "to"] as const).map((key) => (
                  <NativeSelect key={key} className="w-full" aria-label={t(`transport.staff.${key}Stop`)} value={alternative[key] ?? ""} onChange={(event) => patch(index, { [key]: event.target.value })}>
                    <NativeSelectOption value="">{t(`transport.staff.${key}Stop`)}</NativeSelectOption>
                    {line.stops.map((stop) => (
                      <NativeSelectOption key={stop} value={stop}>{stop}</NativeSelectOption>
                    ))}
                  </NativeSelect>
                ))}
              </div>
            )}
            <Input
              type="number"
              min={0}
              max={240}
              className="sm:max-w-48"
              aria-label={t("transport.staff.extraMinutes")}
              placeholder={t("transport.staff.extraMinutes")}
              value={alternative.extraMinutes ?? ""}
              onChange={(event) => patch(index, { extraMinutes: event.target.value === "" ? undefined : Number(event.target.value) })}
            />
          </li>
        ))}
      </ul>
      {value.length < MAX_ALTERNATIVES && (
        <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => onChange([...value, { kind: "line", text: "" }])}>
          <Plus aria-hidden="true" />
          {t("transport.staff.addAlternative")}
        </Button>
      )}
    </div>
  )
}

// Alternatives prêtes à envoyer : champs vides retirés, et seuls les champs du type choisi
function cleanAlternatives(value: Alternative[]): Alternative[] {
  return value
    .filter((alternative) => alternative.text.trim().length > 0)
    .map((alternative) => ({
      kind: alternative.kind,
      text: alternative.text.trim(),
      ...(alternative.kind === "line" && alternative.line ? { line: alternative.line } : {}),
      ...(alternative.kind === "replacement_bus" ? { from: alternative.from, to: alternative.to } : {}),
      ...(alternative.extraMinutes !== undefined ? { extraMinutes: alternative.extraMinutes } : {}),
    }))
}

// datetime-local (heure locale du navigateur) -> ISO ; vide -> undefined
const toIso = (value: string) => (value ? new Date(value).toISOString() : undefined)

interface Item {
  line: string
  kind: DisruptionKind
  from: string
  to: string
  alternatives: Alternative[]
}

// ── Déclaration : une cause, plusieurs lignes touchées, une alerte à la population publiée en même temps ──
function DeclareForm({ lines, onDone }: { lines: TransportLine[]; onDone: () => void }) {
  const { t } = useLanguage()
  // Une ligne qui a déjà une interruption se modifie, elle ne se redéclare pas (409)
  const free = lines.filter((line) => line.state === "normal")
  const [reason, setReason] = useState("")
  const [expectedEnd, setExpectedEnd] = useState("")
  const [publishAlert, setPublishAlert] = useState(true)
  const [items, setItems] = useState<Item[]>([{ line: free[0]?.code ?? "", kind: "interrupted", from: "", to: "", alternatives: [] }])
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  const patch = (index: number, change: Partial<Item>) => setItems((current) => current.map((item, i) => (i === index ? { ...item, ...change } : item)))

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setSaving(true)
    const payload: DisruptionItemInput[] = items.map((item) => ({
      line: item.line,
      kind: item.kind,
      ...(item.from && item.to ? { fromStop: item.from, toStop: item.to } : {}),
      alternatives: cleanAlternatives(item.alternatives),
    }))
    try {
      await transportRepository.declare({ reason: reason.trim(), expectedEndAt: toIso(expectedEnd), publishAlert, items: payload })
      toast.add({ title: t("transport.staff.declared"), type: "success" })
      onDone()
    } catch (cause) {
      setError(errorMessage(cause) || t("transport.staff.saveError"))
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      <div className="grid gap-2">
        <Label htmlFor="tr-reason">{t("transport.staff.reason")}</Label>
        <Input id="tr-reason" value={reason} onChange={(event) => setReason(event.target.value)} minLength={5} maxLength={200} required placeholder={t("transport.staff.reasonPlaceholder")} />
        <p className="text-xs text-muted-foreground">{t("transport.staff.reasonHint")}</p>
      </div>

      <div className="grid gap-2 sm:max-w-xs">
        <Label htmlFor="tr-end">{t("transport.staff.expectedEnd")}</Label>
        <Input id="tr-end" type="datetime-local" value={expectedEnd} onChange={(event) => setExpectedEnd(event.target.value)} />
        <p className="text-xs text-muted-foreground">{t("transport.staff.expectedEndHint")}</p>
      </div>

      <div className="space-y-4">
        <p className="text-sm font-semibold">{t("transport.staff.affectedLines")}</p>
        {items.map((item, index) => {
          const line = lines.find((candidate) => candidate.code === item.line)
          return (
            <div key={index} className="grid gap-4 rounded-xl border border-border/80 bg-background/50 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label htmlFor={`tr-line-${index}`}>{t("transport.staff.line")}</Label>
                  <NativeSelect
                    id={`tr-line-${index}`}
                    className="w-full"
                    value={item.line}
                    onChange={(event) => patch(index, { line: event.target.value, from: "", to: "", alternatives: [] })}
                  >
                    {free.map((candidate) => (
                      <NativeSelectOption key={candidate.code} value={candidate.code} disabled={items.some((other, i) => i !== index && other.line === candidate.code)}>
                        {candidate.code} — {candidate.name}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor={`tr-kind-${index}`}>{t("transport.staff.kind")}</Label>
                  <NativeSelect id={`tr-kind-${index}`} className="w-full" value={item.kind} onChange={(event) => patch(index, { kind: event.target.value as DisruptionKind })}>
                    <NativeSelectOption value="interrupted">{t("transport.staff.kinds.interrupted")}</NativeSelectOption>
                    <NativeSelectOption value="delayed">{t("transport.staff.kinds.delayed")}</NativeSelectOption>
                  </NativeSelect>
                </div>
              </div>
              {line && (
                <>
                  <SectionEditor line={line} from={item.from} to={item.to} onChange={(from, to) => patch(index, { from, to })} />
                  <AlternativesEditor line={line} lines={lines} value={item.alternatives} onChange={(alternatives) => patch(index, { alternatives })} />
                </>
              )}
              {items.length > 1 && (
                <Button type="button" variant="ghost" size="sm" className="w-fit" onClick={() => setItems((current) => current.filter((_, i) => i !== index))}>
                  <Trash2 aria-hidden="true" />
                  {t("transport.staff.removeLine")}
                </Button>
              )}
            </div>
          )
        })}
        {items.length < 10 && items.length < free.length && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setItems((current) => [...current, { line: free.find((candidate) => !current.some((item) => item.line === candidate.code))?.code ?? "", kind: "interrupted", from: "", to: "", alternatives: [] }])}
          >
            <Plus aria-hidden="true" />
            {t("transport.staff.addLine")}
          </Button>
        )}
      </div>

      <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-border/70 px-3 py-2.5 text-sm">
        <input type="checkbox" className="mt-1" checked={publishAlert} onChange={(event) => setPublishAlert(event.target.checked)} />
        <span>
          <span className="font-medium">{t("transport.staff.publishAlert")}</span>
          <span className="block text-xs text-muted-foreground">{t("transport.staff.publishAlertHint")}</span>
        </span>
      </label>

      {error && (
        <p role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
      <Button type="submit" size="lg" disabled={saving || free.length === 0} className="h-12 rounded-xl bg-red-600 text-white hover:bg-red-700">
        {saving && <Spinner />}
        {t("transport.staff.declare")}
      </Button>
      {free.length === 0 && <p className="text-center text-xs text-muted-foreground">{t("transport.staff.noFreeLine")}</p>}
    </form>
  )
}

// ── Modification d'une interruption en cours ──
function EditForm({ disruption, lines, onDone }: { disruption: StaffDisruption; lines: TransportLine[]; onDone: () => void }) {
  const { t } = useLanguage()
  const line = lines.find((candidate) => candidate.code === disruption.line.code)
  const [kind, setKind] = useState<DisruptionKind>(disruption.kind)
  const [from, setFrom] = useState(disruption.section?.from ?? "")
  const [to, setTo] = useState(disruption.section?.to ?? "")
  const [reason, setReason] = useState(disruption.reason)
  const [alternatives, setAlternatives] = useState<Alternative[]>(disruption.alternatives)
  const [expectedEnd, setExpectedEnd] = useState("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setSaving(true)
    try {
      await transportRepository.update(disruption.id, {
        kind,
        fromStop: from && to ? from : null,
        toStop: from && to ? to : null,
        reason: reason.trim(),
        alternatives: cleanAlternatives(alternatives),
        ...(expectedEnd ? { expectedEndAt: toIso(expectedEnd) } : {}),
      })
      toast.add({ title: t("transport.staff.updated"), type: "success" })
      onDone()
    } catch (cause) {
      setError(errorMessage(cause) || t("transport.staff.saveError"))
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="ed-reason">{t("transport.staff.reason")}</Label>
        <Input id="ed-reason" value={reason} onChange={(event) => setReason(event.target.value)} minLength={5} maxLength={200} required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="ed-kind">{t("transport.staff.kind")}</Label>
        <NativeSelect id="ed-kind" className="w-full" value={kind} onChange={(event) => setKind(event.target.value as DisruptionKind)}>
          <NativeSelectOption value="interrupted">{t("transport.staff.kinds.interrupted")}</NativeSelectOption>
          <NativeSelectOption value="delayed">{t("transport.staff.kinds.delayed")}</NativeSelectOption>
        </NativeSelect>
      </div>
      {line && (
        <>
          <SectionEditor line={line} from={from} to={to} onChange={(a, b) => { setFrom(a); setTo(b) }} />
          <AlternativesEditor line={line} lines={lines} value={alternatives} onChange={setAlternatives} />
        </>
      )}
      <div className="grid gap-2 sm:max-w-xs">
        <Label htmlFor="ed-end">{t("transport.staff.newExpectedEnd")}</Label>
        <Input id="ed-end" type="datetime-local" value={expectedEnd} onChange={(event) => setExpectedEnd(event.target.value)} />
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={saving}>
        {saving && <Spinner />}
        {t("transport.staff.save")}
      </Button>
    </form>
  )
}

interface Result {
  key: string
  data?: DisruptionPage
  error?: string
}

// Console du personnel : déclarer, modifier et terminer les interruptions du réseau de transport
export function StaffTransport() {
  const { t, locale } = useLanguage()
  const [tab, setTab] = useState<"active" | "ended">("active")
  const [page, setPage] = useState(1)
  const [reloadKey, setReloadKey] = useState(0)
  const [result, setResult] = useState<Result | null>(null)
  const [lines, setLines] = useState<TransportLine[]>([])
  const [declaring, setDeclaring] = useState(false)
  const [editing, setEditing] = useState<StaffDisruption | null>(null)
  const [ending, setEnding] = useState<number | null>(null)

  const key = `${tab}|${page}|${reloadKey}`
  const current = result?.key === key ? result : null
  const data = current?.data

  useEffect(() => {
    let mounted = true
    transportRepository
      .listDisruptions(tab, page, PAGE_SIZE)
      .then((response) => mounted && setResult({ key, data: response }))
      .catch((cause) => mounted && setResult({ key, error: errorMessage(cause) || t("transport.staff.loadError") }))
    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- key résume les entrées de la requête
  }, [key])

  // Lignes et état courant : alimentent les formulaires (une ligne déjà touchée se modifie, elle ne se redéclare pas)
  useEffect(() => {
    let mounted = true
    transportRepository
      .staffLines()
      .then((list) => mounted && setLines(list))
      .catch(() => undefined)
    return () => {
      mounted = false
    }
  }, [reloadKey])

  const reload = useCallback(() => setReloadKey((value) => value + 1), [])
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1

  const endDisruption = async (id: number) => {
    setEnding(id)
    try {
      await transportRepository.end(id)
      toast.add({ title: t("transport.staff.ended"), type: "success" })
      reload()
    } catch (cause) {
      toast.add({ title: t("transport.staff.saveError"), description: errorMessage(cause) || undefined, type: "error" })
    } finally {
      setEnding(null)
    }
  }

  return (
    <>
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">{t("transport.staff.eyebrow")}</p>
          <h1 className="mt-1 text-3xl font-medium tracking-tight sm:text-4xl">{t("transport.staff.title")}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{t("transport.staff.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={reload} aria-label={t("transport.refresh")}>
            <RefreshCw aria-hidden="true" />
          </Button>
          <Button onClick={() => setDeclaring(true)} className="h-11 rounded-xl bg-red-600 px-5 text-white hover:bg-red-700">
            <Plus aria-hidden="true" />
            {t("transport.staff.new")}
          </Button>
        </div>
      </section>

      {lines.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label={t("transport.staff.network")}>
          {lines.map((line) => (
            <li key={line.code} className="flex items-center gap-1.5 rounded-lg border border-border/70 bg-card/70 px-2 py-1">
              <LineChip line={line} size="sm" />
              <StateBadge state={line.state} label={line.stateLabel[locale === "en" ? "en" : "fr"]} />
            </li>
          ))}
        </ul>
      )}

      <div role="group" aria-label={t("transport.staff.tabsLabel")} className="flex gap-2">
        {(["active", "ended"] as const).map((value) => (
          <Button key={value} size="sm" variant={tab === value ? "default" : "outline"} aria-pressed={tab === value} onClick={() => { setTab(value); setPage(1) }}>
            {t(`transport.staff.tabs.${value}`)}
          </Button>
        ))}
      </div>

      {current?.error ? (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
          <span className="flex items-start gap-2">
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {current.error}
          </span>
          <Button variant="outline" size="sm" onClick={reload}>{t("transport.retry")}</Button>
        </div>
      ) : !data ? (
        <Skeleton className="h-40 rounded-xl" />
      ) : data.disruptions.length === 0 ? (
        <p className="rounded-2xl border border-border/80 bg-card/70 p-8 text-center text-sm text-muted-foreground">
          {t(tab === "active" ? "transport.staff.emptyActive" : "transport.staff.emptyEnded")}
        </p>
      ) : (
        <>
          <ul className="space-y-4">
            {data.disruptions.map((disruption) => (
              <li key={disruption.id} className="space-y-2">
                <DisruptionCard disruption={disruption} />
                {disruption.status === "active" && (
                  <div className="flex flex-wrap gap-2 px-1">
                    <Button variant="outline" size="sm" onClick={() => setEditing(disruption)}>{t("transport.staff.edit")}</Button>
                    <Button variant="outline" size="sm" disabled={ending === disruption.id} onClick={() => void endDisruption(disruption.id)} className="text-emerald-700 dark:text-emerald-300">
                      {ending === disruption.id && <Spinner />}
                      {t("transport.staff.markRestored")}
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
          {totalPages > 1 && (
            <nav aria-label={t("transport.staff.pagination")} className="flex items-center justify-center gap-3">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>{t("transport.staff.previous")}</Button>
              <span className="text-sm text-muted-foreground">{t("transport.staff.page", { page, pages: totalPages })}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>{t("transport.staff.next")}</Button>
            </nav>
          )}
        </>
      )}

      <Dialog open={declaring} onOpenChange={(open) => !open && setDeclaring(false)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("transport.staff.declareTitle")}</DialogTitle>
            <DialogDescription>{t("transport.staff.declareDescription")}</DialogDescription>
          </DialogHeader>
          {declaring && <DeclareForm lines={lines} onDone={() => { setDeclaring(false); setTab("active"); setPage(1); reload() }} />}
        </DialogContent>
      </Dialog>

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("transport.staff.editTitle", { code: editing?.line.code ?? "" })}</DialogTitle>
            <DialogDescription>{t("transport.staff.editDescription")}</DialogDescription>
          </DialogHeader>
          {editing && <EditForm disruption={editing} lines={lines} onDone={() => { setEditing(null); reload() }} />}
        </DialogContent>
      </Dialog>
    </>
  )
}
