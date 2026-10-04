"use client"

import { useEffect, useState, type FormEvent } from "react"
import { CircleAlert, Phone, Send, Siren } from "lucide-react"

import { useZone } from "@/components/alerts/use-zone"
import { useLanguage } from "@/components/i18n/language-provider"
import { AlertCard } from "@/components/alerts/alert-card"
import { formatMinutes } from "@/components/signalements/signalement-badges"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { ALERT_ZONES, type AlertZone } from "@/repository/alert.repository"
import {
  signalementRepository,
  type SignalementReceipt,
  type SignalementType,
  type SignalementTypeInfo,
} from "@/repository/signalement.repository"

// Formulaire de signalement d'urgence. VOLONTAIREMENT sans protection anti-robots (jeton, délai minimal) :
// l'API n'en demande pas, une personne en détresse ne doit pas attendre. Pas de champ « priorité » non plus :
// elle vient du type, et la personne peut seulement l'élever (« danger immédiat »).
export function ReportForm({ onSent }: { onSent: (receipt: SignalementReceipt) => void }) {
  const { t, locale } = useLanguage()
  const [types, setTypes] = useState<SignalementTypeInfo[] | null>(null)
  const [type, setType] = useState<SignalementType>("medical")
  const { zone: savedZone, setZone: saveZone } = useZone()
  // Pré-rempli avec le quartier mémorisé : le renseigner une fois suffit, ici comme pour les alertes
  const [zone, setZone] = useState<AlertZone | "">(savedZone ?? "")
  const [location, setLocation] = useState("")
  const [lifeThreatening, setLifeThreatening] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [phone, setPhone] = useState("")
  const [error, setError] = useState("")
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    let mounted = true
    signalementRepository
      .types()
      .then((list) => mounted && setTypes(list))
      .catch(() => mounted && setTypes([]))
    return () => {
      mounted = false
    }
  }, [])

  const current = types?.find((item) => item.code === type)
  // Urgence vitale (médical, incendie) : seul l'essentiel est demandé, le reste est repliable
  const isEmergency = current?.emergency ?? (type === "medical" || type === "fire")

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSending) return
    if (location.trim().length < 2) {
      setError(t("signalements.form.locationRequired"))
      return
    }
    setError("")
    setIsSending(true)
    try {
      const receipt = await signalementRepository.create({
        type,
        location: location.trim(),
        ...(zone ? { zone } : {}),
        ...(lifeThreatening ? { lifeThreatening: true } : {}),
        ...(title.trim() ? { title: title.trim() } : {}),
        ...(description.trim() ? { description: description.trim() } : {}),
        ...(phone.trim() ? { contactPhone: phone.trim() } : {}),
      })
      if (zone && zone !== savedZone) saveZone(zone)
      onSent(receipt)
    } catch (cause) {
      // Y compris 429 RATE_LIMITED : le message de l'API invite à appeler les secours
      setError(cause instanceof Error ? cause.message : t("signalements.form.sendError"))
      setIsSending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      {isEmergency && (
        <p role="note" className="flex items-start gap-2 rounded-lg border border-red-600/40 bg-red-600/10 px-3 py-2.5 text-sm font-medium text-red-900 dark:text-red-100">
          <Siren className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {t("signalements.form.callEmergency")}
        </p>
      )}

      <div className="grid gap-2">
        <Label htmlFor="sig-type">{t("signalements.form.typeLabel")}</Label>
        <NativeSelect
          id="sig-type"
          className="w-full"
          value={type}
          onChange={(event) => setType(event.target.value as SignalementType)}
        >
          {(types ?? []).map((item) => (
            <NativeSelectOption key={item.code} value={item.code}>
              {item.label[locale]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="sig-location">{t("signalements.form.locationLabel")}</Label>
        <Input
          id="sig-location"
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          placeholder={t("signalements.form.locationPlaceholder")}
          maxLength={255}
          required
          autoFocus
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="sig-zone">{t("signalements.form.zoneLabel")}</Label>
        <NativeSelect id="sig-zone" className="w-full" value={zone} onChange={(event) => setZone(event.target.value as AlertZone | "")}>
          <NativeSelectOption value="">{t("signalements.form.zoneNone")}</NativeSelectOption>
          {ALERT_ZONES.map((code) => (
            <NativeSelectOption key={code} value={code}>{t(`alerts.zones.${code}`)}</NativeSelectOption>
          ))}
        </NativeSelect>
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-border/70 px-3 py-2.5">
        <Checkbox
          id="sig-life"
          checked={lifeThreatening}
          onCheckedChange={(checked) => setLifeThreatening(checked === true)}
          className="mt-0.5"
        />
        <Label htmlFor="sig-life" className="cursor-pointer text-sm leading-5">
          {t("signalements.form.lifeThreatening")}
        </Label>
      </div>

      {/* Pour une urgence vitale, les détails passent après : type + lieu suffisent à envoyer */}
      <details open={!isEmergency} className="group rounded-lg border border-border/70 px-3 py-2">
        <summary className="cursor-pointer text-sm font-medium">{t("signalements.form.moreDetails")}</summary>
        <div className="mt-3 grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="sig-phone">{t("signalements.form.phoneLabel")}</Label>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                id="sig-phone"
                type="tel"
                autoComplete="tel"
                className="pl-9"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                maxLength={30}
              />
            </div>
            <p className="text-xs text-muted-foreground">{t("signalements.form.phoneHint")}</p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sig-title">{t("signalements.form.titleLabel")}</Label>
            <Input id="sig-title" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={200} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sig-description">{t("signalements.form.descriptionLabel")}</Label>
            <Textarea
              id="sig-description"
              rows={4}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={5000}
            />
          </div>
        </div>
      </details>

      {error && (
        <p role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}

      <Button type="submit" size="lg" disabled={isSending || types === null} className="h-12 rounded-xl bg-red-600 text-base text-white hover:bg-red-700">
        {isSending ? <Spinner /> : <Send aria-hidden="true" />}
        {isSending ? t("signalements.form.sending") : t("signalements.form.submit")}
      </Button>
    </form>
  )
}

// Écran de confirmation : la consigne de l'API (appeler aussi les secours) est mise en évidence
export function ReportReceipt({ receipt, onClose }: { receipt: SignalementReceipt; onClose: () => void }) {
  const { t } = useLanguage()
  return (
    <div className="grid gap-4" role="status">
      <div className="flex items-start gap-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4">
        <Siren className="mt-0.5 size-5 shrink-0 text-emerald-700 dark:text-emerald-300" aria-hidden="true" />
        <div>
          <p className="font-semibold">{t("signalements.receipt.title")}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("signalements.receipt.reference", { id: receipt.id })} ·{" "}
            {t("signalements.receipt.target", { duration: formatMinutes(receipt.acknowledgeTargetMinutes) })}
          </p>
          {receipt.duplicate && <p className="mt-1 text-sm">{t("signalements.receipt.duplicate")}</p>}
        </div>
      </div>
      {receipt.guidance && (
        <p className="rounded-xl border-2 border-red-600/60 bg-red-600/10 p-4 text-base font-semibold leading-6 text-red-900 dark:text-red-100">
          {receipt.guidance}
        </p>
      )}
      {receipt.activeAlerts?.length > 0 && (
        <section aria-label={t("signalements.receipt.alertsTitle")} className="grid gap-2">
          <p className="text-sm font-semibold">{t("signalements.receipt.alertsTitle")}</p>
          {receipt.activeAlerts.map((alert) => (
            <AlertCard key={`${alert.id}:${alert.version}`} alert={alert} zone={null} defaultOpen />
          ))}
        </section>
      )}
      <Button onClick={onClose}>{t("signalements.receipt.close")}</Button>
    </div>
  )
}
