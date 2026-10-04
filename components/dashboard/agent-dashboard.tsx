"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Activity,
  Bell,
  Building2,
  CheckCircle2,
  CircleAlert,
  CircleX,
  Clock3,
  Megaphone,
  ShieldCheck,
} from "lucide-react"

import { useAuth } from "@/components/auth/auth-provider"
import { useLanguage } from "@/components/i18n/language-provider"
import { AgentRequestsPanel } from "@/components/requests/agent-requests-panel"
import { isStaff, roleLabel } from "@/repository/auth.repository"
import {
  citizenRequestRepository,
  type RequestStatus,
  type RequestStatusCounts,
} from "@/repository/citizenRequest.repository"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { CitizenDashboard } from "@/components/dashboard/citizen-dashboard"
import { AdminDashboard } from "@/components/dashboard/admin-dashboard"
import { MostUsedServices } from "@/components/services/most-used-services"

const metrics: { key: string; status: RequestStatus; icon: typeof Clock3; tone: string }[] = [
  { key: "pending", status: "pending", icon: Clock3, tone: "text-amber-700 dark:text-amber-300" },
  { key: "inProgress", status: "in_progress", icon: Activity, tone: "text-sky-700 dark:text-sky-300" },
  { key: "accepted", status: "resolved", icon: CheckCircle2, tone: "text-emerald-700 dark:text-emerald-300" },
  { key: "rejected", status: "rejected", icon: CircleX, tone: "text-destructive" },
]

function getInitials(firstName: string | null, lastName: string | null, email: string) {
  const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.trim()
  return initials ? initials.toUpperCase() : email[0]?.toUpperCase() ?? "A"
}

export function AgentDashboard() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const { t } = useLanguage()

  useEffect(() => {
    if (!isLoading && !user) router.replace("/connexion")
  }, [isLoading, router, user])

  const [stats, setStats] = useState<RequestStatusCounts | null>(null)
  const loadStats = useCallback(() => {
    citizenRequestRepository.statsAll().then(setStats).catch(() => undefined)
  }, [])
  // La file est mesurée sur toutes les demandes des citoyens, pas seulement sur celles de cet
  // agent : c'est une donnée d'administration de la plateforme, donc conditionnée à la permission
  // qui l'ouvre côté API (agent.requests.view) et non au seul rôle « agent ». Un compte du
  // personnel qui n'a pas ce droit ne sollicite pas la file globale.
  const canReadGlobalQueue = user?.permissions.includes("agent.requests.view") ?? false
  useEffect(() => {
    if (user && isStaff(user) && canReadGlobalQueue && !user.roles.includes("admin")) loadStats()
  }, [user, canReadGlobalQueue, loadStats])

  if (isLoading || !user) {
    return (
      <main className="app-atmosphere grid min-h-screen place-items-center">
        <Spinner />
      </main>
    )
  }

  if (!isStaff(user)) {
    return <CitizenDashboard user={user} />
  }

  if (user.roles.includes("admin")) {
    return <AdminDashboard user={user} />
  }

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email
  const currentRoleLabel = t(`roles.${roleLabel(user)}`)

  return (
    <>
        <section className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-primary">{t("agentDashboard.eyebrow")}</p>
            <h1 className="mt-1 text-3xl font-medium tracking-tight sm:text-4xl">
              {t("agentDashboard.greeting", { name: user.firstName || "agent" })}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              {t("agentDashboard.subtitle")}
            </p>
          </div>
          <Badge variant="outline" className="w-fit gap-1.5 rounded-full px-3 py-1 text-muted-foreground">
            <ShieldCheck className="size-3.5 text-primary" aria-hidden="true" />
            {t("agentDashboard.secureSession")}
          </Badge>
        </section>

        <section aria-labelledby="metrics-title" className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 id="metrics-title" className="text-lg font-semibold">{t("agentDashboard.metricsTitle")}</h2>
              <p className="text-sm text-muted-foreground">{t("agentDashboard.metricsSubtitle")}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {metrics.map(({ key, status, icon: Icon, tone }) => (
              <div key={key} className="rounded-xl border border-border/80 bg-card/75 p-4 shadow-sm backdrop-blur-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm text-muted-foreground">{t(`agentDashboard.metrics.${key}`)}</p>
                  <Icon className={`size-4 shrink-0 ${tone}`} aria-hidden="true" />
                </div>
                <p className="mt-3 text-2xl font-semibold tabular-nums text-foreground">{stats ? stats[status] : "—"}</p>
              </div>
            ))}
          </div>
        </section>

        <MostUsedServices />

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section aria-labelledby="queues-title">
            <span id="queues-title" className="sr-only">{t("agentDashboard.queuesTitle")}</span>
            <AgentRequestsPanel onChanged={loadStats} />
          </section>

          <aside className="space-y-4">
            <section aria-labelledby="connected-profile-title" className="rounded-xl border border-border/80 bg-card/75 p-5 shadow-sm backdrop-blur-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 id="connected-profile-title" className="text-sm font-semibold">{t("agentDashboard.connectedProfile")}</h2>
                <Link href="/profil" className="text-xs font-medium text-primary underline-offset-4 hover:underline">
                  {t("agentDashboard.manageProfile")}
                </Link>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <Avatar className="size-12">
                  <AvatarFallback className="bg-accent text-base font-semibold text-accent-foreground">
                    {getInitials(user.firstName, user.lastName, user.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{fullName}</p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <Badge variant="secondary" className="mt-4">{currentRoleLabel}</Badge>
            </section>

            <section aria-labelledby="announcements-title" className="rounded-xl border border-border/80 bg-card/75 p-5 shadow-sm backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Megaphone className="size-4 text-primary" aria-hidden="true" />
                <h2 id="announcements-title" className="text-sm font-semibold">{t("agentDashboard.announcementsTitle")}</h2>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {t("agentDashboard.noAnnouncements")}
              </p>
            </section>

            <section aria-labelledby="reports-title" className="rounded-xl border border-border/80 bg-card/75 p-5 shadow-sm backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <CircleAlert className="size-4 text-amber-600 dark:text-amber-300" aria-hidden="true" />
                <h2 id="reports-title" className="text-sm font-semibold">{t("agentDashboard.reportsTitle")}</h2>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {t("agentDashboard.noReports")}
              </p>
            </section>

            <section aria-labelledby="information-title" className="rounded-xl border border-primary/20 bg-primary/5 p-5">
              <div className="flex items-center gap-2">
                <Bell className="size-4 text-primary" aria-hidden="true" />
                <h2 id="information-title" className="text-sm font-semibold">{t("agentDashboard.infoTitle")}</h2>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {t("agentDashboard.infoBody")}
              </p>
            </section>
          </aside>
        </div>

        <footer className="flex items-center gap-2 border-t border-border/70 pt-5 text-xs text-muted-foreground">
          <Building2 className="size-3.5" aria-hidden="true" />
          {t("agentDashboard.footerTagline")}
        </footer>
    </>
  )
}
