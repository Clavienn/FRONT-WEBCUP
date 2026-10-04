"use client"

import { useEffect, useState, useSyncExternalStore } from "react"
import { ChevronUp, PhoneCall, TriangleAlert, WifiOff } from "lucide-react"

import { useLanguage } from "@/components/i18n/language-provider"
import { Button } from "@/components/ui/button"
import { readEssentials, refreshEssentials, type Essentials } from "@/lib/essentials"

function subscribe(onChange: () => void) {
  window.addEventListener("online", onChange)
  window.addEventListener("offline", onChange)
  return () => {
    window.removeEventListener("online", onChange)
    window.removeEventListener("offline", onChange)
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "")
const ESSENTIALS_REFRESH_MS = 10 * 60_000
const STATUS_POLL_MS = 2 * 60_000

interface ApiStatus {
  status: "ok" | "degraded"
  features: { key: string; available: boolean; mode: "live" | "last_known" | "queued" | "unavailable"; label?: { fr: string; en: string } }[]
  message?: { fr: string; en: string }
}

// Kit essentiel : gardé à jour sur l'appareil tant que le réseau fonctionne (au chargement, toutes les 10 minutes,
// au retour de la connexion), pour pouvoir être relu sans réseau
function useEssentialsSync() {
  useEffect(() => {
    void refreshEssentials()
    const timer = window.setInterval(() => void refreshEssentials(), ESSENTIALS_REFRESH_MS)
    const onOnline = () => void refreshEssentials()
    window.addEventListener("online", onOnline)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener("online", onOnline)
    }
  }, [])
}

// État des services de l'API (GET /api/status) : un bandeau « mode dégradé » dit en clair ce qui reste disponible
function useApiStatus() {
  const [status, setStatus] = useState<ApiStatus | null>(null)
  useEffect(() => {
    if (!API_URL) return
    let mounted = true
    const load = async () => {
      if (document.visibilityState !== "visible") return
      try {
        const response = await fetch(`${API_URL}/status`, { cache: "no-store" })
        if (response.ok && mounted) setStatus((await response.json()) as ApiStatus)
      } catch {
        // API injoignable : le bandeau « hors connexion » ou les erreurs des pages prennent le relais
      }
    }
    void load()
    const timer = window.setInterval(() => void load(), STATUS_POLL_MS)
    return () => {
      mounted = false
      window.clearInterval(timer)
    }
  }, [])
  return status
}

function formatSaved(value: string | undefined, locale: string): string {
  const date = value ? new Date(value) : null
  if (!date || !Number.isFinite(date.getTime())) return "—"
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(date)
}

// Ce qui reste consultable sans réseau : numéro d'urgence EN GRAND, conduite à tenir, alertes en cours
function OfflineKit({ kit, fetchedAt }: { kit: Essentials; fetchedAt: string }) {
  const { t, locale } = useLanguage()
  const lang = locale === "en" ? "en" : "fr"
  return (
    <div className="max-h-[60vh] space-y-4 overflow-y-auto border-t border-amber-500/40 bg-background px-4 py-4 text-foreground">
      <p className="text-xs text-muted-foreground">{t("network.kitSaved", { date: formatSaved(fetchedAt, locale) })}</p>

      <div className="rounded-xl border-2 border-red-600 bg-red-600 p-4 text-white">
        <p className="flex items-center gap-2 text-lg font-bold">
          <PhoneCall className="size-5" aria-hidden="true" />
          <a href={`tel:${kit.emergency.number}`} className="underline underline-offset-4">{kit.emergency.label[lang]}</a>
        </p>
        <p className="mt-1 text-sm">{kit.emergency.note[lang]}</p>
      </div>

      <section aria-label={t("network.guideTitle")}>
        <h2 className="mb-1 text-sm font-semibold">{t("network.guideTitle")}</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {kit.offlineGuide[lang].map((line, index) => (
            <li key={index}>{line}</li>
          ))}
        </ul>
      </section>

      {kit.alerts.length > 0 && (
        <section aria-label={t("network.alertsTitle")} className="space-y-2">
          <h2 className="text-sm font-semibold">{t("network.alertsTitle")}</h2>
          {kit.alerts.map((alert) => (
            <article key={alert.id} className="rounded-lg border border-border bg-card p-3 text-sm">
              <p className="font-semibold">{alert.headline[lang]}</p>
              <p className="mt-1">{alert.message}</p>
              {alert.instructions.length > 0 && (
                <ol className="mt-2 list-decimal space-y-0.5 pl-5 font-medium">
                  {alert.instructions.map((instruction, index) => (
                    <li key={index}>{instruction}</li>
                  ))}
                </ol>
              )}
            </article>
          ))}
        </section>
      )}
    </div>
  )
}

/**
 * Deux bandeaux en bas de page, discrets tant que tout va bien (rien n'est affiché) :
 *  - connexion perdue : l'habitant sait pourquoi une action échoue, et un panneau « informations enregistrées »
 *    donne l'essentiel sans réseau (numéro d'urgence, conduite à tenir, alertes) avec l'heure de la copie ;
 *  - API en mode dégradé (base de données en panne...) : message en clair sur ce qui reste disponible.
 */
export function NetworkStatus() {
  const { t, locale } = useLanguage()
  const lang = locale === "en" ? "en" : "fr"
  const online = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true
  )
  const [kitOpen, setKitOpen] = useState(false)
  useEssentialsSync()
  const apiStatus = useApiStatus()

  const stored = !online && kitOpen ? readEssentials() : null
  const degraded = online && apiStatus?.status === "degraded"
  if (online && !degraded) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60]">
      {stored && <OfflineKit kit={stored.data} fetchedAt={stored.fetchedAt} />}
      <div
        role="status"
        aria-live="polite"
        className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-t border-amber-500/40 bg-amber-100 px-4 py-2 text-sm font-medium text-amber-950 dark:bg-amber-950 dark:text-amber-100"
      >
        {online ? <TriangleAlert className="size-4 shrink-0" aria-hidden="true" /> : <WifiOff className="size-4 shrink-0" aria-hidden="true" />}
        <span>{online ? (apiStatus?.message?.[lang] ?? t("network.degraded")) : t("network.offline")}</span>
        {!online && (
          <Button size="sm" variant="outline" aria-expanded={kitOpen} onClick={() => setKitOpen((value) => !value)} className="h-7 bg-white/80 text-amber-950 dark:bg-transparent dark:text-amber-100">
            <ChevronUp className={`transition-transform ${kitOpen ? "rotate-180" : ""}`} aria-hidden="true" />
            {t("network.kitButton")}
          </Button>
        )}
      </div>
    </div>
  )
}
