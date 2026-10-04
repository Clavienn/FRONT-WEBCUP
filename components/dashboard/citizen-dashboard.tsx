"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Bell, Building2, CheckCircle2, CircleAlert, CircleX, ClipboardList, Clock3, Megaphone } from "lucide-react"

import type { AuthUser } from "@/repository/auth.repository"
import { useLanguage } from "@/components/i18n/language-provider"
import { CitizenRequestsPanel } from "@/components/requests/citizen-requests-panel"
import { IdeaBox } from "@/components/ideas/idea-box"
import {
  citizenRequestRepository,
  type RequestStatus,
  type RequestStatusCounts,
} from "@/repository/citizenRequest.repository"
import { serviceRepository, type MunicipalService } from "@/repository/service.repository"
import { ServiceIcon } from "@/components/services/service-icon"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

const requestStates: { key: string; status: RequestStatus; icon: typeof Clock3; tone: string }[] = [
  { key: "toProcess", status: "pending", icon: Clock3, tone: "text-amber-700 dark:text-amber-300" },
  { key: "inProgress", status: "in_progress", icon: ClipboardList, tone: "text-sky-700 dark:text-sky-300" },
  { key: "accepted", status: "resolved", icon: CheckCircle2, tone: "text-emerald-700 dark:text-emerald-300" },
  { key: "refused", status: "rejected", icon: CircleX, tone: "text-destructive" },
]

// Un habitant doit voir d'emblée ce qu'il peut faire ici : les services réels passent
// donc avant ses propres démarches, limités aux 3 premiers pour garder la page lisible.
const SERVICES_SHOWN = 3

function getInitials(user: AuthUser) {
  const initials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.trim()
  return initials.toUpperCase() || user.email[0]?.toUpperCase() || "C"
}

export function CitizenDashboard({ user }: { user: AuthUser }) {
  const { t } = useLanguage()
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email

  const [stats, setStats] = useState<RequestStatusCounts | null>(null)
  const loadStats = useCallback(() => {
    citizenRequestRepository.statsMine().then(setStats).catch(() => undefined)
  }, [])
  useEffect(() => {
    loadStats()
  }, [loadStats])

  const [services, setServices] = useState<MunicipalService[] | null>(null)
  const [servicesError, setServicesError] = useState("")
  useEffect(() => {
    let mounted = true
    serviceRepository
      .list()
      .then((data) => mounted && setServices(data))
      .catch(() => mounted && setServicesError(t("citizenDashboard.servicesError")))
    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement unique au montage
  }, [])

  return (
    <>
        {/* La participation de l'habitant passe avant tout le reste : c'est le premier levier de l'accueil */}
        {user.permissions.includes("citizen.ideas.create") && <IdeaBox />}

        <section aria-labelledby="services-title" className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 id="services-title" className="text-lg font-semibold">{t("citizenDashboard.servicesTitle")}</h2>
              <p className="text-sm text-muted-foreground">{t("citizenDashboard.servicesSubtitle")}</p>
            </div>
            <Link href="/dashboard/services" className="text-xs font-medium text-primary underline-offset-4 hover:underline">
              {t("citizenDashboard.servicesSeeAll")}
            </Link>
          </div>

          {servicesError ? (
            <p role="alert" className="text-sm text-destructive">{servicesError}</p>
          ) : !services ? (
            <div className="grid gap-3 md:grid-cols-3">
              {Array.from({ length: SERVICES_SHOWN }, (_, index) => (
                <Skeleton key={index} className="h-32 rounded-xl" />
              ))}
            </div>
          ) : services.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("citizenDashboard.servicesEmpty")}</p>
          ) : (
            <div className="grid gap-3 md:grid-cols-3">
              {services.slice(0, SERVICES_SHOWN).map((service) => (
                <Link
                  key={service.id}
                  href={`/dashboard/services/detail?id=${service.id}`}
                  className="group block h-full rounded-xl border border-border/80 bg-card/70 p-4 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
                >
                  <span className="grid size-9 place-items-center rounded-lg bg-accent text-accent-foreground">
                    <ServiceIcon name={service.icon} className="size-4" />
                  </span>
                  <h3 className="mt-4 text-sm font-semibold">{service.name}</h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
                    {service.description || t("citizenDashboard.servicesNoDescription")}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section aria-labelledby="citizen-requests-title" className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 id="citizen-requests-title" className="text-lg font-semibold">{t("citizenDashboard.requestsTitle")}</h2>
              <p className="text-sm text-muted-foreground">{t("citizenDashboard.requestsSubtitle")}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {requestStates.map(({ key, status, icon: Icon, tone }) => (
              <div key={key} className="rounded-xl border border-border/80 bg-card/75 p-4 shadow-sm backdrop-blur-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm text-muted-foreground">{t(`citizenDashboard.requestStates.${key}`)}</p>
                  <Icon className={`size-4 shrink-0 ${tone}`} aria-hidden="true" />
                </div>
                <p className="mt-3 text-2xl font-semibold tabular-nums">{stats ? stats[status] : "—"}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-8">
            <CitizenRequestsPanel onChanged={loadStats} requestsHref="/dashboard/my-requests" />
          </div>

          <aside className="space-y-4">
            <section aria-labelledby="citizen-profile-title" className="rounded-xl border border-border/80 bg-card/75 p-5 shadow-sm backdrop-blur-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 id="citizen-profile-title" className="text-sm font-semibold">{t("citizenDashboard.profileTitle")}</h2>
                <Link href="/profil" className="text-xs font-medium text-primary underline-offset-4 hover:underline">
                  {t("citizenDashboard.manageLink")}
                </Link>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <Avatar className="size-12">
                  <AvatarFallback className="bg-accent text-base font-semibold text-accent-foreground">
                    {getInitials(user)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{fullName}</p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <Badge variant="secondary" className="mt-4">{t("citizenDashboard.roleBadge")}</Badge>
            </section>

            <section aria-labelledby="city-updates-title" className="rounded-xl border border-border/80 bg-card/75 p-5 shadow-sm backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Megaphone className="size-4 text-primary" aria-hidden="true" />
                <h2 id="city-updates-title" className="text-sm font-semibold">{t("citizenDashboard.cityUpdatesTitle")}</h2>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {t("citizenDashboard.noAnnouncements")}
              </p>
            </section>

            <section aria-labelledby="citizen-notice-title" className="rounded-xl border border-primary/20 bg-primary/5 p-5">
              <div className="flex items-center gap-2">
                <Bell className="size-4 text-primary" aria-hidden="true" />
                <h2 id="citizen-notice-title" className="text-sm font-semibold">{t("citizenDashboard.noticeTitle")}</h2>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {t("citizenDashboard.noticeBody")}
              </p>
              <div className="mt-4 flex items-center gap-2 border-t border-primary/10 pt-3 text-xs text-muted-foreground">
                <CircleAlert className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
                {t("citizenDashboard.consultRegularly")}
              </div>
            </section>
          </aside>
        </div>

        <footer className="flex items-center gap-2 border-t border-border/70 pt-5 text-xs text-muted-foreground">
          <Building2 className="size-3.5" aria-hidden="true" />
          {t("citizenDashboard.footerTagline")}
        </footer>
    </>
  )
}
