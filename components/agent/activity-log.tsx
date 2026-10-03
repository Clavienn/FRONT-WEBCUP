"use client"

import { useEffect, useMemo, useState } from "react"
import { CircleAlert, RefreshCw, ScrollText } from "lucide-react"

import { actionLabel, entityLabel, formatDate, groupActions, isFailure } from "@/lib/audit-actions"
import { useAuth } from "@/components/auth/auth-provider"
import { useLanguage } from "@/components/i18n/language-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { NativeSelect, NativeSelectOptGroup, NativeSelectOption } from "@/components/ui/native-select"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { auditRepository, type PlatformActivityLog, type PlatformActivityPage } from "@/repository/admin.repository"

// Pagination côté serveur : seules PAGE_SIZE lignes sont demandées à chaque requête
const PAGE_SIZE = 20

function agentName(log: PlatformActivityLog) {
  if (!log.user) return ""
  return `${log.user.firstName} ${log.user.lastName}`.trim()
}

interface Result {
  key: string
  data?: PlatformActivityPage
  error?: string
}

export function ActivityLog() {
  const { user } = useAuth()
  const { t, locale } = useLanguage()
  // Les libellés de groupes dépendent de la locale : ils sont recalculés quand elle change
  const groups = useMemo(() => groupActions(t), [t])
  const [action, setAction] = useState("")
  // Les traces de navigation (GET /api/... 200) sont 9 lignes sur 10 dans ce journal : les cacher
  // par défaut rend l'historique lisible, l'option les réaffiche sans quitter la page.
  const [withTechnical, setWithTechnical] = useState(false)
  const [page, setPage] = useState(1)
  const [reloadKey, setReloadKey] = useState(0)
  const [result, setResult] = useState<Result | null>(null)

  // Même discriminant que l'API (permission ouvrant le journal complet) : si le front et le serveur
  // ne consultaient pas la même source, la colonne afficherait un périmètre différent des données.
  // Un agent ne voit que ses propres opérations ; la colonne "Agent" n'aurait donc rien à afficher.
  const isAdminViewer = user?.permissions.includes("admin.users.manage") === true

  const key = `${action}|${withTechnical}|${page}|${reloadKey}`
  const current = result?.key === key ? result : null
  const data = current?.data

  useEffect(() => {
    let mounted = true
    auditRepository
      .platformActivity({ action: action || undefined, technical: withTechnical, page, limit: PAGE_SIZE })
      .then((response) => mounted && setResult({ key, data: response }))
      .catch((cause) =>
        mounted && setResult({ key, error: cause instanceof Error ? cause.message : t("auditLog.common.errorLoad") }),
      )
    return () => {
      mounted = false
    }
  }, [key, action, withTechnical, page, t])

  const reload = () => setReloadKey((value) => value + 1)
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1

  return (
    <>
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">{t("auditLog.agentPage.eyebrow")}</p>
          <h1 className="mt-1 text-3xl font-medium tracking-tight sm:text-4xl">{t("auditLog.agentPage.title")}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            {isAdminViewer ? t("auditLog.agentPage.descriptionAdmin") : t("auditLog.agentPage.descriptionAgent")}
          </p>
        </div>
        <Button variant="outline" onClick={reload} disabled={!current} className="w-fit">
          {current ? <RefreshCw aria-hidden="true" /> : <Spinner />}
          {t("auditLog.common.refresh")}
        </Button>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <NativeSelect
          aria-label={t("auditLog.agentPage.filterAria")}
          className="w-full sm:w-72"
          value={action}
          onChange={(event) => {
            setAction(event.target.value)
            setPage(1)
          }}
        >
          <NativeSelectOption value="">{t("auditLog.agentPage.allOperations")}</NativeSelectOption>
          {groups.map(([label, codes]) => (
            <NativeSelectOptGroup key={label} label={label}>
              {codes.map((code) => (
                <NativeSelectOption key={code} value={code}>
                  {actionLabel(code, t)}
                </NativeSelectOption>
              ))}
            </NativeSelectOptGroup>
          ))}
        </NativeSelect>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
          <Checkbox
            checked={withTechnical}
            onCheckedChange={(checked) => {
              setWithTechnical(checked === true)
              setPage(1)
            }}
          />
          {t("auditLog.agentPage.withTechnical")}
        </label>

        {data && (
          <p className="text-sm text-muted-foreground sm:ml-auto" aria-live="polite">
            {t(data.total > 1 ? "auditLog.agentPage.countMany" : "auditLog.agentPage.countOne", { count: data.total })}
          </p>
        )}
      </div>

      {current?.error ? (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
          <span className="flex items-start gap-2">
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {current.error}
          </span>
          <Button variant="outline" size="sm" onClick={reload}>{t("auditLog.common.retry")}</Button>
        </div>
      ) : !data ? (
        <Skeleton className="h-96 rounded-2xl" />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/80 bg-card/70 shadow-sm backdrop-blur-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("auditLog.common.date")}</TableHead>
                {isAdminViewer && <TableHead>{t("auditLog.agentPage.agentColumn")}</TableHead>}
                <TableHead>{t("auditLog.agentPage.operationColumn")}</TableHead>
                <TableHead className="hidden md:table-cell">{t("auditLog.agentPage.caseFileColumn")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={isAdminViewer ? 4 : 3} className="py-10 text-center text-muted-foreground">
                    {t("auditLog.agentPage.empty")}
                  </TableCell>
                </TableRow>
              )}
              {data.logs.map((log) => {
                const name = agentName(log)
                const label = actionLabel(log.action, t)
                // Le code brut n'est affiché que s'il apporte quelque chose : sans cela une trace
                // technique affichait deux fois le même texte, libellé puis code mono.
                const showCode = label !== log.action
                return (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
                      {formatDate(log.createdAt, locale)}
                    </TableCell>
                    {isAdminViewer && (
                      <TableCell>
                        {name ? (
                          <span className="text-sm font-medium">{name}</span>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            {log.userId
                              ? t("auditLog.common.accountRef", { id: log.userId })
                              : t("auditLog.agentPage.anonymous")}
                          </span>
                        )}
                      </TableCell>
                    )}
                    <TableCell>
                      {isFailure(log.action) ? (
                        <Badge variant="outline" className="border-destructive/30 bg-destructive/5 text-destructive">
                          {label}
                        </Badge>
                      ) : (
                        // Une trace de navigation n'est pas une décision métier : elle reste en retrait
                        <span className={log.technical ? "text-sm text-muted-foreground" : "text-sm"}>{label}</span>
                      )}
                      {showCode && <span className="block font-mono text-xs text-muted-foreground">{log.action}</span>}
                    </TableCell>
                    <TableCell className="hidden text-sm md:table-cell">
                      {log.entityType ? (
                        <>
                          {`${entityLabel(log.entityType, t)}${log.entityId ? ` #${log.entityId}` : ""}`}
                          {log.targetEmail && (
                            <span className="block break-all text-xs text-muted-foreground">{log.targetEmail}</span>
                          )}
                        </>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {data && totalPages > 1 && (
        <nav aria-label={t("auditLog.common.pagination")} className="flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(1)}>
            {t("auditLog.common.first")}
          </Button>
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            {t("auditLog.common.previous")}
          </Button>
          <span className="text-sm text-muted-foreground">
            {t("auditLog.common.pageOf", { page, total: totalPages })}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            {t("auditLog.common.next")}
          </Button>
        </nav>
      )}

      <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
        <ScrollText className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        {t("auditLog.agentPage.note")}
      </p>
    </>
  )
}