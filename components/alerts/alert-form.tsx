"use client"

import { useEffect, useState, type FormEvent } from "react"
import { CircleAlert, Plus, Send, Sparkles, Trash2 } from "lucide-react"

import { AlertCard } from "@/components/alerts/alert-card"
import { useLanguage } from "@/components/i18n/language-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { AuthApiError } from "@/repository/auth.repository"
import {
  ALERT_HAZARDS,
  ALERT_SEVERITIES,
  ALERT_ZONES,
  SEVERITY_REQUIRES_ACTION,
  alertRepository,
  type AlertColor,
  type AlertDraftResponse,
  type AlertHazard,
  type AlertSeverity,
  type AlertZone,
  type AlertZoneOrAll,
  type NewAlertInput,
  type PublicAlert,
  type StaffAlert,
} from "@/repository/alert.repository"

const MAX_INSTRUCTIONS = 6
const SEVERITY_COLOR: Record<AlertSeverity, AlertColor> = { info: "blue", watch: "yellow", warning: "orange", emergency: "red" }
// Durées proposées ; « auto » laisse le serveur choisir selon la gravité (urgence 6 h, alerte 12 h, le reste 24 h)
const DURATIONS = [60, 180, 360, 720, 1440, 2880, 4320]

const errorMessage = (cause: unknown) => (cause instanceof Error ? cause.message : "")

export function durationLabel(minutes: number): string {
  return minutes < 1440 ? `${minutes / 60} h` : `${minutes / 1440} j`
}

// Consignes : courtes, une par ligne, 6 au plus. Une consigne longue n'est pas lue en situation de stress.
export function InstructionsEditor({ value, onChange }: { value: string[]; onChange: (value: string[]) => void }) {
  const { t } = useLanguage()
  return (
    <div className="space-y-2">
      <ol className="space-y-2">
        {value.map((instruction, index) => (
          <li key={index} className="flex items-center gap-2">
            <span className="w-5 shrink-0 text-right text-sm font-semibold text-muted-foreground">{index + 1}.</span>
            <Input
              value={instruction}
              maxLength={160}
              aria-label={t("alerts.staff.instructionN", { n: index + 1 })}
              onChange={(event) => onChange(value.map((item, i) => (i === index ? event.target.value : item)))}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t("alerts.staff.removeInstruction")}
              onClick={() => onChange(value.filter((_, i) => i !== index))}
            >
              <Trash2 />
            </Button>
          </li>
        ))}
      </ol>
      {value.length < MAX_INSTRUCTIONS && (
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...value, ""])}>
          <Plus aria-hidden="true" />
          {t("alerts.staff.addInstruction")}
        </Button>
      )}
    </div>
  )
}

export interface AlertPrefill {
  hazard?: AlertHazard
  severity?: AlertSeverity
  zone?: AlertZone
  // Demande tout de suite un brouillon à l'IA (point chaud : « Prévenir le quartier »)
  autoDraft?: boolean
}

// Publication d'une alerte, avec aperçu en direct : le rédacteur voit EXACTEMENT ce que les habitants verront
export function AlertForm({ prefill, onPublished }: { prefill?: AlertPrefill; onPublished: (alert: StaffAlert) => void }) {
  const { t, tList, locale } = useLanguage()
  const lang = locale === "en" ? "en" : "fr"
  const [hazard, setHazard] = useState<AlertHazard>(prefill?.hazard ?? "flood")
  const [severity, setSeverity] = useState<AlertSeverity>(prefill?.severity ?? "warning")
  const [zones, setZones] = useState<AlertZoneOrAll[]>(prefill?.zone ? [prefill.zone] : [])
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [instructions, setInstructions] = useState<string[]>([])
  const [duration, setDuration] = useState("")
  // Durées proposées + celle du brouillon de l'IA si elle n'est pas dans la liste
  const [durations, setDurations] = useState<number[]>(DURATIONS)
  // Assistant de rédaction : l'agent garde la main, le formulaire reste modifiable pendant la rédaction
  const [drafting, setDrafting] = useState(false)
  const [draftInfo, setDraftInfo] = useState<Pick<AlertDraftResponse, "source" | "basedOn" | "notice"> | null>(null)
  const [notes, setNotes] = useState("")
  const [showNotes, setShowNotes] = useState(false)
  const [error, setError] = useState("")
  const [isSending, setIsSending] = useState(false)

  const needsAction = SEVERITY_REQUIRES_ACTION[severity]
  const cleanInstructions = instructions.map((item) => item.trim()).filter(Boolean)

  // Modèle prêt à adapter : en situation d'urgence, on ne part pas d'une page blanche
  const applyTemplate = (kind: "flood" | "heavyRain") => {
    setHazard(kind === "flood" ? "flood" : "heavy_rain")
    setSeverity("warning")
    if (zones.length === 0) setZones(["south"])
    setTitle(t(`alerts.staff.templates.${kind}.title`))
    setMessage(t(`alerts.staff.templates.${kind}.message`))
    setInstructions(tList(`alerts.staff.templates.${kind}.instructions`))
  }

  // Brouillon rédigé par l'IA à partir des signalements du quartier ; rien n'est publié
  const requestDraft = async (zoneOverride?: AlertZoneOrAll) => {
    const zone = zoneOverride ?? (zones.length === 1 ? zones[0] : null)
    if (!zone) return setError(t("alerts.staff.aiNeedZone"))
    setError("")
    setDrafting(true)
    try {
      const response = await alertRepository.draft({
        zone,
        ...(prefill?.hazard ? { hazard: prefill.hazard } : {}),
        ...(notes.trim().length >= 3 ? { notes: notes.trim() } : {}),
      })
      const { draft } = response
      setHazard(draft.hazard)
      setSeverity(draft.severity)
      setZones(draft.zones)
      setTitle(draft.title)
      setMessage(draft.message)
      setInstructions(draft.instructions)
      if (draft.expiresInMinutes) {
        setDurations((current) => (current.includes(draft.expiresInMinutes) ? current : [...current, draft.expiresInMinutes].sort((a, b) => a - b)))
        setDuration(String(draft.expiresInMinutes))
      }
      setDraftInfo({ source: response.source, basedOn: response.basedOn, notice: response.notice })
    } catch (cause) {
      // 422 nothing_to_draft : aucun signalement récent ni note -> proposer d'écrire une précision
      if (cause instanceof AuthApiError && cause.code === "nothing_to_draft") setShowNotes(true)
      setError(errorMessage(cause) || t("alerts.staff.aiError"))
    } finally {
      setDrafting(false)
    }
  }

  // Ouvert depuis un point chaud : le brouillon est demandé dès l'affichage
  useEffect(() => {
    if (prefill?.autoDraft && prefill.zone) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- demande unique à l'ouverture du formulaire
      void requestDraft(prefill.zone)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- une seule fois, à l'ouverture
  }, [])

  const toggleZone = (zone: AlertZoneOrAll, checked: boolean) => {
    if (zone === "all") return setZones(checked ? ["all"] : [])
    setZones((current) => {
      const withoutAll = current.filter((item) => item !== "all")
      return checked ? [...withoutAll, zone] : withoutAll.filter((item) => item !== zone)
    })
  }

  // Aperçu : la même vue publique que celle de l'API, construite avec les textes de la langue courante
  const preview: PublicAlert = {
    id: 0,
    status: "active",
    severity,
    severityLabel: { fr: t(`alerts.severity.${severity}`), en: t(`alerts.severity.${severity}`) },
    color: SEVERITY_COLOR[severity],
    actionRequired: needsAction,
    hazard,
    hazardLabel: { fr: t(`alerts.hazards.${hazard}`), en: t(`alerts.hazards.${hazard}`) },
    zones,
    zoneLabels: {
      fr: zones.map((zone) => t(`alerts.zones.${zone}`)),
      en: zones.map((zone) => t(`alerts.zones.${zone}`)),
    },
    headline: { fr: title, en: title },
    title: title || t("alerts.staff.previewTitle"),
    message: message || t("alerts.staff.previewMessage"),
    instructions: cleanInstructions,
    endMessage: null,
    issuer: { fr: t("alerts.issuer"), en: t("alerts.issuer") },
    startsAt: "",
    expiresAt: "",
    endedAt: null,
    updatedAt: "",
    version: 1,
    updates: [],
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSending) return
    if (zones.length === 0) return setError(t("alerts.staff.zonesRequired"))
    if (needsAction && cleanInstructions.length === 0) return setError(t("alerts.staff.instructionsRequired"))

    setError("")
    setIsSending(true)
    const input: NewAlertInput = {
      title: title.trim(),
      hazard,
      severity,
      zones,
      message: message.trim(),
      instructions: cleanInstructions,
      ...(duration ? { expiresInMinutes: Number(duration) } : {}),
    }
    try {
      onPublished(await alertRepository.publish(input))
    } catch (cause) {
      // Message de l'API affiché tel quel (400 lisibles ; 403 « agent non validé »)
      setError(errorMessage(cause) || t("alerts.staff.publishError"))
      setIsSending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      <div className="grid gap-2 rounded-xl border border-dashed border-border bg-background/50 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" disabled={drafting} onClick={() => void requestDraft()}>
            {drafting ? <Spinner /> : <Sparkles aria-hidden="true" />}
            {drafting ? t("alerts.staff.aiDrafting") : t("alerts.staff.aiDraft")}
          </Button>
          <button
            type="button"
            className="cursor-pointer text-xs font-medium text-primary underline-offset-4 hover:underline"
            aria-expanded={showNotes}
            onClick={() => setShowNotes((value) => !value)}
          >
            {t("alerts.staff.aiNotesToggle")}
          </button>
          <span aria-live="polite" className="sr-only">{drafting ? t("alerts.staff.aiDrafting") : ""}</span>
        </div>
        {showNotes && (
          <Textarea
            aria-label={t("alerts.staff.aiNotesLabel")}
            rows={2}
            value={notes}
            maxLength={1000}
            onChange={(event) => setNotes(event.target.value)}
            placeholder={t("alerts.staff.aiNotesPlaceholder")}
          />
        )}
        {draftInfo && (
          <div className="space-y-1 text-xs">
            <p className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-violet-500/40 bg-violet-500/10 text-violet-800 dark:text-violet-200">
                {draftInfo.source === "ai" ? t("alerts.staff.aiBadge") : t("alerts.staff.aiBadgeTemplate")}
              </Badge>
              <span className="text-muted-foreground">
                {t("alerts.staff.aiBasedOn", { count: draftInfo.basedOn.signalements, locations: draftInfo.basedOn.locations.join(", ") || "—" })}
              </span>
            </p>
            {draftInfo.notice && <p className="text-muted-foreground">{draftInfo.notice}</p>}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">{t("alerts.staff.templatesLabel")}</span>
        <Button type="button" variant="outline" size="sm" onClick={() => applyTemplate("flood")}>
          {t("alerts.staff.templates.flood.button")}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => applyTemplate("heavyRain")}>
          {t("alerts.staff.templates.heavyRain.button")}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="al-hazard">{t("alerts.staff.hazard")}</Label>
          <NativeSelect id="al-hazard" className="w-full" value={hazard} onChange={(event) => setHazard(event.target.value as AlertHazard)}>
            {ALERT_HAZARDS.filter((value) => value !== "transport").map((value) => (
              <NativeSelectOption key={value} value={value}>{t(`alerts.hazards.${value}`)}</NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="al-severity">{t("alerts.staff.severity")}</Label>
          <NativeSelect id="al-severity" className="w-full" value={severity} onChange={(event) => setSeverity(event.target.value as AlertSeverity)}>
            {ALERT_SEVERITIES.map((value) => (
              <NativeSelectOption key={value} value={value}>{t(`alerts.severity.${value}`)}</NativeSelectOption>
            ))}
          </NativeSelect>
        </div>
      </div>

      <fieldset className="grid gap-2">
        <legend className="text-sm font-medium leading-none">{t("alerts.staff.zones")}</legend>
        <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1">
          {(["all", ...ALERT_ZONES] as AlertZoneOrAll[]).map((zone) => (
            <label key={zone} htmlFor={`al-zone-${zone}`} className="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox
                id={`al-zone-${zone}`}
                checked={zones.includes(zone)}
                disabled={zone !== "all" && zones.includes("all")}
                onCheckedChange={(checked) => toggleZone(zone, checked === true)}
              />
              {t(`alerts.zones.${zone}`)}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-2">
        <Label htmlFor="al-title">{t("alerts.staff.titleLabel")}</Label>
        <Input id="al-title" value={title} onChange={(event) => setTitle(event.target.value)} minLength={5} maxLength={120} required />
        <p className="text-xs text-muted-foreground">{t("alerts.staff.titleHint")}</p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="al-message">{t("alerts.staff.message")}</Label>
        <Textarea id="al-message" rows={3} value={message} onChange={(event) => setMessage(event.target.value)} minLength={10} maxLength={1000} required />
        <p className="text-xs text-muted-foreground">{t("alerts.staff.messageHint")}</p>
      </div>

      <div className="grid gap-2">
        <Label>
          {t("alerts.staff.instructions")}
          {needsAction && <span className="ml-1 text-destructive">*</span>}
        </Label>
        <p className="text-xs text-muted-foreground">{needsAction ? t("alerts.staff.instructionsRequiredHint") : t("alerts.staff.instructionsHint")}</p>
        <InstructionsEditor value={instructions} onChange={setInstructions} />
      </div>

      <div className="grid gap-2 sm:max-w-xs">
        <Label htmlFor="al-duration">{t("alerts.staff.duration")}</Label>
        <NativeSelect id="al-duration" className="w-full" value={duration} onChange={(event) => setDuration(event.target.value)}>
          <NativeSelectOption value="">{t("alerts.staff.durationAuto")}</NativeSelectOption>
          {durations.map((minutes) => (
            <NativeSelectOption key={minutes} value={minutes}>{durationLabel(minutes)}</NativeSelectOption>
          ))}
        </NativeSelect>
      </div>

      <div className="grid gap-2">
        <p className="text-sm font-medium">{t("alerts.staff.preview")}</p>
        <AlertCard alert={preview} zone={null} defaultOpen />
      </div>

      {error && (
        <p role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}

      <Button type="submit" size="lg" disabled={isSending} className="h-12 rounded-xl bg-red-600 text-base text-white hover:bg-red-700">
        {isSending ? <Spinner /> : <Send aria-hidden="true" />}
        {t("alerts.staff.publish")}
      </Button>
      <p className="text-center text-xs text-muted-foreground">{t("alerts.staff.publishWarning", { lang })}</p>
    </form>
  )
}
