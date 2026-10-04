"use client"

import { useCallback, useEffect, useState } from "react"
import { CircleAlert, Eye, LaptopMinimal, ShieldAlert } from "lucide-react"

import { useLanguage } from "@/components/i18n/language-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import { actionLabel, isFailure } from "@/lib/audit-actions"
import { authRepository, type SecurityOverview } from "@/repository/auth.repository"

const EVENTS_SHOWN = 8
const FAILED_LOGIN_WINDOW_MS = 7 * 24 * 60 * 60 * 1000

// L'adresse de l'API est déjà masquée côté serveur (203.0.113.x) ; on l'affiche telle quelle
function formatDate(value: string, locale: string) {
  return new Date(value).toLocaleString(locale === "en" ? "en-GB" : "fr-FR", { dateStyle: "medium", timeStyle: "short" })
}

/**
 * Sécurité du compte : appareils connectés (avec fermeture à distance), activité récente, et
 * consultations de ses données par le personnel. Rend visible ce qui protège l'utilisateur.
 */
export function SecuritySection() {
  const { t, locale } = useLanguage()
  const [overview, setOverview] = useState<SecurityOverview | null>(null)
  const [error, setError] = useState("")
  const [closingId, setClosingId] = useState<string | number | null>(null)
  // Échecs de connexion sur ce compte ces 7 derniers jours (calculé au chargement, pas au rendu)
  const [failedLogins, setFailedLogins] = useState(0)

  const load = useCallback(async () => {
    try {
      const data = await authRepository.security()
      const since = Date.now() - FAILED_LOGIN_WINDOW_MS
      setFailedLogins(data.events.filter((event) => event.action === "login.failed" && new Date(event.at).getTime() > since).length)
      setOverview(data)
      setError("")
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("securitySection.loadError"))
    }
  }, [t])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- chargement initial depuis l'API
    void load()
  }, [load])

  const closeSession = async (id: string | number) => {
    setClosingId(id)
    try {
      await authRepository.revokeSession(id)
      toast.add({ title: t("securitySection.sessionClosed"), type: "success" })
      await load()
    } catch (cause) {
      toast.add({
        title: t("securitySection.errorTitle"),
        description: cause instanceof Error ? cause.message : t("securitySection.loadError"),
        type: "error",
      })
    } finally {
      setClosingId(null)
    }
  }

  return (
    <section aria-labelledby="security-title" className="space-y-6 rounded-2xl border border-border/80 bg-card/70 p-6 backdrop-blur-sm">
      <div>
        <h2 id="security-title" className="font-medium text-foreground">{t("securitySection.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("securitySection.subtitle")}</p>
      </div>

      {error ? (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
          <span className="flex items-start gap-2">
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {error}
          </span>
          <Button variant="outline" size="sm" onClick={() => void load()}>{t("securitySection.retry")}</Button>
        </div>
      ) : !overview ? (
        <Skeleton className="h-40 rounded-xl" />
      ) : (
        <>
          {failedLogins > 0 && (
            <p role="alert" className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-900 dark:text-amber-100">
              <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>{t("securitySection.failedLoginAlert", { count: failedLogins })}</span>
            </p>
          )}

          <div className="space-y-3">
            <h3 className="text-sm font-semibold">{t("securitySection.devicesTitle")}</h3>
            <ul className="space-y-2">
              {overview.sessions.map((session) => (
                <li key={session.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border/70 bg-background/50 px-4 py-3">
                  <LaptopMinimal className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                      {session.device}
                      {session.current && <Badge variant="secondary">{t("securitySection.thisDevice")}</Badge>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {session.ip} · {t("securitySection.lastUsed", { date: formatDate(session.lastUsedAt, locale) })}
                    </p>
                  </div>
                  {!session.current && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={closingId !== null}
                      onClick={() => void closeSession(session.id)}
                    >
                      {closingId === session.id && <Spinner />}
                      {t("securitySection.closeSession")}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold">{t("securitySection.activityTitle")}</h3>
            {overview.events.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("securitySection.activityEmpty")}</p>
            ) : (
              <ul className="divide-y divide-border/70 rounded-xl border border-border/70 bg-background/50">
                {overview.events.slice(0, EVENTS_SHOWN).map((event, index) => (
                  <li key={`${event.at}-${index}`} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm">
                    <span className={isFailure(event.action) ? "font-medium text-destructive" : undefined}>
                      {actionLabel(event.action, t)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(event.at, locale)}
                      {event.ip ? ` · ${event.ip}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Eye className="size-4 text-muted-foreground" aria-hidden="true" />
              {t("securitySection.accessTitle")}
            </h3>
            <p className="text-xs text-muted-foreground">{t("securitySection.accessSubtitle")}</p>
            {overview.dataAccess.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("securitySection.accessEmpty")}</p>
            ) : (
              <ul className="divide-y divide-border/70 rounded-xl border border-border/70 bg-background/50">
                {overview.dataAccess.slice(0, EVENTS_SHOWN).map((access, index) => (
                  <li key={`${access.at}-${index}`} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm">
                    <span>
                      {t("securitySection.accessLine", {
                        name: access.by,
                        role: t(`roles.${access.role}`),
                        resource: t(`securitySection.resource.${access.resource}`),
                      })}
                    </span>
                    <span className="text-xs text-muted-foreground">{formatDate(access.at, locale)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </section>
  )
}
