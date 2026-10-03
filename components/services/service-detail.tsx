"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, ArrowRight, CalendarClock, CircleAlert, Hash } from "lucide-react"

import { ServiceIcon } from "@/components/services/service-icon"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { AuthApiError } from "@/repository/auth.repository"
import { serviceRepository, type MunicipalService } from "@/repository/service.repository"

const BACK_LINK = (
  <Link
    href="/dashboard/services"
    className="inline-flex items-center gap-2 text-sm font-medium text-secondary-foreground transition-colors hover:text-primary"
  >
    <ArrowLeft className="size-4" aria-hidden="true" />
    Tous les services
  </Link>
)

const formatDate = (value: string) => new Date(value).toLocaleDateString("fr-FR", { dateStyle: "long" })

export function ServiceDetail() {
  const params = useSearchParams()
  const id = Number(params.get("id"))
  const isValidId = Number.isInteger(id) && id > 0

  const [service, setService] = useState<MunicipalService | null>(null)
  const [others, setOthers] = useState<MunicipalService[]>([])
  const [error, setError] = useState("")
  // Id dont la réponse (succès ou erreur) a été reçue : évite d'afficher l'ancien service pendant un changement d'id
  const [loadedId, setLoadedId] = useState<number | null>(null)

  useEffect(() => {
    if (!isValidId) return
    let mounted = true

    Promise.all([serviceRepository.get(id), serviceRepository.list()])
      .then(([current, all]) => {
        if (!mounted) return
        setService(current)
        setOthers(all.filter((item) => item.id !== current.id).slice(0, 3))
        setError("")
        setLoadedId(id)
      })
      .catch((cause) => {
        if (!mounted) return
        setError(
          cause instanceof AuthApiError && cause.status === 404
            ? "Ce service est introuvable ou n’est plus disponible."
            : cause instanceof Error
              ? cause.message
              : "Chargement impossible"
        )
        setLoadedId(id)
      })

    return () => {
      mounted = false
    }
  }, [id, isValidId])

  if (!isValidId || (loadedId === id && error)) {
    return (
      <div className="space-y-6">
        {BACK_LINK}
        <p role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {isValidId ? error : "Identifiant de service invalide."}
        </p>
      </div>
    )
  }

  if (!service || loadedId !== id) {
    return (
      <div className="space-y-6">
        {BACK_LINK}
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {BACK_LINK}

      <header className="flex flex-col gap-5 rounded-2xl border border-border/80 bg-card/75 p-6 shadow-sm backdrop-blur-sm sm:flex-row sm:items-start sm:p-8">
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-accent text-accent-foreground">
          <ServiceIcon name={service.icon} className="size-7" />
        </span>
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-primary">Service municipal</p>
            {!service.isActive && <Badge variant="outline">Désactivé</Badge>}
          </div>
          <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">{service.name}</h1>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section aria-labelledby="service-about" className="rounded-2xl border border-border/80 bg-card/70 p-6 shadow-sm backdrop-blur-sm">
          <h2 id="service-about" className="text-lg font-semibold">Pour quels besoins ?</h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted-foreground">
            {service.description || "Aucune description n’est disponible pour ce service."}
          </p>
        </section>

        <aside aria-labelledby="service-infos" className="space-y-3 rounded-2xl border border-border/80 bg-card/70 p-6 shadow-sm backdrop-blur-sm">
          <h2 id="service-infos" className="text-sm font-semibold">Informations pratiques</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <Hash className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <div>
                <dt className="text-xs text-muted-foreground">Référence</dt>
                <dd className="font-mono">{service.code}</dd>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CalendarClock className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <div>
                <dt className="text-xs text-muted-foreground">Dernière mise à jour</dt>
                <dd>{formatDate(service.updatedAt)}</dd>
              </div>
            </div>
          </dl>
        </aside>
      </div>

      {others.length > 0 && (
        <section aria-labelledby="other-services" className="space-y-3">
          <h2 id="other-services" className="text-lg font-semibold">Ce n’est pas ce que vous cherchez ?</h2>
          <ul className="grid gap-3 md:grid-cols-3">
            {others.map((other) => (
              <li key={other.id}>
                <Link
                  href={`/dashboard/services/detail?id=${other.id}`}
                  className="group flex h-full cursor-pointer items-center gap-3 rounded-xl border border-border/80 bg-card/70 p-4 transition-colors hover:border-primary/50"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
                    <ServiceIcon name={other.icon} className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{other.name}</span>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
