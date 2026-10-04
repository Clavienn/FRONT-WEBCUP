"use client"

import { useEffect, useState } from "react"
import { CircleAlert, Search, ShieldCheck } from "lucide-react"

import { useAuth } from "@/components/auth/auth-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/toast"
import {
  roleRepository,
  userAdminRepository,
  type ManagedUser,
  type PendingAgent,
  type Role,
  type UserPage,
} from "@/repository/admin.repository"

const PAGE_SIZE = 10

const errorMessage = (cause: unknown) => (cause instanceof Error ? cause.message : "Une erreur est survenue")
const notifyError = (cause: unknown) =>
  toast.add({ title: "Erreur", description: errorMessage(cause), type: "error" })

const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString("fr-FR", { dateStyle: "medium" }) : "Jamais"

interface Result {
  key: string
  data?: UserPage
  error?: string
}

// Attribution des rôles : chaque case coche/décoche immédiatement côté serveur
function RolesDialog({
  user,
  roles,
  onClose,
  onRolesChanged,
}: {
  user: ManagedUser | null
  roles: Role[]
  onClose: () => void
  onRolesChanged: (userId: number, roles: string[]) => void
}) {
  const [busyCode, setBusyCode] = useState<string | null>(null)
  const owned = user?.roles ?? []

  const toggle = async (role: Role, checked: boolean) => {
    if (!user) return
    setBusyCode(role.code)
    try {
      const result = checked
        ? await userAdminRepository.assignRole(user.id, role.code)
        : await userAdminRepository.removeRole(user.id, role.code)
      onRolesChanged(user.id, result.roles)
    } catch (cause) {
      notifyError(cause)
    } finally {
      setBusyCode(null)
    }
  }

  return (
    <Dialog open={user !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rôles de {user ? `${user.firstName} ${user.lastName}`.trim() : ""}</DialogTitle>
          <DialogDescription>
            Les droits de l’utilisateur sont l’ensemble des permissions de ses rôles. Le changement s’applique immédiatement.
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-2">
          {roles.map((role) => (
            <li key={role.id}>
              <Label
                htmlFor={`role-${role.id}`}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-border/70 px-3 py-2.5"
              >
                <Checkbox
                  id={`role-${role.id}`}
                  checked={owned.includes(role.code)}
                  disabled={busyCode !== null}
                  onCheckedChange={(checked) => toggle(role, checked === true)}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{role.label}</span>
                  <span className="block font-mono text-xs text-muted-foreground">{role.code}</span>
                </span>
              </Label>
            </li>
          ))}
        </ul>

        <DialogFooter>
          <Button onClick={onClose}>Terminer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function UsersAdmin() {
  const { user: me } = useAuth()
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [page, setPage] = useState(1)
  const [reloadKey, setReloadKey] = useState(0)
  const [result, setResult] = useState<Result | null>(null)
  const [roles, setRoles] = useState<Role[]>([])
  const [busyId, setBusyId] = useState<number | null>(null)
  const [managedId, setManagedId] = useState<number | null>(null)
  const [pendingAgents, setPendingAgents] = useState<PendingAgent[]>([])
  const [validatingId, setValidatingId] = useState<number | null>(null)

  useEffect(() => {
    userAdminRepository
      .pendingAgents()
      .then((response) => setPendingAgents(response.users))
      .catch(() => undefined)
  }, [])

  const validateAgent = async (agent: PendingAgent) => {
    setValidatingId(agent.id)
    try {
      await userAdminRepository.validateAgent(agent.id)
      setPendingAgents((current) => current.filter((item) => item.id !== agent.id))
      toast.add({ title: "Agent validé", type: "success" })
    } catch (cause) {
      notifyError(cause)
    } finally {
      setValidatingId(null)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    roleRepository.list().then(setRoles).catch(notifyError)
  }, [])

  const key = `${debouncedSearch}|${page}|${reloadKey}`
  const current = result?.key === key ? result : null

  useEffect(() => {
    let mounted = true
    userAdminRepository
      .list({ q: debouncedSearch || undefined, page, limit: PAGE_SIZE })
      .then((data) => mounted && setResult({ key, data }))
      .catch((cause) => mounted && setResult({ key, error: errorMessage(cause) }))
    return () => {
      mounted = false
    }
  }, [key, debouncedSearch, page])

  const reload = () => setReloadKey((value) => value + 1)

  // Met à jour une ligne sans recharger la page
  const patchUser = (id: number, patch: Partial<ManagedUser>) =>
    setResult((previous) =>
      previous?.data
        ? {
            ...previous,
            data: {
              ...previous.data,
              users: previous.data.users.map((item) => (item.id === id ? { ...item, ...patch } : item)),
            },
          }
        : previous
    )

  const toggleActive = async (target: ManagedUser, isActive: boolean) => {
    setBusyId(target.id)
    try {
      const saved = await userAdminRepository.setStatus(target.id, isActive)
      patchUser(target.id, { isActive: saved.isActive })
    } catch (cause) {
      notifyError(cause)
    } finally {
      setBusyId(null)
    }
  }

  const data = current?.data
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1
  const managed = data?.users.find((item) => item.id === managedId) ?? null

  return (
    <>
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Administration</p>
          <h1 className="mt-1 text-3xl font-medium tracking-tight sm:text-4xl">Utilisateurs</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Consultez les comptes, activez ou désactivez-les et attribuez leurs rôles.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            type="search"
            aria-label="Rechercher un utilisateur"
            placeholder="Nom ou e-mail"
            className="pl-9"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </section>

      {pendingAgents.length > 0 && (
        <section
          aria-labelledby="pending-agents"
          className="space-y-3 rounded-2xl border border-amber-500/40 bg-amber-500/5 p-5"
        >
          <div>
            <h2 id="pending-agents" className="font-medium text-foreground">
              Agents en attente de validation ({pendingAgents.length})
            </h2>
            <p className="text-sm text-muted-foreground">
              Ces comptes se sont inscrits eux-mêmes comme agents. Tant qu’ils ne sont pas validés, ils ne voient que des
              coordonnées partielles et ne peuvent pas modifier de compte citoyen. Validez uniquement les personnes que
              vous connaissez.
            </p>
          </div>
          <ul className="divide-y divide-border/70 rounded-xl border border-border/70 bg-background/60">
            {pendingAgents.map((agent) => (
              <li key={agent.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{`${agent.firstName} ${agent.lastName}`.trim()}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {agent.email} · inscrit le {formatDate(agent.createdAt)}
                  </p>
                </div>
                <Button size="sm" disabled={validatingId !== null} onClick={() => void validateAgent(agent)}>
                  {validatingId === agent.id && <Spinner />}
                  Valider
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {current?.error ? (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
          <span className="flex items-start gap-2">
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {current.error}
          </span>
          <Button variant="outline" size="sm" onClick={reload}>Réessayer</Button>
        </div>
      ) : !data ? (
        <Skeleton className="h-72 rounded-2xl" />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/80 bg-card/70 shadow-sm backdrop-blur-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Rôles</TableHead>
                <TableHead className="hidden md:table-cell">Dernière connexion</TableHead>
                <TableHead>Actif</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    Aucun utilisateur trouvé.
                  </TableCell>
                </TableRow>
              )}
              {data.users.map((item) => {
                const isMe = item.id === me?.id
                return (
                  <TableRow key={item.id} className={item.isActive ? undefined : "opacity-60"}>
                    <TableCell>
                      <p className="truncate font-medium">
                        {`${item.firstName} ${item.lastName}`.trim()}
                        {isMe && <span className="ml-2 text-xs font-normal text-muted-foreground">(vous)</span>}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{item.email}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(item.roles ?? []).length === 0 && <span className="text-xs text-muted-foreground">Aucun</span>}
                        {(item.roles ?? []).map((code) => (
                          <Badge key={code} variant={code === "admin" ? "default" : "secondary"}>
                            {roles.find((role) => role.code === code)?.label ?? code}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{formatDate(item.lastLoginAt)}</TableCell>
                    <TableCell>
                      <Switch
                        checked={item.isActive}
                        disabled={busyId === item.id || isMe}
                        onCheckedChange={(checked) => toggleActive(item, checked)}
                        aria-label={`${item.isActive ? "Désactiver" : "Activer"} ${item.email}`}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => setManagedId(item.id)}>
                        <ShieldCheck />
                        Rôles
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {data && totalPages > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-center gap-3">
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

      <RolesDialog
        user={managed}
        roles={roles}
        onClose={() => setManagedId(null)}
        onRolesChanged={(id, next) => patchUser(id, { roles: next })}
      />
    </>
  )
}
