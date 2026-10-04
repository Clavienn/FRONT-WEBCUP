"use client"

import { useCallback, useEffect, useState } from "react"
import { CircleAlert, RefreshCw, ShieldAlert, ShieldCheck } from "lucide-react"

import { useLanguage } from "@/components/i18n/language-provider"
import { Button } from "@/components/ui/button"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { actionLabel } from "@/lib/audit-actions"
import { securityRepository, type BotStats } from "@/repository/security.repository"

const REFRESH_MS = 30_000
const HOURS = [1, 6, 24, 72]
// À partir de ce nombre d'échecs de connexion dans la fenêtre, la situation est présentée comme une alerte
const LOGIN_ALERT_THRESHOLD = 10

function formatDate(value: string, locale: string) {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return "—"
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "fr-FR", { dateStyle: "short", timeStyle: "medium" }).format(date)
}

function Counter({ label, value, alert }: { label: string; value: number; alert?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${alert && value > 0 ? "border-red-600/50 bg-red-600/10" : "border-border/80 bg-card/70"}`}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
    </div>
  )
}

/**
 * Tableau de bord de la protection de la plateforme pour l'administration : tentatives de connexion inhabituelles
 * (bourrage d'identifiants sur plusieurs comptes), adresses bloquées, formulaires visés. Actualisé toutes les 30 s.
 */
export function SecurityAdmin() {
  const { t, locale } = useLanguage()
  const [hours, setHours] = useState(24)
  const [stats, setStats] = useState<BotStats | null>(null)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    try {
      setStats(await securityRepository.bots(hours))
      setError("")
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("securityAdmin.loadError"))
    }
  }, [hours, t])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- chargement initial depuis l'API
    void load()
    const timer = window.setInterval(() => void load(), REFRESH_MS)
    return () => window.clearInterval(timer)
  }, [load])

  const loginFailures = stats?.byReason.login_failures ?? 0
  const underAttack = !!stats && (stats.blocks > 0 || loginFailures >= LOGIN_ALERT_THRESHOLD)

  return (
    <>
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">{t("securityAdmin.eyebrow")}</p>
          <h1 className="mt-1 text-3xl font-medium tracking-tight sm:text-4xl">{t("securityAdmin.title")}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{t("securityAdmin.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <NativeSelect aria-label={t("securityAdmin.window")} value={hours} onChange={(event) => setHours(Number(event.target.value))}>
            {HOURS.map((value) => (
              <NativeSelectOption key={value} value={value}>{t("securityAdmin.lastHours", { count: value })}</NativeSelectOption>
            ))}
          </NativeSelect>
          <Button variant="outline" size="icon" onClick={() => void load()} aria-label={t("securityAdmin.refresh")}>
            <RefreshCw aria-hidden="true" />
          </Button>
        </div>
      </section>

      {error ? (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
          <span className="flex items-start gap-2">
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {error}
          </span>
          <Button variant="outline" size="sm" onClick={() => void load()}>{t("securityAdmin.retry")}</Button>
        </div>
      ) : !stats ? (
        <Skeleton className="h-72 rounded-2xl" />
      ) : (
        <>
          {underAttack ? (
            <div role="alert" className="flex items-start gap-3 rounded-xl border-2 border-red-600/70 bg-red-600/10 px-4 py-3">
              <ShieldAlert className="mt-0.5 size-5 shrink-0 text-red-600" aria-hidden="true" />
              <div>
                <p className="font-semibold text-red-900 dark:text-red-100">{t("securityAdmin.attackTitle")}</p>
                <p className="mt-1 text-sm">
                  {t("securityAdmin.attackBody", { failures: loginFailures, blocks: stats.blocks, hours: stats.hours })}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{t("securityAdmin.attackAdvice")}</p>
              </div>
            </div>
          ) : (
            <div role="status" className="flex items-center gap-3 rounded-xl border-2 border-emerald-600/50 bg-emerald-500/10 px-4 py-3">
              <ShieldCheck className="size-5 shrink-0 text-emerald-600" aria-hidden="true" />
              <p className="text-sm font-medium">{t("securityAdmin.calm", { hours: stats.hours })}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Counter label={t("securityAdmin.counters.loginFailures")} value={loginFailures} alert />
            <Counter label={t("securityAdmin.counters.blocks")} value={stats.blocks} alert />
            <Counter label={t("securityAdmin.counters.signals")} value={stats.totalSignals} />
            <Counter label={t("securityAdmin.counters.blockedNow")} value={stats.live?.blockedIpsNow ?? 0} alert />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section aria-labelledby="sec-reasons" className="space-y-2">
              <h2 id="sec-reasons" className="text-sm font-semibold">{t("securityAdmin.byReason")}</h2>
              {Object.keys(stats.byReason).length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("securityAdmin.none")}</p>
              ) : (
                <ul className="divide-y divide-border/70 rounded-xl border border-border/70 bg-card/70">
                  {Object.entries(stats.byReason)
                    .sort((a, b) => b[1] - a[1])
                    .map(([reason, count]) => (
                      <li key={reason} className="flex items-center justify-between gap-2 px-4 py-2.5 text-sm">
                        <span>{actionLabel(`bot.${reason}`, t)}</span>
                        <span className="tabular-nums font-semibold">{count}</span>
                      </li>
                    ))}
                </ul>
              )}
            </section>

            <section aria-labelledby="sec-forms" className="space-y-2">
              <h2 id="sec-forms" className="text-sm font-semibold">{t("securityAdmin.byForm")}</h2>
              {Object.keys(stats.byForm).length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("securityAdmin.none")}</p>
              ) : (
                <ul className="divide-y divide-border/70 rounded-xl border border-border/70 bg-card/70">
                  {Object.entries(stats.byForm)
                    .sort((a, b) => b[1] - a[1])
                    .map(([form, count]) => (
                      <li key={form} className="flex items-center justify-between gap-2 px-4 py-2.5 text-sm">
                        <span className="font-mono text-xs">{form}</span>
                        <span className="tabular-nums font-semibold">{count}</span>
                      </li>
                    ))}
                </ul>
              )}
            </section>
          </div>

          <section aria-labelledby="sec-ips" className="space-y-2">
            <h2 id="sec-ips" className="text-sm font-semibold">{t("securityAdmin.topIps")}</h2>
            <div className="overflow-hidden rounded-2xl border border-border/80 bg-card/70">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("securityAdmin.ip")}</TableHead>
                    <TableHead className="text-right">{t("securityAdmin.signals")}</TableHead>
                    <TableHead>{t("securityAdmin.lastSignal")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.topIps.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">{t("securityAdmin.none")}</TableCell>
                    </TableRow>
                  )}
                  {stats.topIps.map((item) => (
                    <TableRow key={item.ip}>
                      <TableCell className="font-mono text-xs">{item.ip}</TableCell>
                      <TableCell className="text-right tabular-nums">{item.signals}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(item.lastAt, locale)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>

          <section aria-labelledby="sec-recent" className="space-y-2">
            <h2 id="sec-recent" className="text-sm font-semibold">{t("securityAdmin.recent")}</h2>
            {stats.recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("securityAdmin.none")}</p>
            ) : (
              <ul className="divide-y divide-border/70 rounded-xl border border-border/70 bg-card/70">
                {stats.recent.map((event, index) => (
                  <li key={`${event.at}-${index}`} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm">
                    <span className={event.action === "bot.blocked" ? "font-semibold text-red-700 dark:text-red-300" : undefined}>
                      {actionLabel(event.action, t)}
                      {event.form ? <span className="ml-2 font-mono text-xs text-muted-foreground">{event.form}</span> : null}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(event.at, locale)}
                      {event.ip ? ` · ${event.ip}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </>
  )
}
