"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Building2, CircleCheck, ClipboardList, Handshake, ShieldCheck } from "lucide-react"

import type { AuthUser } from "@/repository/auth.repository"
import { useLanguage } from "@/components/i18n/language-provider"
import { partnerRequestRepository, partnerServiceRepository, type PartnerServiceRequest } from "@/repository/partnerService.repository"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

function getInitials(user: AuthUser) {
  const initials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.trim()
  return initials.toUpperCase() || user.email[0]?.toUpperCase() || "P"
}

export function PartnerDashboard({ user }: { user: AuthUser }) {
  const { t } = useLanguage()
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email

  const [offersCount, setOffersCount] = useState<number | null>(null)
  const [publishedCount, setPublishedCount] = useState<number | null>(null)
  const [requests, setRequests] = useState<PartnerServiceRequest[] | null>(null)

  useEffect(() => {
    let mounted = true
    partnerServiceRepository
      .mine()
      .then((services) => {
        if (!mounted) return
        setOffersCount(services.length)
        setPublishedCount(services.filter((service) => service.isActive).length)
      })
      .catch(() => mounted && (setOffersCount(0), setPublishedCount(0)))
    partnerRequestRepository
      .list()
      .then((data) => mounted && setRequests(data))
      .catch(() => mounted && setRequests([]))
    return () => {
      mounted = false
    }
  }, [])

  const pendingCount = requests?.filter((request) => request.status === "pending").length ?? null
  const recentRequests = requests?.slice(0, 5) ?? null

  return (
    <>
      <section className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">{t("partnerHome.eyebrow")}</p>
          <h1 className="mt-1 text-3xl font-medium tracking-tight sm:text-4xl">
            {t("partnerHome.greeting", { name: user.firstName || t("partnerHome.fallbackName") })}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{t("partnerHome.subtitle")}</p>
        </div>
        <Badge variant="outline" className="w-fit gap-1.5 rounded-full px-3 py-1 text-muted-foreground">
          <ShieldCheck className="size-3.5 text-primary" aria-hidden="true" />
          {t("partnerHome.secureSession")}
        </Badge>
      </section>

      <section aria-labelledby="partner-metrics-title" className="space-y-3">
        <h2 id="partner-metrics-title" className="text-lg font-semibold">{t("partnerHome.metricsTitle")}</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Link
            href="/dashboard/partner/services"
            className="rounded-xl border border-border/80 bg-card/75 p-4 shadow-sm backdrop-blur-sm transition-colors hover:border-primary/50"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">{t("partnerHome.metricOffers")}</p>
              <Handshake className="size-4 shrink-0 text-primary" aria-hidden="true" />
            </div>
            <p className="mt-3 text-2xl font-semibold tabular-nums text-foreground">{offersCount ?? "—"}</p>
          </Link>
          <Link
            href="/dashboard/partner/services"
            className="rounded-xl border border-border/80 bg-card/75 p-4 shadow-sm backdrop-blur-sm transition-colors hover:border-primary/50"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">{t("partnerHome.metricPublished")}</p>
              <CircleCheck className="size-4 shrink-0 text-emerald-700 dark:text-emerald-300" aria-hidden="true" />
            </div>
            <p className="mt-3 text-2xl font-semibold tabular-nums text-foreground">{publishedCount ?? "—"}</p>
          </Link>
          <Link
            href="/dashboard/partner/requests"
            className="rounded-xl border border-border/80 bg-card/75 p-4 shadow-sm backdrop-blur-sm transition-colors hover:border-primary/50"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">{t("partnerHome.metricPending")}</p>
              <ClipboardList className="size-4 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden="true" />
            </div>
            <p className="mt-3 text-2xl font-semibold tabular-nums text-foreground">{pendingCount ?? "—"}</p>
          </Link>
        </div>
      </section>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section aria-labelledby="partner-requests-title">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <h2 id="partner-requests-title" className="text-lg font-semibold">{t("partnerHome.recentRequestsTitle")}</h2>
            <Link href="/dashboard/partner/requests" className="text-xs font-medium text-primary underline-offset-4 hover:underline">
              {t("partnerHome.seeAll")}
            </Link>
          </div>
          {!recentRequests ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }, (_, index) => (
                <Skeleton key={index} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : recentRequests.length === 0 ? (
            <p className="rounded-2xl border border-border/80 bg-card/70 p-8 text-center text-sm text-muted-foreground">
              {t("partnerHome.noRequests")}
            </p>
          ) : (
            <ul className="space-y-3">
              {recentRequests.map((request) => (
                <li key={request.id} className="rounded-xl border border-border/80 bg-card/75 p-4 shadow-sm backdrop-blur-sm">
                  <p className="truncate font-medium">
                    {request.service?.name ?? t("partnerHome.fallbackService")}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      {request.user ? `${request.user.firstName} ${request.user.lastName}`.trim() : t("partnerHome.fallbackUser")}
                    </span>
                  </p>
                  {request.message && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{request.message}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="space-y-4">
          <section aria-labelledby="partner-profile-title" className="rounded-xl border border-border/80 bg-card/75 p-5 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 id="partner-profile-title" className="text-sm font-semibold">{t("partnerHome.connectedProfile")}</h2>
              <Link href="/profil" className="text-xs font-medium text-primary underline-offset-4 hover:underline">
                {t("partnerHome.manageProfile")}
              </Link>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <Avatar className="size-12">
                <AvatarFallback className="bg-accent text-base font-semibold text-accent-foreground">{getInitials(user)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{fullName}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <Badge variant="secondary" className="mt-4">{t("roles.partner")}</Badge>
          </section>

          <section aria-labelledby="partner-info-title" className="rounded-xl border border-primary/20 bg-primary/5 p-5">
            <div className="flex items-center gap-2">
              <Building2 className="size-4 text-primary" aria-hidden="true" />
              <h2 id="partner-info-title" className="text-sm font-semibold">{t("partnerHome.infoTitle")}</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{t("partnerHome.infoBody")}</p>
          </section>
        </aside>
      </div>
    </>
  )
}
