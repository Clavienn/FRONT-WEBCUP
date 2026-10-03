"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowRight, CircleAlert, Search } from "lucide-react"

import { ServiceIcon } from "@/components/services/service-icon"
import { useLanguage } from "@/components/i18n/language-provider"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { serviceRepository, type MunicipalService } from "@/repository/service.repository"

export function ServicesList() {
  const { t } = useLanguage()
  const [services, setServices] = useState<MunicipalService[] | null>(null)
  const [error, setError] = useState("")
  const [query, setQuery] = useState("")

  useEffect(() => {
    let mounted = true
    serviceRepository
      .list()
      .then((data) => mounted && setServices(data))
      .catch((cause) => mounted && setError(cause instanceof Error ? cause.message : t("servicesList.loadError")))
    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement unique au montage ; t() n'a pas besoin de redéclencher le fetch
  }, [])

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term || !services) return services
    return services.filter((service) =>
      `${service.name} ${service.description ?? ""}`.toLowerCase().includes(term)
    )
  }, [query, services])

  return (
    <>
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">{t("servicesList.eyebrow")}</p>
          <h1 className="mt-1 text-3xl font-medium tracking-tight sm:text-4xl">{t("servicesList.title")}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {t("servicesList.subtitle")}
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            type="search"
            aria-label={t("servicesList.searchAriaLabel")}
            placeholder={t("servicesList.searchPlaceholder")}
            className="pl-9"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </section>

      {error ? (
        <p role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : !filtered ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="rounded-2xl border border-border/80 bg-card/70 p-8 text-center text-sm text-muted-foreground">
          {query ? t("servicesList.noResultsQuery") : t("servicesList.noResults")}
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((service) => (
            <li key={service.id}>
              <Link
                href={`/dashboard/services/detail?id=${service.id}`}
                className="group block h-full cursor-pointer rounded-xl border border-border/80 bg-card/75 p-5 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="grid size-10 place-items-center rounded-lg bg-accent text-accent-foreground">
                    <ServiceIcon name={service.icon} className="size-5" />
                  </span>
                  <Badge variant="outline" className="font-mono text-[11px]">{service.code}</Badge>
                </div>
                <h2 className="mt-4 text-base font-semibold">{service.name}</h2>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
                  {service.description || t("servicesList.noDescription")}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                  {t("servicesList.seeInfo")}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
