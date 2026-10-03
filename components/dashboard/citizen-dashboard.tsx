"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Bell, Building2, CheckCircle2, CircleAlert, CircleX, ClipboardList, Clock3, FilePlus2, MapPinned, Megaphone,} from "lucide-react"

import type { AuthUser } from "@/repository/auth.repository"
import { useLanguage } from "@/components/i18n/language-provider"
import { CitizenRequestsPanel } from "@/components/requests/citizen-requests-panel"
import {
  citizenRequestRepository,
  type RequestStatus,
  type RequestStatusCounts,
} from "@/repository/citizenRequest.repository"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

const requestStates: { key: string; status: RequestStatus; icon: typeof Clock3; tone: string }[] = [
  { key: "toProcess", status: "pending", icon: Clock3, tone: "text-amber-700 dark:text-amber-300" },
  { key: "inProgress", status: "in_progress", icon: ClipboardList, tone: "text-sky-700 dark:text-sky-300" },
  { key: "accepted", status: "resolved", icon: CheckCircle2, tone: "text-emerald-700 dark:text-emerald-300" },
  { key: "refused", status: "rejected", icon: CircleX, tone: "text-destructive" },
]

const citizenServices = [
  { key: "demandes", icon: FilePlus2 },
  { key: "signaler", icon: MapPinned },
  { key: "communiques", icon: Megaphone },
]

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

  return (
    <>
        <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-primary">{t("citizenDashboard.eyebrow")}</p>
            <h1 className="mt-1 text-3xl font-medium tracking-tight sm:text-4xl">
              {t("citizenDashboard.greeting", { name: user.firstName ? `, ${user.firstName}` : "" })}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              {t("citizenDashboard.subtitle")}
            </p>
          </div>
          <Badge variant="outline" className="w-fit gap-1.5 rounded-full px-3 py-1 text-muted-foreground">
            <Building2 className="size-3.5 text-primary" aria-hidden="true" />
            {t("citizenDashboard.badge")}
          </Badge>
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
            <CitizenRequestsPanel onChanged={loadStats} />

            <section aria-labelledby="services-title" className="space-y-4">
              <div>
                <h2 id="services-title" className="text-lg font-semibold">{t("citizenDashboard.servicesTitle")}</h2>
                <p className="text-sm text-muted-foreground">{t("citizenDashboard.servicesSubtitle")}</p>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {citizenServices.map(({ key, icon: Icon }) => (
                  <article key={key} className="rounded-xl border border-border/80 bg-card/70 p-4 shadow-sm backdrop-blur-sm">
                    <span className="grid size-9 place-items-center rounded-lg bg-accent text-accent-foreground">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <h3 className="mt-4 text-sm font-semibold">{t(`citizenDashboard.services.${key}.title`)}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{t(`citizenDashboard.services.${key}.description`)}</p>
                  </article>
                ))}
              </div>
            </section>
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
