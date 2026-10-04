"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, ArrowRight, BadgeCheck, CalendarClock, CircleAlert, Hash } from "lucide-react"

import { ServiceIcon } from "@/components/services/service-icon"
import { ServiceReviews } from "@/components/services/service-reviews"
import { StarDisplay } from "@/components/services/star-rating"
import { useLanguage } from "@/components/i18n/language-provider"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { AuthApiError } from "@/repository/auth.repository"
import { serviceRepository, type MunicipalService, type RelatedService } from "@/repository/service.repository"

const formatDate = (value: string) => new Date(value).toLocaleDateString("fr-FR", { dateStyle: "long" })

export function ServiceDetail() {
  const { t } = useLanguage()
  const params = useSearchParams()
  const id = Number(params.get("id"))
  const isValidId = Number.isInteger(id) && id > 0

  const [service, setService] = useState<MunicipalService | null>(null)
  const [others, setOthers] = useState<(MunicipalService | RelatedService)[]>([])
  const [error, setError] = useState("")
  // Id dont la réponse (succès ou erreur) a été reçue : évite d'afficher l'ancien service pendant un changement d'id
  const [loadedId, setLoadedId] = useState<number | null>(null)

  const backLink = (
    <Link
      href="/dashboard/services"
      className="inline-flex items-center gap-2 text-sm font-medium text-secondary-foreground transition-colors hover:text-primary"
    >
      <ArrowLeft className="size-4" aria-hidden="true" />
      {t("serviceDetail.backLink")}
    </Link>
  )

  useEffect(() => {
    if (!isValidId) return
    let mounted = true

    Promise.all([serviceRepository.get(id), serviceRepository.list()])
      .then(([current, all]) => {
        if (!mounted) return
        setService(current)
        // Les 3 services qui suivent celui-ci dans l'ordre de la ville (en reprenant au début) : chaque fiche
        // propose ainsi d'autres services, au lieu de toujours renvoyer vers les trois premiers
        // L'API choisit elle-même 3 services liés (souvent demandés ensemble, très demandés) : priorité à son choix
        if (current.related && current.related.length > 0) {
          setOthers(current.related.slice(0, 3))
          setError("")
          setLoadedId(id)
          return
        }
        const index = all.findIndex((item) => item.id === current.id)
        const rest = index === -1 ? all : [...all.slice(index + 1), ...all.slice(0, index)]
        setOthers(rest.filter((item) => item.id !== current.id).slice(0, 3))
        setError("")
        setLoadedId(id)
      })
      .catch((cause) => {
        if (!mounted) return
        setError(
          cause instanceof AuthApiError && cause.status === 404
            ? t("serviceDetail.notFound")
            : cause instanceof Error
              ? cause.message
              : t("serviceDetail.loadError")
        )
        setLoadedId(id)
      })

    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-fetch uniquement sur changement d'id
  }, [id, isValidId])

  if (!isValidId || (loadedId === id && error)) {
    return (
      <div className="space-y-6">
        {backLink}
        <p role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {isValidId ? error : t("serviceDetail.invalidId")}
        </p>
      </div>
    )
  }

  if (!service || loadedId !== id) {
    return (
      <div className="space-y-6">
        {backLink}
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {backLink}

      <header className="relative overflow-hidden flex flex-col gap-5 rounded-2xl border border-border/80 bg-card/85 p-6 shadow-sm backdrop-blur-xl sm:flex-row sm:items-start sm:p-8">
        <span className="grid size-16 shrink-0 place-items-center rounded-2xl border border-border/70 bg-muted/60 text-primary shadow-xs">
          <ServiceIcon name={service.icon} className="size-8" />
        </span>
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-semibold uppercase tracking-widest text-primary">
              MODULE MUNICIPAL // {service.code}
            </span>
            {!service.isActive && <Badge variant="outline">{t("serviceDetail.disabledBadge")}</Badge>}
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-4xl">{service.name}</h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            {service.averageRating !== null && (
              <StarDisplay value={service.averageRating} label={t("serviceReviews.averageAria", { value: service.averageRating })} />
            )}
            <span>{t("serviceReviews.count", { count: service.reviewsCount })}</span>
            {service.reviewedByMe && (
              <span className="inline-flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-300">
                <BadgeCheck className="size-4" aria-hidden="true" />
                {t("serviceReviews.reviewedBadge")}
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section aria-labelledby="service-about" className="rounded-2xl border border-border/80 bg-card/70 p-6 shadow-sm backdrop-blur-sm">
          <h2 id="service-about" className="text-lg font-semibold">{t("serviceDetail.aboutHeading")}</h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted-foreground">
            {service.description || t("serviceDetail.noDescription")}
          </p>
        </section>

        <aside aria-labelledby="service-infos" className="space-y-3 rounded-2xl border border-border/80 bg-card/70 p-6 shadow-sm backdrop-blur-sm">
          <h2 id="service-infos" className="text-sm font-semibold">{t("serviceDetail.infoHeading")}</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <Hash className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <div>
                <dt className="text-xs text-muted-foreground">{t("serviceDetail.reference")}</dt>
                <dd className="font-mono">{service.code}</dd>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CalendarClock className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <div>
                <dt className="text-xs text-muted-foreground">{t("serviceDetail.lastUpdate")}</dt>
                <dd>{formatDate(service.updatedAt)}</dd>
              </div>
            </div>
          </dl>
        </aside>
      </div>

      <ServiceReviews serviceId={service.id} />

      {others.length > 0 && (
        <section aria-labelledby="other-services" className="space-y-3">
          <h2 id="other-services" className="text-lg font-semibold">{t("serviceDetail.otherServicesHeading")}</h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((other) => (
              <li key={other.id}>
                <Link
                  href={`/dashboard/services/detail?id=${other.id}`}
                  className="group flex h-full cursor-pointer flex-col rounded-xl border border-border/80 bg-card/75 p-5 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid size-10 place-items-center rounded-lg bg-accent text-accent-foreground">
                      <ServiceIcon name={other.icon} className="size-5" />
                    </span>
                    {other.reviewedByMe && (
                      <BadgeCheck className="size-4 text-emerald-600" aria-label={t("serviceReviews.reviewedBadge")} />
                    )}
                  </div>
                  <h3 className="mt-4 text-base font-semibold">{other.name}</h3>
                  {"reason" in other && other.reason !== "catalog" && (
                    <p className="mt-1 text-xs font-medium text-primary">
                      {t(other.reason === "often_together" ? "serviceDetail.reasonOftenTogether" : "serviceDetail.reasonPopular")}
                    </p>
                  )}
                  <p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-muted-foreground">
                    {other.description || t("servicesList.noDescription")}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {other.averageRating !== null && other.averageRating !== undefined && (
                      <StarDisplay
                        value={other.averageRating}
                        label={t("serviceReviews.averageAria", { value: other.averageRating })}
                        className="[&_svg]:size-3.5"
                      />
                    )}
                    <span>{t("serviceReviews.count", { count: other.reviewsCount ?? 0 })}</span>
                  </div>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                    {t("servicesList.seeInfo")}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
