"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CircleAlert, TrendingUp } from "lucide-react"

import { ServiceIcon } from "@/components/services/service-icon"
import { useLanguage } from "@/components/i18n/language-provider"
import { Skeleton } from "@/components/ui/skeleton"
import { serviceRepository, type MunicipalService } from "@/repository/service.repository"

const TOP_COUNT = 3

// Mise en avant demandée par l'institution : les services les plus demandés, identiques pour
// agents et administrateurs, pour que l'équipe municipale priorise les mêmes démarches.
export function MostUsedServices() {
  const { t } = useLanguage()
  const [services, setServices] = useState<MunicipalService[] | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    let mounted = true
    serviceRepository
      .list({ sort: "mostUsed", limit: TOP_COUNT })
      .then((data) => mounted && setServices(data))
      .catch((cause) => mounted && setError(cause instanceof Error ? cause.message : t("mostUsedServices.loadError")))
    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement unique au montage ; t() n'a pas besoin de redéclencher le fetch
  }, [])

  return (
    <section aria-labelledby="most-used-services-title" className="space-y-3">
      <div>
        <h2 id="most-used-services-title" className="text-lg font-semibold">
          {t("mostUsedServices.title")}
        </h2>
        <p className="text-sm text-muted-foreground">{t("mostUsedServices.subtitle")}</p>
      </div>

      {error ? (
        <p role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : !services ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: TOP_COUNT }, (_, index) => (
            <Skeleton key={index} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : services.length === 0 ? (
        <div className="rounded-xl border border-border/80 bg-card/70 p-5 text-center">
          <p className="text-sm font-medium">{t("mostUsedServices.emptyTitle")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("mostUsedServices.emptyDescription")}</p>
        </div>
      ) : (
        <ol className="grid gap-3 sm:grid-cols-3">
          {services.map((service, index) => (
            <li key={service.id}>
              <Link
                href={`/dashboard/services/detail?id=${service.id}`}
                className="group block h-full rounded-xl border border-border/80 bg-card/70 p-4 shadow-sm backdrop-blur-sm transition-colors hover:border-primary/50"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground"
                      aria-label={t("mostUsedServices.rankAria", { rank: index + 1 })}
                    >
                      <ServiceIcon name={service.icon} className="size-4" />
                    </span>
                    <h3 className="truncate text-sm font-semibold">{service.name}</h3>
                  </div>
                  <span className="text-xl font-semibold tabular-nums text-muted-foreground">#{index + 1}</span>
                </div>
                <p className="mt-3 flex items-center gap-1.5 border-t border-border/70 pt-3 text-xs text-muted-foreground">
                  <TrendingUp className="size-3.5 shrink-0" aria-hidden="true" />
                  {t("mostUsedServices.requestsCount", { count: service.requestsCount ?? 0 })}
                </p>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
