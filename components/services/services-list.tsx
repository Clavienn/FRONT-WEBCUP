"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowRight, CircleAlert, MessageSquareText, Search, BadgeCheck, TrendingUp } from "lucide-react"

import { ServiceIcon } from "@/components/services/service-icon"
import { StarDisplay } from "@/components/services/star-rating"
import { useLanguage } from "@/components/i18n/language-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { serviceRepository, type MunicipalService } from "@/repository/service.repository"

export function ServicesList() {
  const { t } = useLanguage()
  const [services, setServices] = useState<MunicipalService[] | null>(null)
  const [error, setError] = useState("")
  const [query, setQuery] = useState("")
  const [sortByUsage, setSortByUsage] = useState(false)

  useEffect(() => {
    let mounted = true
    serviceRepository
      .list(sortByUsage ? { sort: "mostUsed" } : {})
      .then((data) => mounted && setServices(data))
      .catch((cause) => mounted && setError(cause instanceof Error ? cause.message : t("servicesList.loadError")))
    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- t() n'a pas besoin de redéclencher le fetch
  }, [sortByUsage])

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term || !services) return services
    return services.filter((service) =>
      `${service.name} ${service.description ?? ""}`.toLowerCase().includes(term)
    )
  }, [query, services])

  return (
    <>
      <section className="relative overflow-hidden rounded-2xl border border-border/80 bg-card/85 p-6 shadow-sm backdrop-blur-xl sm:p-7">
        <div className="mb-3 flex items-center justify-between border-b border-border/60 pb-2.5 text-[11px] font-mono tracking-wider text-muted-foreground">
          <span className="flex items-center gap-2 font-medium text-primary">
            <span className="size-2 rounded-full bg-cyan-400 animate-pulse" />
            REGISTRE DES SERVICES DU DÔME // TERRA NOVA
          </span>
          <span className="hidden sm:inline font-mono text-xs uppercase text-muted-foreground">
            ACCÈS CITOYEN & HABITAT
          </span>
        </div>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">{t("servicesList.eyebrow")}</p>
            <h1 className="font-display mt-1 text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
              {t("servicesList.title")}
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {t("servicesList.subtitle")}
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
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
            <Button
              type="button"
              variant={sortByUsage ? "default" : "outline"}
              size="sm"
              aria-pressed={sortByUsage}
              onClick={() => setSortByUsage((on) => !on)}
              className="w-fit"
            >
              <TrendingUp className="size-4" aria-hidden="true" />
              {t("servicesList.sortByMostUsed")}
            </Button>
          </div>
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
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  {service.averageRating !== null && (
                    <StarDisplay
                      value={service.averageRating}
                      label={t("serviceReviews.averageAria", { value: service.averageRating })}
                      className="[&_svg]:size-3.5"
                    />
                  )}
                  <span className="inline-flex items-center gap-1">
                    <MessageSquareText className="size-3.5" aria-hidden="true" />
                    {t("serviceReviews.count", { count: service.reviewsCount })}
                  </span>
                  {service.requestsCount !== undefined && (
                    <span className="inline-flex items-center gap-1">
                      <TrendingUp className="size-3.5" aria-hidden="true" />
                      {t("servicesList.requestsCount", { count: service.requestsCount })}
                    </span>
                  )}
                  {service.reviewedByMe && (
                    <span
                      className="inline-flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-300"
                      title={t("serviceReviews.reviewedBadge")}
                    >
                      <BadgeCheck className="size-3.5" aria-hidden="true" />
                      <span className="sr-only">{t("serviceReviews.reviewedBadge")}</span>
                    </span>
                  )}
                </div>
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