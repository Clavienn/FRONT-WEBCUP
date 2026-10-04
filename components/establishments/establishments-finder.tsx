"use client"

import { useEffect, useMemo, useState } from "react"
import { CircleAlert, MapPin, Search } from "lucide-react"

import { ServiceIcon } from "@/components/services/service-icon"
import { useLanguage } from "@/components/i18n/language-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { establishmentRepository, type Establishment } from "@/repository/establishment.repository"
import { serviceRepository, type MunicipalService } from "@/repository/service.repository"

export function EstablishmentsFinder() {
  const { t } = useLanguage()
  const [establishments, setEstablishments] = useState<Establishment[] | null>(null)
  const [services, setServices] = useState<MunicipalService[]>([])
  const [error, setError] = useState("")
  const [query, setQuery] = useState("")
  const [serviceId, setServiceId] = useState<number | "all">("all")

  useEffect(() => {
    let mounted = true
    establishmentRepository
      .list()
      .then((data) => mounted && setEstablishments(data))
      .catch((cause) => mounted && setError(cause instanceof Error ? cause.message : t("establishmentsFinder.loadError")))
    serviceRepository.list().then((data) => mounted && setServices(data)).catch(() => undefined)
    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement unique au montage ; t() n'a pas besoin de redéclencher le fetch
  }, [])

  const servicesInUse = useMemo(() => {
    if (!establishments) return []
    const ids = new Set(establishments.map((item) => item.service?.id).filter((id): id is number => id !== undefined && id !== null))
    return services.filter((service) => ids.has(service.id))
  }, [establishments, services])

  const filtered = useMemo(() => {
    if (!establishments) return null
    const term = query.trim().toLowerCase()
    return establishments.filter((item) => {
      if (serviceId !== "all" && item.service?.id !== serviceId) return false
      if (!term) return true
      return `${item.name} ${item.address} ${item.description ?? ""}`.toLowerCase().includes(term)
    })
  }, [establishments, query, serviceId])

  return (
    <>
      <section className="relative overflow-hidden rounded-2xl border border-border/80 bg-card/85 p-6 shadow-sm backdrop-blur-xl sm:p-7">
        <div className="mb-3 flex items-center justify-between border-b border-border/60 pb-2.5 text-[11px] font-mono tracking-wider text-muted-foreground">
          <span className="flex items-center gap-2 font-medium text-primary">
            <span className="size-2 rounded-full bg-cyan-400 animate-pulse" />
            CARTOGRAPHIE & INFRASTRUCTURES DE LA VILLE
          </span>
          <span className="hidden sm:inline font-mono text-xs uppercase text-muted-foreground">
            LOCALISATION DÔME & DISTRICTS
          </span>
        </div>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">{t("establishmentsFinder.eyebrow")}</p>
            <h1 className="font-display mt-1 text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
              {t("establishmentsFinder.title")}
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">{t("establishmentsFinder.subtitle")}</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              type="search"
              aria-label={t("establishmentsFinder.searchAriaLabel")}
              placeholder={t("establishmentsFinder.searchPlaceholder")}
              className="pl-9"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>
      </section>

      {servicesInUse.length > 0 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label={t("establishmentsFinder.filterAriaLabel")}>
          <Button
            type="button"
            variant={serviceId === "all" ? "default" : "outline"}
            size="sm"
            className="rounded-full"
            onClick={() => setServiceId("all")}
          >
            {t("establishmentsFinder.allServices")}
          </Button>
          {servicesInUse.map((service) => (
            <Button
              key={service.id}
              type="button"
              variant={serviceId === service.id ? "default" : "outline"}
              size="sm"
              className="rounded-full"
              onClick={() => setServiceId(service.id)}
            >
              <ServiceIcon name={service.icon} className="size-3.5" />
              {service.name}
            </Button>
          ))}
        </div>
      )}

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
          {query || serviceId !== "all" ? t("establishmentsFinder.noResultsQuery") : t("establishmentsFinder.noResults")}
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item) => (
            <li key={item.id} className="rounded-xl border border-border/80 bg-card/75 p-5 shadow-sm backdrop-blur-sm">
              <div className="flex items-start justify-between gap-3">
                <span className="grid size-10 place-items-center rounded-lg bg-accent text-accent-foreground">
                  <ServiceIcon name={item.service?.icon ?? null} className="size-5" />
                </span>
                <Badge variant="outline" className={item.isOpen ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "border-destructive/30 bg-destructive/10 text-destructive"}>
                  {item.isOpen ? t("establishmentsFinder.open") : t("establishmentsFinder.closed")}
                </Badge>
              </div>
              <h2 className="mt-4 text-base font-semibold">{item.name}</h2>
              {item.service && <p className="mt-0.5 text-xs text-muted-foreground">{item.service.name}</p>}
              <p className="mt-1 flex items-start gap-1.5 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                {item.address}
              </p>
              {item.statusNote && (
                <p className="mt-2 text-sm font-medium text-amber-700 dark:text-amber-300">{item.statusNote}</p>
              )}
              {item.description && (
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
