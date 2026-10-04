"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { MapPin } from "lucide-react"

import { AlertCard } from "@/components/alerts/alert-card"
import { useZone } from "@/components/alerts/use-zone"
import { usePublicAlerts } from "@/components/alerts/use-public-alerts"
import { useLanguage } from "@/components/i18n/language-provider"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { ALERT_ZONES, type AlertZone, type PublicAlert } from "@/repository/alert.repository"

const DISMISSED_KEY = "terra-nova:alerts-dismissed"
const SEEN_KEY = "terra-nova:alerts-seen"
const MAX_SHOWN = 3
// Accueil : le message apparaît après 1 s, reste lisible 10 s, puis se ferme tout seul
const SHOW_DELAY_MS = 1000
const AUTO_CLOSE_MS = 10_000

// Alertes fermées par l'habitant : { id: version }. Une nouvelle version de l'alerte la ré-affiche.
// Les fins d'alerte sont repérées par la clé « e<id> ».
function readJson<T>(storage: Storage | undefined, key: string, fallback: T): T {
  try {
    const raw = storage?.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJson(storage: Storage | undefined, key: string, value: unknown) {
  try {
    storage?.setItem(key, JSON.stringify(value))
  } catch {
    // stockage indisponible : la fermeture vaut jusqu'au rechargement
  }
}

// Sélecteur « mon quartier » : sans lui, on ne sait pas à qui l'alerte s'adresse
export function ZonePicker({ zone, onChange, compact }: { zone: AlertZone | null; onChange: (zone: AlertZone | null) => void; compact?: boolean }) {
  const { t } = useLanguage()
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <MapPin className="size-4 shrink-0" aria-hidden="true" />
      <label htmlFor="alert-zone" className={compact ? "sr-only" : "font-medium"}>
        {t("alerts.myDistrict")}
      </label>
      <NativeSelect id="alert-zone" size="sm" value={zone ?? ""} onChange={(event) => onChange((event.target.value || null) as AlertZone | null)}>
        <NativeSelectOption value="">{t("alerts.chooseDistrict")}</NativeSelectOption>
        {ALERT_ZONES.map((code) => (
          <NativeSelectOption key={code} value={code}>
            {t(`alerts.zones.${code}`)}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </div>
  )
}

/**
 * Bandeau d'alertes à la population, présent sur la page d'accueil comme dans l'espace connecté.
 * - « inline » : en tête du contenu, collé en haut pendant le défilement (espace connecté) ;
 * - « floating » : sous la barre de navigation (page d'accueil).
 * Une alerte qui demande d'agir (alerte, urgence) ne se ferme pas et s'ouvre d'elle-même ; une information ou
 * une vigilance peut être fermée, mais revient si elle est mise à jour. Une urgence ouvre en plus une fenêtre
 * « que faire » une fois par version, pour qu'elle ne passe pas inaperçue.
 */
export function AlertBanner({ variant = "inline" }: { variant?: "inline" | "floating" }) {
  const { t, locale } = useLanguage()
  const lang = locale === "en" ? "en" : "fr"
  const { zone, setZone } = useZone()
  const { active, recentlyEnded, loaded } = usePublicAlerts(zone)

  const [dismissed, setDismissed] = useState<Record<string, number>>(() =>
    typeof window === "undefined" ? {} : readJson(window.localStorage, DISMISSED_KEY, {})
  )
  // Page d'accueil : le message apparaît 1 seconde après l'arrivée, pour ne pas surgir pendant le chargement
  // de la page. Dans l'espace connecté, il est affiché tout de suite.
  const [ready, setReady] = useState(variant === "inline")
  useEffect(() => {
    if (variant === "inline") return
    const timer = window.setTimeout(() => setReady(true), SHOW_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [variant])
  // Alertes refermées automatiquement sur l'accueil, pour cette visite seulement (clé id:version : une mise à
  // jour de l'alerte la ré-affiche). Le survol ou le focus met le compte à rebours en pause.
  const [autoClosed, setAutoClosed] = useState<string[]>([])
  const [paused, setPaused] = useState(false)
  const [seen, setSeen] = useState<string[]>(() => (typeof window === "undefined" ? [] : readJson(window.sessionStorage, SEEN_KEY, [])))

  const dismiss = (key: string, version: number) => {
    const next = { ...dismissed, [key]: version }
    setDismissed(next)
    writeJson(window.localStorage, DISMISSED_KEY, next)
  }

  // Une alerte qui demande d'agir n'est jamais masquée ; les autres le sont tant que leur version est celle fermée
  // Sur l'accueil, même une alerte qui demande d'agir peut être fermée (elle reste lisible sur /alertes et dans
  // l'espace connecté, où elle n'est jamais masquée) ; elle revient si l'alerte est mise à jour.
  const visibleActive = active.filter(
    (alert) => (alert.actionRequired && variant === "inline") || dismissed[String(alert.id)] !== alert.version
  )
  const visibleEnded = recentlyEnded.filter((alert) => dismissed[`e${alert.id}`] === undefined)
  const alertKey = (alert: PublicAlert) => `${alert.id}:${alert.version}`
  const shown: PublicAlert[] = [...visibleActive, ...visibleEnded]
    .filter((alert) => variant === "inline" || !autoClosed.includes(alertKey(alert)))
    .slice(0, MAX_SHOWN)
  const hiddenCount = visibleActive.length + visibleEnded.length - shown.length

  // Compte à rebours de fermeture automatique (accueil seulement), démarré quand le message est affiché
  const shownKeys = shown.map(alertKey).join(",")
  useEffect(() => {
    if (variant !== "floating" || !ready || paused || !shownKeys) return
    const keys = shownKeys.split(",")
    const timer = window.setTimeout(() => setAutoClosed((current) => [...current, ...keys]), AUTO_CLOSE_MS)
    return () => window.clearTimeout(timer)
  }, [variant, ready, paused, shownKeys])

  // Urgence : fenêtre « que faire » une seule fois par version et par session
  const emergency = visibleActive.find((alert) => alert.severity === "emergency" && !seen.includes(`${alert.id}:${alert.version}`))
  const acknowledgeEmergency = () => {
    if (!emergency) return
    const next = [...seen, `${emergency.id}:${emergency.version}`]
    setSeen(next)
    writeJson(window.sessionStorage, SEEN_KEY, next)
  }

  if (!loaded || !ready || shown.length === 0) return null

  const wrapper =
    variant === "floating"
      ? "fixed inset-x-0 top-16 z-[60] mx-auto w-full max-w-3xl px-3 pt-2"
      : "sticky top-0 z-30 w-full border-b border-border/60 bg-background/90 px-4 py-3 backdrop-blur sm:px-6 lg:px-8"

  return (
    <>
      <section
        aria-label={t("alerts.regionLabel")}
        className={wrapper}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
      >
        <div className={`${variant === "inline" ? "mx-auto max-w-7xl" : ""} space-y-2`}>
          {shown.map((alert) => (
            <AlertCard
              key={`${alert.id}:${alert.version}`}
              alert={alert}
              zone={zone}
              onDismiss={
                alert.status === "ended"
                  ? () => dismiss(`e${alert.id}`, alert.version)
                  : alert.actionRequired && variant === "inline"
                    ? undefined
                    : () => dismiss(String(alert.id), alert.version)
              }
            />
          ))}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            {zone === null ? (
              <div className="flex flex-wrap items-center gap-2 rounded-lg bg-background/80 px-2 py-1">
                <span className="font-medium">{t("alerts.pickDistrictHint")}</span>
                <ZonePicker zone={zone} onChange={setZone} compact />
              </div>
            ) : (
              <div className="rounded-lg bg-background/80 px-2 py-1">
                <ZonePicker zone={zone} onChange={setZone} />
              </div>
            )}
            <Link href="/alertes" className="rounded-lg bg-background/80 px-2 py-1 font-semibold underline underline-offset-4">
              {hiddenCount > 0 ? t("alerts.seeAllMore", { count: hiddenCount }) : t("alerts.seeAll")}
            </Link>
          </div>
        </div>
      </section>

      <AlertDialog open={emergency !== undefined} onOpenChange={(open) => !open && acknowledgeEmergency()}>
        <AlertDialogContent className="max-w-xl border-2 border-red-600">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-700 dark:text-red-300">
              {emergency ? emergency.headline[lang] : ""}
            </AlertDialogTitle>
            <AlertDialogDescription>{t("alerts.emergencyIntro")}</AlertDialogDescription>
          </AlertDialogHeader>
          {emergency && <AlertCard alert={emergency} zone={zone} defaultOpen />}
          <AlertDialogFooter>
            <AlertDialogAction onClick={acknowledgeEmergency}>{t("alerts.understood")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

