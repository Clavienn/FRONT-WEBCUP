"use client"

import { useEffect, useMemo, useState } from "react"
import {
  CircleAlert,
  Clock,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Search,
  ExternalLink,
  Building2,
} from "lucide-react"

import { useLanguage } from "@/components/i18n/language-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/toast"
import { partnerServiceRepository, type PartnerService } from "@/repository/partnerService.repository"
import { PartnerContactDialog } from "@/components/partners/partner-contact-dialog"

// Action affichée directement sur la fiche, pour agir sans changer d'écran
function NextAction({ service }: { service: PartnerService }) {
  if (!service.nextActionLabel || !service.nextActionType || !service.nextActionValue) return null
  const label = service.nextActionLabel

  if (service.nextActionType === "phone") {
    return (
      <a href={`tel:${service.nextActionValue}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
        <Phone className="size-4" aria-hidden="true" />
        {label}
      </a>
    )
  }
  if (service.nextActionType === "email") {
    return (
      <a href={`mailto:${service.nextActionValue}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
        <Mail className="size-4" aria-hidden="true" />
        {label}
      </a>
    )
  }
  if (service.nextActionType === "link") {
    // Le serveur impose déjà un schéma http(s) à la création/modification ; revérifié ici pour
    // qu'une donnée malformée ne puisse jamais rendre un lien javascript: cliquable.
    if (!/^https?:\/\//i.test(service.nextActionValue)) return null
    return (
      <a
        href={service.nextActionValue}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        <ExternalLink className="size-4" aria-hidden="true" />
        {label}
      </a>
    )
  }
  // "visit" : pas de lien, juste l'instruction à suivre sur place
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
      <MapPin className="size-4" aria-hidden="true" />
      {label}
      {service.nextActionValue && <span className="text-muted-foreground">— {service.nextActionValue}</span>}
    </span>
  )
}

export function PartnerCatalog() {
  const { t } = useLanguage()
  const [services, setServices] = useState<PartnerService[] | null>(null)
  const [error, setError] = useState("")
  const [query, setQuery] = useState("")
  const [contacting, setContacting] = useState<PartnerService | null>(null)

  useEffect(() => {
    let mounted = true
    partnerServiceRepository
      .list()
      .then((data) => mounted && setServices(data))
      .catch((cause) => mounted && setError(cause instanceof Error ? cause.message : t("partnersCatalog.genericError")))
    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- t() n'a pas besoin de redéclencher le fetch
  }, [])

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term || !services) return services
    return services.filter((service) =>
      `${service.name} ${service.category ?? ""} ${service.description ?? ""}`.toLowerCase().includes(term)
    )
  }, [query, services])

  return (
    <>
      <section className="relative overflow-hidden rounded-2xl border border-border/80 bg-card/85 p-6 shadow-sm backdrop-blur-xl sm:p-7">
        <div className="mb-3 flex items-center justify-between border-b border-border/60 pb-2.5 text-[11px] font-mono tracking-wider text-muted-foreground">
          <span className="flex items-center gap-2 font-medium text-primary">
            <span className="size-2 rounded-full bg-cyan-400 animate-pulse" />
            RÉSEAU DES PARTENAIRES EXTÉRIEURS // TERRA NOVA
          </span>
          <span className="hidden sm:inline font-mono text-xs uppercase text-muted-foreground">
            OFFRES & SERVICES ASSOCIÉS
          </span>
        </div>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">{t("partnersCatalog.eyebrow")}</p>
            <h1 className="font-display mt-1 text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
              {t("partnersCatalog.title")}
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">{t("partnersCatalog.subtitle")}</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              type="search"
              aria-label={t("partnersCatalog.searchAriaLabel")}
              placeholder={t("partnersCatalog.searchPlaceholder")}
              className="pl-9"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
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
            <Skeleton key={index} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="rounded-2xl border border-border/80 bg-card/70 p-8 text-center text-sm text-muted-foreground">
          {query ? t("partnersCatalog.noResultsQuery") : t("partnersCatalog.noResults")}
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((service) => (
            <li
              key={service.id}
              className="flex h-full flex-col gap-3 rounded-xl border border-border/80 bg-card/75 p-5 shadow-sm backdrop-blur-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
                  <Building2 className="size-5" aria-hidden="true" />
                </span>
                <Badge variant={service.isAvailable ? "default" : "secondary"}>
                  {service.isAvailable ? t("partnersCatalog.available") : t("partnersCatalog.unavailable")}
                </Badge>
              </div>

              <div>
                <h2 className="text-base font-semibold">{service.name}</h2>
                {service.category && <p className="text-xs text-muted-foreground">{service.category}</p>}
              </div>

              {!service.isAvailable && service.availabilityNote && (
                <p className="text-sm text-muted-foreground">{service.availabilityNote}</p>
              )}

              {service.description && (
                <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">{service.description}</p>
              )}

              <div className="mt-auto space-y-1.5 border-t border-border/70 pt-3 text-sm text-muted-foreground">
                {service.address && (
                  <p className="flex items-start gap-1.5">
                    <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                    <span>{service.address}</span>
                  </p>
                )}
                {service.openingHours && (
                  <p className="flex items-start gap-1.5">
                    <Clock className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                    <span>{service.openingHours}</span>
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <NextAction service={service} />
                <Button size="sm" variant="outline" onClick={() => setContacting(service)}>
                  <MessageSquare aria-hidden="true" />
                  {t("partnersCatalog.contactButton")}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <PartnerContactDialog
        service={contacting}
        onClose={() => setContacting(null)}
        onSent={() => {
          setContacting(null)
          toast.add({
            title: t("partnersCatalog.contactSuccessTitle"),
            description: t("partnersCatalog.contactSuccessDescription"),
            type: "success",
          })
        }}
      />
    </>
  )
}
