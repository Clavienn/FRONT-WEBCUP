"use client"

import {
  Activity,
  AlertTriangle,
  Bell,
  CheckCircle2,
  CircleAlert,
  CircleX,
  ClipboardList,
  Clock3,
  KeyRound,
  Megaphone,
  RadioTower,
  ShieldCheck,
  Users,
} from "lucide-react"

import type { AuthUser } from "@/repository/auth.repository"
import { useLanguage } from "@/components/i18n/language-provider"
import { AdminExportDialog } from "@/components/admin/admin-export-dialog"
import { Badge } from "@/components/ui/badge"

const adminMetrics = [
  { key: "requestsReceived", icon: ClipboardList },
  { key: "citizenAccounts", icon: Users },
  { key: "accessToVerify", icon: ShieldCheck },
  { key: "securityAlerts", icon: AlertTriangle },
]

const requestStatuses = [
  { key: "pending", icon: Clock3, tone: "text-amber-700 dark:text-amber-300" },
  { key: "inProgress", icon: Activity, tone: "text-sky-700 dark:text-sky-300" },
  { key: "accepted", icon: CheckCircle2, tone: "text-emerald-700 dark:text-emerald-300" },
  { key: "rejected", icon: CircleX, tone: "text-destructive" },
]

export function AdminDashboard({ user }: { user: AuthUser }) {
  const { t, tList } = useLanguage()
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email
  const governanceChecks = tList("adminDashboard.governanceChecks")

  return (
    <>
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">{t("adminDashboard.eyebrow")}</p>
          <h1 className="mt-1 text-3xl font-medium tracking-tight sm:text-4xl">
            {t("adminDashboard.title")}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {t("adminDashboard.subtitle")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <AdminExportDialog user={user} />
          <Badge variant="outline" className="w-fit gap-1.5 rounded-full px-3 py-1 text-muted-foreground">
            <ShieldCheck className="size-3.5 text-primary" aria-hidden="true" />
            {t("adminDashboard.accessBadge")}
          </Badge>
        </div>
      </section>

      <section aria-labelledby="admin-metrics-title" className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="admin-metrics-title" className="text-lg font-semibold">{t("adminDashboard.metricsTitle")}</h2>
            <p className="text-sm text-muted-foreground">{t("adminDashboard.metricsSubtitle")}</p>
          </div>
          <span className="text-xs text-muted-foreground">{t("adminDashboard.sourcesNotSynced")}</span>
        </div>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {adminMetrics.map(({ key, icon: Icon }) => (
            <div key={key} className="rounded-xl border border-border/80 bg-card/75 p-4 shadow-sm backdrop-blur-sm">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">{t(`adminDashboard.metrics.${key}.label`)}</p>
                <Icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
              </div>
              <p className="mt-3 text-2xl font-semibold tabular-nums">—</p>
              <p className="mt-1 text-xs text-muted-foreground">{t(`adminDashboard.metrics.${key}.source`)}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-8">
          <section aria-labelledby="admin-requests-title" className="space-y-4">
            <div>
              <h2 id="admin-requests-title" className="text-lg font-semibold">{t("adminDashboard.requestsTitle")}</h2>
              <p className="text-sm text-muted-foreground">{t("adminDashboard.requestsSubtitle")}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {requestStatuses.map(({ key, icon: Icon, tone }) => (
                <section key={key} className="rounded-xl border border-border/80 bg-card/70 p-4 shadow-sm backdrop-blur-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="grid size-9 place-items-center rounded-lg bg-muted">
                        <Icon className={`size-4 ${tone}`} aria-hidden="true" />
                      </span>
                      <h3 className="text-sm font-semibold">{t(`adminDashboard.requestStatuses.${key}`)}</h3>
                    </div>
                    <span className="text-xl font-semibold tabular-nums">—</span>
                  </div>
                  <p className="mt-3 border-t border-border/70 pt-3 text-xs text-muted-foreground">
                    {t("adminDashboard.noVolume")}
                  </p>
                </section>
              ))}
            </div>
          </section>

          <section aria-labelledby="access-admin-title" className="space-y-4 rounded-2xl border border-border/80 bg-card/65 p-5 shadow-sm backdrop-blur-sm sm:p-6">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <Users className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h2 id="access-admin-title" className="text-lg font-semibold">{t("adminDashboard.accessTitle")}</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {t("adminDashboard.accessSubtitle")}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-border/70 bg-background/55 p-4">
                <p className="text-xs font-medium text-muted-foreground">{t("adminDashboard.connectedAdmin")}</p>
                <p className="mt-2 truncate text-sm font-semibold">{fullName}</p>
                <p className="mt-1 text-xs text-muted-foreground">{user.email}</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/55 p-4">
                <p className="text-xs font-medium text-muted-foreground">{t("adminDashboard.assignedRoles")}</p>
                <p className="mt-2 text-sm font-semibold">{user.roles.join(", ")}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t("adminDashboard.fromSession")}</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/55 p-4">
                <p className="text-xs font-medium text-muted-foreground">{t("adminDashboard.effectivePermissions")}</p>
                <p className="mt-2 text-2xl font-semibold tabular-nums">{user.permissions.length}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t("adminDashboard.assignedToAccount")}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-border/70 bg-background/55 p-4">
              <KeyRound className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium">{t("adminDashboard.otherAccounts")}</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {t("adminDashboard.otherAccountsBody")}
                </p>
              </div>
            </div>
          </section>

          <section aria-labelledby="governance-checks-title" className="rounded-2xl border border-border/80 bg-card/65 p-5 shadow-sm backdrop-blur-sm sm:p-6">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
              <h2 id="governance-checks-title" className="text-base font-semibold">{t("adminDashboard.governanceTitle")}</h2>
            </div>
            <ul className="mt-4 divide-y divide-border/70">
              {governanceChecks.map((check, index) => (
                <li key={index} className="flex items-start gap-3 py-3 text-sm leading-6 text-muted-foreground first:pt-0 last:pb-0">
                  <CircleAlert className="mt-1 size-4 shrink-0 text-amber-600 dark:text-amber-300" aria-hidden="true" />
                  {check}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="space-y-4">
          <section aria-labelledby="api-admin-title" className="rounded-2xl border border-border/80 bg-card/70 p-5 shadow-sm backdrop-blur-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <RadioTower className="size-4 text-primary" aria-hidden="true" />
                <h2 id="api-admin-title" className="text-sm font-semibold">{t("adminDashboard.apiTitle")}</h2>
              </div>
              <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200">
                {t("adminDashboard.apiBadge")}
              </Badge>
            </div>
            <dl className="mt-4 divide-y divide-border/70">
              <div className="flex items-center justify-between gap-3 py-3 text-sm">
                <dt className="text-muted-foreground">{t("adminDashboard.lastExchange")}</dt>
                <dd className="font-medium">—</dd>
              </div>
              <div className="flex items-center justify-between gap-3 py-3 text-sm">
                <dt className="text-muted-foreground">{t("adminDashboard.teamKey")}</dt>
                <dd className="font-medium">{t("adminDashboard.teamKeyValue")}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 py-3 text-sm">
                <dt className="text-muted-foreground">{t("adminDashboard.nextWave")}</dt>
                <dd className="font-medium">{t("adminDashboard.nextWaveValue")}</dd>
              </div>
            </dl>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              {t("adminDashboard.apiFootnote")}
            </p>
          </section>

          <section aria-labelledby="admin-comms-title" className="rounded-xl border border-border/80 bg-card/75 p-5 shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <Megaphone className="size-4 text-primary" aria-hidden="true" />
              <h2 id="admin-comms-title" className="text-sm font-semibold">{t("adminDashboard.commsTitle")}</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {t("adminDashboard.commsBody")}
            </p>
            <Badge variant="outline" className="mt-3">{t("adminDashboard.noSyncBadge")}</Badge>
          </section>

          <section aria-labelledby="admin-alerts-title" className="rounded-xl border border-border/80 bg-card/75 p-5 shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <Bell className="size-4 text-primary" aria-hidden="true" />
              <h2 id="admin-alerts-title" className="text-sm font-semibold">{t("adminDashboard.alertsTitle")}</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {t("adminDashboard.alertsBody")}
            </p>
            <div className="mt-4 flex items-center gap-2 border-t border-border/70 pt-3 text-xs text-muted-foreground">
              <CircleAlert className="size-3.5 shrink-0" aria-hidden="true" />
              <span>{t("adminDashboard.noAlertsFeed")}</span>
            </div>
          </section>
        </aside>
      </div>
    </>
  )
}