"use client"

import Link from "next/link"
import { ShieldCheck } from "lucide-react"

import { AlertCard } from "@/components/alerts/alert-card"
import { ZonePicker } from "@/components/alerts/alert-banner"
import { usePublicAlerts } from "@/components/alerts/use-public-alerts"
import { useZone } from "@/components/alerts/use-zone"
import { useLanguage } from "@/components/i18n/language-provider"
import { Breadcrumb } from "@/components/navigation/breadcrumb"
import { Skeleton } from "@/components/ui/skeleton"

// Page publique des alertes : lisible sans compte, partageable par lien. Montre ce qui est en vigueur
// (la plus grave d'abord), les fins d'alerte des dernières heures, et rassure quand tout est calme.
export function PublicAlertsPage() {
  const { t } = useLanguage()
  const { zone, setZone } = useZone()
  const { active, recentlyEnded, loaded } = usePublicAlerts(zone)

  return (
    <main className="app-atmosphere min-h-screen px-4 py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <Breadcrumb items={[{ label: t("nav.accueil"), href: "/" }, { label: t("alerts.page.title") }]} />

        <header className="space-y-3">
          <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">{t("alerts.page.title")}</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{t("alerts.page.subtitle")}</p>
          <div className="rounded-xl border border-border/80 bg-card/70 p-3">
            <ZonePicker zone={zone} onChange={setZone} />
            <p className="mt-2 text-xs text-muted-foreground">{t("alerts.page.districtHint")}</p>
          </div>
        </header>

        {!loaded ? (
          <div className="space-y-3">
            <Skeleton className="h-32 rounded-xl" />
            <Skeleton className="h-32 rounded-xl" />
          </div>
        ) : (
          <>
            {active.length === 0 ? (
              <div className="flex items-start gap-3 rounded-xl border-2 border-emerald-600/50 bg-emerald-50 p-5 text-emerald-950 dark:bg-emerald-950/50 dark:text-emerald-50">
                <ShieldCheck className="mt-0.5 size-6 shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-semibold">{t("alerts.page.calmTitle")}</p>
                  <p className="mt-1 text-sm">{zone ? t("alerts.page.calmZone", { zone: t(`alerts.zones.${zone}`) }) : t("alerts.page.calmAll")}</p>
                </div>
              </div>
            ) : (
              <section aria-label={t("alerts.page.activeTitle")} className="space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("alerts.page.activeTitle", { count: active.length })}
                </h2>
                {active.map((alert) => (
                  <AlertCard key={`${alert.id}:${alert.version}`} alert={alert} zone={zone} defaultOpen />
                ))}
              </section>
            )}

            {recentlyEnded.length > 0 && (
              <section aria-label={t("alerts.page.endedTitle")} className="space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t("alerts.page.endedTitle")}</h2>
                {recentlyEnded.map((alert) => (
                  <AlertCard key={alert.id} alert={alert} zone={zone} />
                ))}
              </section>
            )}
          </>
        )}

        <p className="text-center text-sm text-muted-foreground">
          {t("alerts.page.emergencyLine")}{" "}
          <Link href="/connexion" className="font-medium text-primary underline-offset-4 hover:underline">
            {t("alerts.page.reportLink")}
          </Link>
        </p>
      </div>
    </main>
  )
}
