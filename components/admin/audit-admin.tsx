"use client"

import { useEffect, useState } from "react"
import { CircleAlert, RefreshCw, Search, UserRound, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  auditRepository,
  userAdminRepository,
  type AuditLog,
  type AuditLogPage,
  type ManagedUser,
} from "@/repository/admin.repository"

// Pagination côté serveur : seules PAGE_SIZE lignes sont demandées à chaque requête
const PAGE_SIZE = 20

const actionLabels: Record<string, string> = {
  "user.register": "Création de compte",
  login: "Connexion",
  "login.failed": "Échec de connexion",
  "login.blocked": "Connexion refusée (compte désactivé)",
  "logout.all": "Déconnexion de tous les appareils",
  "password.change": "Changement de mot de passe",
  "profile.update": "Modification du profil",
  "user.activate": "Activation d’un compte",
  "user.deactivate": "Désactivation d’un compte",
  "role.assign": "Attribution d’un rôle",
  "role.remove": "Retrait d’un rôle",
  "role.create": "Création d’un rôle",
  "role.update": "Modification d’un rôle",
  "role.delete": "Suppression d’un rôle",
  "role.permission.grant": "Permission ajoutée à un rôle",
  "role.permission.revoke": "Permission retirée d’un rôle",
  "role.permission.sync": "Permissions d’un rôle remplacées",
  "permission.create": "Création d’une permission",
  "permission.update": "Modification d’une permission",
  "permission.delete": "Suppression d’une permission",
  "service.create": "Création d’un service",
  "service.update": "Modification d’un service",
  "service.delete": "Suppression d’un service",
  "announcement.create": "Création d’une annonce",
  "announcement.update": "Modification d’une annonce",
  "announcement.published": "Annonce publiée",
  "announcement.archived": "Annonce archivée",
  "announcement.draft": "Annonce repassée en brouillon",
  "announcement.delete": "Suppression d’une annonce",
  "contact.send": "Message envoyé",
  "contact.new": "Message marqué nouveau",
  "contact.read": "Message marqué lu",
  "contact.processed": "Message marqué traité",
}

const actionLabel = (action: string) => actionLabels[action] ?? action

const entityLabels: Record<string, string> = {
  users: "Utilisateur",
  roles: "Rôle",
  permissions: "Permission",
  municipal_services: "Service",
  announcements: "Annonce",
  contact_messages: "Message",
}

const formatDate = (value: string) =>
  new Date(value).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "medium" })

const errorMessage = (cause: unknown) => (cause instanceof Error ? cause.message : "Une erreur est survenue")

const isFailure = (action: string) => action === "login.failed" || action === "login.blocked"

interface Result {
  key: string
  data?: AuditLogPage
  error?: string
}

interface UserFilterValue {
  id: number
  label: string
}

// Recherche d'utilisateur (nom ou e-mail) côté serveur : seuls 6 résultats sont demandés
function UserFilter({ value, onChange }: { value: UserFilterValue | null; onChange: (value: UserFilterValue | null) => void }) {
  const [query, setQuery] = useState("")
  const [debounced, setDebounced] = useState("")
  const [matches, setMatches] = useState<{ query: string; users: ManagedUser[] } | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), 250)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    if (!debounced) return
    let mounted = true
    userAdminRepository
      .list({ q: debounced, limit: 6 })
      .then((response) => mounted && setMatches({ query: debounced, users: response.users }))
      .catch(() => mounted && setMatches({ query: debounced, users: [] }))
    return () => {
      mounted = false
    }
  }, [debounced])

  if (value) {
    return (
      <Button variant="secondary" size="sm" onClick={() => onChange(null)} aria-label="Retirer le filtre utilisateur">
        <UserRound aria-hidden="true" />
        {value.label}
        <X aria-hidden="true" />
      </Button>
    )
  }

  const results = debounced && matches?.query === debounced ? matches.users : null

  return (
    <div className="relative w-full sm:w-64">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <Input
        type="search"
        aria-label="Filtrer par utilisateur"
        placeholder="Filtrer par utilisateur"
        className="pl-9"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {open && debounced && (
        <ul role="listbox" className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-border bg-popover text-popover-foreground shadow-md">
          {results === null ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">Recherche…</li>
          ) : results.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">Aucun utilisateur trouvé.</li>
          ) : (
            results.map((user) => {
              const label = `${user.firstName} ${user.lastName}`.trim() || user.email
              return (
                <li key={user.id} role="option" aria-selected={false}>
                  <button
                    type="button"
                    className="block w-full cursor-pointer px-3 py-2 text-left hover:bg-accent"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      onChange({ id: user.id, label })
                      setQuery("")
                      setDebounced("")
                      setOpen(false)
                    }}
                  >
                    <span className="block text-sm font-medium">{label}</span>
                    <span className="block text-xs text-muted-foreground">{user.email}</span>
                  </button>
                </li>
              )
            })
          )}
        </ul>
      )}
    </div>
  )
}

function userName(log: AuditLog) {
  if (!log.user) return null
  return `${log.user.firstName} ${log.user.lastName}`.trim() || log.user.email
}

export function AuditAdmin() {
  const [action, setAction] = useState("")
  // Filtre par utilisateur : posé en cliquant sur un nom dans le tableau
  const [userFilter, setUserFilter] = useState<{ id: number; label: string } | null>(null)
  const [page, setPage] = useState(1)
  const [reloadKey, setReloadKey] = useState(0)
  const [result, setResult] = useState<Result | null>(null)

  const key = `${action}|${userFilter?.id ?? ""}|${page}|${reloadKey}`
  const current = result?.key === key ? result : null
  const data = current?.data

  useEffect(() => {
    let mounted = true
    auditRepository
      .list({ action: action || undefined, userId: userFilter?.id, page, limit: PAGE_SIZE })
      .then((response) => mounted && setResult({ key, data: response }))
      .catch((cause) => mounted && setResult({ key, error: errorMessage(cause) }))
    return () => {
      mounted = false
    }
  }, [key, action, userFilter, page])

  const reload = () => setReloadKey((value) => value + 1)
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1

  return (
    <>
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Administration</p>
          <h1 className="mt-1 text-3xl font-medium tracking-tight sm:text-4xl">Journal d’audit</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Historique des actions effectuées par les utilisateurs, du plus récent au plus ancien.
          </p>
        </div>
        <Button variant="outline" onClick={reload} disabled={!current} className="w-fit">
          {current ? <RefreshCw aria-hidden="true" /> : <Spinner />}
          Actualiser
        </Button>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <NativeSelect
          aria-label="Filtrer par action"
          className="w-full sm:w-72"
          value={action}
          onChange={(event) => {
            setAction(event.target.value)
            setPage(1)
          }}
        >
          <NativeSelectOption value="">Toutes les actions</NativeSelectOption>
          {Object.entries(actionLabels).map(([code, label]) => (
            <NativeSelectOption key={code} value={code}>
              {label}
            </NativeSelectOption>
          ))}
        </NativeSelect>

        <UserFilter
          value={userFilter}
          onChange={(next) => {
            setUserFilter(next)
            setPage(1)
          }}
        />

        {data && (
          <p className="text-sm text-muted-foreground sm:ml-auto" aria-live="polite">
            {data.total} action{data.total > 1 ? "s" : ""}
          </p>
        )}
      </div>

      {current?.error ? (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
          <span className="flex items-start gap-2">
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {current.error}
          </span>
          <Button variant="outline" size="sm" onClick={reload}>Réessayer</Button>
        </div>
      ) : !data ? (
        <Skeleton className="h-96 rounded-2xl" />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/80 bg-card/70 shadow-sm backdrop-blur-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Action</TableHead>
                <TableHead className="hidden md:table-cell">Cible</TableHead>
                <TableHead className="hidden lg:table-cell">Adresse IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    Aucune action enregistrée pour ce filtre.
                  </TableCell>
                </TableRow>
              )}
              {data.logs.map((log) => {
                const name = userName(log)
                return (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-xs tabular-nums text-muted-foreground">
                      {formatDate(log.createdAt)}
                    </TableCell>
                    <TableCell>
                      {name && log.user ? (
                        <button
                          type="button"
                          className="cursor-pointer text-left hover:underline"
                          title="Filtrer sur cet utilisateur"
                          onClick={() => {
                            setUserFilter({ id: log.user!.id, label: name })
                            setPage(1)
                          }}
                        >
                          <span className="block text-sm font-medium">{name}</span>
                          <span className="block text-xs text-muted-foreground">{log.user.email}</span>
                        </button>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {log.userId ? `Compte #${log.userId} (supprimé)` : "Anonyme"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isFailure(log.action) ? (
                        <Badge variant="outline" className="border-destructive/30 bg-destructive/5 text-destructive">
                          {actionLabel(log.action)}
                        </Badge>
                      ) : (
                        <span className="text-sm">{actionLabel(log.action)}</span>
                      )}
                      <span className="block font-mono text-xs text-muted-foreground">{log.action}</span>
                    </TableCell>
                    <TableCell className="hidden text-sm md:table-cell">
                      {log.entityType
                        ? `${entityLabels[log.entityType] ?? log.entityType}${log.entityId ? ` #${log.entityId}` : ""}`
                        : "—"}
                    </TableCell>
                    <TableCell className="hidden font-mono text-xs lg:table-cell">{log.ipAddress ?? "—"}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {data && totalPages > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(1)}>
            Début
          </Button>
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            Précédent
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} sur {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            Suivant
          </Button>
        </nav>
      )}
    </>
  )
}
