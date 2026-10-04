"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { BadgeCheck, CircleAlert, ClipboardList, RefreshCw, Star } from "lucide-react"

import { useLanguage } from "@/components/i18n/language-provider"
import { NewRequestForm } from "@/components/requests/new-request-form"
import { ReviewDialog } from "@/components/services/review-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/toast"
import {
  citizenRequestRepository,
  requestStatusKey,
  type CitizenRequest,
  type CitizenRequestDetail,
  type RequestStatus,
} from "@/repository/citizenRequest.repository"
import { serviceRepository } from "@/repository/service.repository"

type LoadState = "loading" | "error" | "ready"

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" })

// La couleur du badge suit l'état de la demande, pas son rang dans la liste.
const STATUS_STYLES: Record<RequestStatus, string> = {
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200",
  in_progress: "border-sky-500/30 bg-sky-500/10 text-sky-800 dark:text-sky-200",
  resolved: "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
  rejected: "border-destructive/30 bg-destructive/10 text-destructive",
}

function useStatusLabel() {
  const { t } = useLanguage()
  return (status: RequestStatus) => t(`citizenRequests.status${requestStatusKey(status)}`)
}

function RequestTimeline({ requestId }: { requestId: number }) {
  const { t } = useLanguage()
  const [detail, setDetail] = useState<CitizenRequestDetail | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false
    citizenRequestRepository
      .getMine(requestId)
      .then((data) => !cancelled && setDetail(data))
      .catch(() => !cancelled && setError(t("citizenRequests.detailError")))
    return () => {
      cancelled = true
    }
  }, [requestId, t])

  if (error) {
    return (
      <p role="alert" className="mt-3 text-sm text-destructive">
        {error}
      </p>
    )
  }

  if (!detail) {
    return <Skeleton className="mt-3 h-16 w-full rounded-lg" />
  }

  if (detail.history.length === 0) {
    return <p className="mt-3 text-sm text-muted-foreground">{t("citizenRequests.historyEmpty")}</p>
  }

  return (
    <ol className="mt-4 space-y-3 border-l-2 border-border pl-4">
      {detail.history.map((entry, index) => (
        <li key={`${entry.changedAt}-${index}`} className="relative">
          <span
            className="absolute -left-[21px] top-1.5 size-2.5 rounded-full bg-primary"
            aria-hidden="true"
          />
          <p className="text-sm font-medium">
            {t(`citizenRequests.timeline${requestStatusKey(entry.newStatus)}`)}
          </p>
          {entry.note && (
            <p className="mt-1 text-sm leading-6 text-muted-foreground">{entry.note}</p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            {dateFormatter.format(new Date(entry.changedAt))}
            {entry.author && ` · ${t("citizenRequests.historyBy", { name: [entry.author.firstName, entry.author.lastName].filter(Boolean).join(" ") })}`}
          </p>
        </li>
      ))}
    </ol>
  )
}

/**
 * Le citizen dépose une demande et suit son évolution. L'historique n'est chargé
 * qu'au dépliage : la liste reste légère même avec plusieurs demandes.
 */
interface CitizenRequestsPanelProps {
  // Prévient le dashboard qu'il doit recalculer ses compteurs par statut
  onChanged?: () => void
  // Si défini, « Déposer une demande » et « Voir l'évolution » redirigent vers cette page au lieu de s'ouvrir ici
  requestsHref?: string
  // La page dédiée affiche déjà son propre titre et sous-titre : inutile de les répéter ici.
  // Le titre reste dans le DOM (lecteurs d'écran) mais n'est plus visible.
  hideHeader?: boolean
}

export function CitizenRequestsPanel({ onChanged, requestsHref, hideHeader }: CitizenRequestsPanelProps = {}) {
  const { t } = useLanguage()
  const statusLabel = useStatusLabel()
  const [state, setState] = useState<LoadState>("loading")
  const [requests, setRequests] = useState<CitizenRequest[]>([])
  const [total, setTotal] = useState(0)
  const [formOpen, setFormOpen] = useState(false)
  const [openId, setOpenId] = useState<number | null>(null)
  const [error, setError] = useState("")
  // Services déjà notés par le citoyen : un seul avis par service, le bouton disparaît ensuite
  const [reviewedServiceIds, setReviewedServiceIds] = useState<Set<number>>(new Set())
  const [reviewing, setReviewing] = useState<{ id: number; name: string } | null>(null)
  // Filtre par date de dépôt : uniquement sur la page dédiée (requestsHref absent), pas dans l'aperçu du tableau de bord
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  useEffect(() => {
    let cancelled = false
    serviceRepository
      .myReviews()
      .then((mine) => !cancelled && setReviewedServiceIds(new Set(mine.map((review) => review.serviceId))))
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [])

  // load ne remet pas l'etat a "loading" : l'etat initial l'est deja, et un setState
// synchrone dans le corps de l'effet declenche un rendu en cascade. Les rechargements
// declenches par l'utilisateur passent par refresh().
const load = useCallback(() => {
    citizenRequestRepository
      .listMine({ from: dateFrom || undefined, to: dateTo || undefined })
      .then((page) => {
        setRequests(page.requests)
        setTotal(page.total)
        setError("")
        setState("ready")
        onChanged?.()
      })
      .catch((cause) => {
        setError(cause instanceof Error ? cause.message : "")
        setState("error")
      })
  }, [onChanged, dateFrom, dateTo])

  const refresh = useCallback(() => {
    setState("loading")
    load()
  }, [load])

  // Un changement de filtre de date doit remettre l'état à "loading" (c'est un rechargement
  // déclenché par l'utilisateur), contrairement au montage initial qui l'est déjà.
  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh dépend de load, qui dépend déjà de dateFrom/dateTo
  }, [load])

  const handleCreated = () => {
    setFormOpen(false)
    setOpenId(null)
    refresh()
  }

  return (
    <section
      id="recent-requests-title"
      aria-labelledby="citizen-requests-title"
      className="rounded-2xl border border-border/80 bg-card/75 p-5 shadow-sm backdrop-blur-sm sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className={hideHeader ? "sr-only" : undefined}>
          <h2 id="citizen-requests-title" className="text-lg font-semibold">
            {t("citizenRequests.title")}
          </h2>
          <p className="mt-1 max-w-xl text-sm leading-6 text-muted-foreground">
            {t("citizenRequests.subtitle")}
          </p>
        </div>
        {requestsHref ? (
          <Button nativeButton={false} render={<Link href={requestsHref} />}>
            {t("citizenRequests.newLabel")}
          </Button>
        ) : (
          <Button
            variant={formOpen ? "outline" : "default"}
            onClick={() => setFormOpen((open) => !open)}
            aria-expanded={formOpen}
          >
            {formOpen ? t("citizenRequests.cancelLabel") : t("citizenRequests.newLabel")}
          </Button>
        )}
      </div>

      {formOpen && (
        <div className="mt-6 rounded-xl border border-border/70 bg-background/55 p-4">
          <NewRequestForm onCreated={handleCreated} />
        </div>
      )}

      {!requestsHref && (
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="requests-date-from" className="text-xs text-muted-foreground">
              {t("citizenRequests.dateFromLabel")}
            </Label>
            <Input
              id="requests-date-from"
              type="date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(event) => setDateFrom(event.target.value)}
              className="w-auto"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="requests-date-to" className="text-xs text-muted-foreground">
              {t("citizenRequests.dateToLabel")}
            </Label>
            <Input
              id="requests-date-to"
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(event) => setDateTo(event.target.value)}
              className="w-auto"
            />
          </div>
          {(dateFrom || dateTo) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDateFrom("")
                setDateTo("")
              }}
            >
              {t("citizenRequests.clearDateFilter")}
            </Button>
          )}
        </div>
      )}

      <div className="mt-6" aria-live="polite">
        {state === "loading" && (
          <div className="space-y-3" aria-hidden="true">
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        )}

        {state === "error" && (
          <div className="flex flex-col items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-3">
            <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
              <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {error || t("citizenRequests.errorLoad")}
            </p>
            <Button variant="outline" size="sm" onClick={refresh}>
              <RefreshCw aria-hidden="true" />
              {t("citizenRequests.retryLabel")}
            </Button>
          </div>
        )}

        {state === "ready" && requests.length === 0 && !formOpen && (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border/80 px-4 py-10 text-center">
            <ClipboardList className="size-6 text-muted-foreground/70" aria-hidden="true" />
            <p className="text-sm font-medium">
              {dateFrom || dateTo ? t("citizenRequests.noResultsRangeTitle") : t("citizenRequests.emptyTitle")}
            </p>
            <p className="max-w-md text-sm leading-6 text-muted-foreground">
              {dateFrom || dateTo
                ? t("citizenRequests.noResultsRangeDescription")
                : t("citizenRequests.emptyDescription")}
            </p>
          </div>
        )}

        {state === "ready" && requests.length > 0 && (
          <>
            <p className="text-xs text-muted-foreground">{t("citizenRequests.totalLabel", { count: total })}</p>
            <ul className="mt-3 space-y-3">
              {requests.map((request) => {
                const expanded = openId === request.id
                return (
                  <li key={request.id} className="rounded-xl border border-border/80 bg-background/55 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{request.subject}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {request.service?.name ?? t("citizenRequests.serviceNone")}
                          {" · "}
                          {t("citizenRequests.createdAtLabel", {
                            date: dateFormatter.format(new Date(request.createdAt)),
                          })}
                        </p>
                      </div>
                      <Badge variant="outline" className={STATUS_STYLES[request.status]}>
                        {statusLabel(request.status)}
                      </Badge>
                    </div>

                    {requestsHref ? (
                      <Button variant="ghost" size="sm" className="mt-2" nativeButton={false} render={<Link href={requestsHref} />}>
                        {t("citizenRequests.detailLabel")}
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2"
                        aria-expanded={expanded}
                        onClick={() => setOpenId(expanded ? null : request.id)}
                      >
                        {expanded ? t("citizenRequests.hideDetailLabel") : t("citizenRequests.detailLabel")}
                      </Button>
                    )}

                    {request.status === "resolved" && request.service && (
                      reviewedServiceIds.has(request.service.id) ? (
                        <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                          <BadgeCheck className="size-4" aria-hidden="true" />
                          {t("serviceReviews.reviewedShort")}
                        </p>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2 ml-2"
                          onClick={() => setReviewing({ id: request.service!.id, name: request.service!.name })}
                        >
                          <Star aria-hidden="true" />
                          {t("serviceReviews.rateButton")}
                        </Button>
                      )
                    )}

                    {expanded && <RequestTimeline requestId={request.id} />}
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>
      <ReviewDialog
        service={reviewing}
        onClose={() => setReviewing(null)}
        onSubmitted={(review) => {
          setReviewedServiceIds((current) => new Set(current).add(review.serviceId))
          setReviewing(null)
          toast.add({ title: t("serviceReviews.success"), type: "success" })
        }}
      />
    </section>
  )
}