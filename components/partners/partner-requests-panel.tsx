"use client"

import { useCallback, useEffect, useState } from "react"
import { CircleAlert } from "lucide-react"

import { useLanguage } from "@/components/i18n/language-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/toast"
import {
  partnerRequestRepository,
  type PartnerRequestStatus,
  type PartnerServiceRequest,
} from "@/repository/partnerService.repository"

const STATUS_VARIANT: Record<PartnerRequestStatus, "default" | "secondary" | "outline"> = {
  pending: "default",
  contacted: "secondary",
  closed: "outline",
}

const STATUS_KEY: Record<PartnerRequestStatus, string> = {
  pending: "partnerRequestsDashboard.statusPending",
  contacted: "partnerRequestsDashboard.statusContacted",
  closed: "partnerRequestsDashboard.statusClosed",
}

const NEXT_STATUS: Record<PartnerRequestStatus, PartnerRequestStatus | null> = {
  pending: "contacted",
  contacted: "closed",
  closed: null,
}

export function PartnerRequestsPanel() {
  const { t, locale } = useLanguage()
  const [requests, setRequests] = useState<PartnerServiceRequest[] | null>(null)
  const [loadError, setLoadError] = useState("")
  const [busyId, setBusyId] = useState<number | null>(null)

  const load = useCallback(async () => {
    try {
      setRequests(await partnerRequestRepository.list())
      setLoadError("")
    } catch (cause) {
      setLoadError(cause instanceof Error ? cause.message : t("partnerRequestsDashboard.genericError"))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- t() n'a pas besoin de redéclencher le chargement
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const formatDate = (value: string) =>
    new Date(value).toLocaleString(locale === "fr" ? "fr-FR" : "en-US", { dateStyle: "medium", timeStyle: "short" })

  const advance = async (request: PartnerServiceRequest) => {
    const next = NEXT_STATUS[request.status]
    if (!next) return
    setBusyId(request.id)
    try {
      const saved = await partnerRequestRepository.setStatus(request.id, next)
      setRequests((current) => current?.map((item) => (item.id === saved.id ? saved : item)) ?? null)
    } catch (cause) {
      toast.add({ title: "Erreur", description: cause instanceof Error ? cause.message : t("partnerRequestsDashboard.genericError"), type: "error" })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <section>
        <p className="text-sm font-medium text-primary">{t("partnerRequestsDashboard.eyebrow")}</p>
        <h1 className="mt-1 text-3xl font-medium tracking-tight sm:text-4xl">{t("partnerRequestsDashboard.title")}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{t("partnerRequestsDashboard.subtitle")}</p>
      </section>

      {loadError ? (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
          <span className="flex items-start gap-2">
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {loadError}
          </span>
          <Button variant="outline" size="sm" onClick={load}>{t("partnerRequestsDashboard.retry")}</Button>
        </div>
      ) : !requests ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : requests.length === 0 ? (
        <p className="rounded-2xl border border-border/80 bg-card/70 p-8 text-center text-sm text-muted-foreground">
          {t("partnerRequestsDashboard.emptyState")}
        </p>
      ) : (
        <ul className="space-y-3">
          {requests.map((request) => {
            const next = NEXT_STATUS[request.status]
            return (
              <li key={request.id} className="rounded-xl border border-border/80 bg-card/75 p-4 shadow-sm backdrop-blur-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {request.service?.name ?? t("partnerRequestsDashboard.fallbackService")}
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        {request.user ? `${request.user.firstName} ${request.user.lastName}`.trim() : t("partnerRequestsDashboard.fallbackUser")}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(request.createdAt)}</p>
                    {request.message && <p className="mt-2 text-sm leading-6">{request.message}</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant={STATUS_VARIANT[request.status]}>{t(STATUS_KEY[request.status])}</Badge>
                    {next && (
                      <Button size="sm" variant="outline" disabled={busyId === request.id} onClick={() => advance(request)}>
                        {t("partnerRequestsDashboard.advanceButton", { status: t(STATUS_KEY[next]) })}
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
