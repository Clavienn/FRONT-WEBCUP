"use client"

import { useCallback, useEffect, useState, type FormEvent } from "react"
import { CircleAlert, KeyRound, Pencil, Plus, Trash2 } from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/toast"
import { permissionRepository, roleRepository, type Permission, type Role } from "@/repository/admin.repository"

const errorMessage = (cause: unknown) => (cause instanceof Error ? cause.message : "Une erreur est survenue")
const notifyError = (cause: unknown) =>
  toast.add({ title: "Erreur", description: errorMessage(cause), type: "error" })

const byLevel = (a: Role, b: Role) => a.level - b.level || a.id - b.id

// ── Création / modification d'un rôle ────────────────────────
function RoleForm({
  role,
  onClose,
  onSaved,
}: {
  role: Role | null
  onClose: () => void
  onSaved: (role: Role, created: boolean) => void
}) {
  const [code, setCode] = useState("")
  const [label, setLabel] = useState(role?.label ?? "")
  const [level, setLevel] = useState(String(role?.level ?? 0))
  const [error, setError] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const isEditing = role !== null

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    const levelNumber = Number(level)
    if (!Number.isInteger(levelNumber) || levelNumber < 0 || levelNumber > 1000) {
      setError("Le niveau doit être un entier entre 0 et 1000.")
      return
    }

    setIsSaving(true)
    try {
      const data = { label: label.trim(), level: levelNumber }
      const saved = isEditing
        ? await roleRepository.update(role.id, data)
        : await roleRepository.create({ code: code.trim().toLowerCase(), ...data })
      onSaved(saved, !isEditing)
    } catch (cause) {
      setError(errorMessage(cause))
      setIsSaving(false)
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEditing ? "Modifier le rôle" : "Nouveau rôle"}</DialogTitle>
        <DialogDescription>
          {isEditing
            ? "Le code d’un rôle ne peut pas être modifié."
            : "Le rôle n’a aucune permission à sa création ; attribuez-les ensuite."}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="role-code">Code</Label>
            <Input
              id="role-code"
              value={isEditing ? role.code : code}
              onChange={(event) => setCode(event.target.value)}
              disabled={isEditing}
              required
              maxLength={50}
              pattern="[a-zA-Z][a-zA-Z0-9_]{1,49}"
              title="2 à 50 caractères : lettres, chiffres et _, en commençant par une lettre"
              placeholder="moderator"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role-label">Libellé</Label>
            <Input id="role-label" value={label} onChange={(event) => setLabel(event.target.value)} required maxLength={100} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="role-level">Niveau</Label>
          <Input
            id="role-level"
            type="number"
            min={0}
            max={1000}
            step={1}
            value={level}
            onChange={(event) => setLevel(event.target.value)}
            required
          />
          <p className="text-xs text-muted-foreground">Plus le niveau est élevé, plus le rôle est important (0 à 1000).</p>
        </div>

        {error && (
          <p role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </p>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>Annuler</Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving && <Spinner />}
            {isEditing ? "Enregistrer" : "Créer le rôle"}
          </Button>
        </DialogFooter>
      </form>
    </>
  )
}

// ── Permissions d'un rôle ────────────────────────────────────
function RolePermissionsForm({
  role,
  permissions,
  onClose,
  onSaved,
}: {
  role: Role
  permissions: Permission[]
  onClose: () => void
  onSaved: (role: Role, codes: string[]) => void
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(role.permissions ?? []))
  const [error, setError] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const modules = Array.from(new Set(permissions.map((permission) => permission.module))).sort()

  const toggle = (code: string, checked: boolean) =>
    setSelected((current) => {
      const next = new Set(current)
      if (checked) next.add(code)
      else next.delete(code)
      return next
    })

  const handleSave = async () => {
    setError("")
    setIsSaving(true)
    try {
      const result = await roleRepository.setPermissions(role.id, [...selected])
      onSaved(role, result.permissions.map((permission) => permission.code))
    } catch (cause) {
      setError(errorMessage(cause))
      setIsSaving(false)
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Permissions du rôle « {role.label} »</DialogTitle>
        <DialogDescription>
          Le changement s’applique à tous les utilisateurs de ce rôle dès l’enregistrement.
        </DialogDescription>
      </DialogHeader>

      <div className="max-h-[50vh] space-y-5 overflow-y-auto pr-1">
        {modules.map((module) => (
          <fieldset key={module} className="space-y-2">
            <legend className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{module}</legend>
            {permissions
              .filter((permission) => permission.module === module)
              .map((permission) => (
                <Label
                  key={permission.id}
                  htmlFor={`perm-${permission.id}`}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border border-border/70 px-3 py-2"
                >
                  <Checkbox
                    id={`perm-${permission.id}`}
                    className="mt-0.5"
                    checked={selected.has(permission.code)}
                    onCheckedChange={(checked) => toggle(permission.code, checked === true)}
                  />
                  <span className="min-w-0">
                    <span className="block text-sm">{permission.label}</span>
                    <span className="block font-mono text-xs text-muted-foreground">{permission.code}</span>
                  </span>
                </Label>
              ))}
          </fieldset>
        ))}
      </div>

      {error && (
        <p role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>Annuler</Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving && <Spinner />}
          Enregistrer ({selected.size})
        </Button>
      </DialogFooter>
    </>
  )
}

export function RolesAdmin() {
  const [roles, setRoles] = useState<Role[] | null>(null)
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loadError, setLoadError] = useState("")
  // undefined = fermé ; null = création ; rôle = modification
  const [editing, setEditing] = useState<Role | null | undefined>(undefined)
  const [permsOf, setPermsOf] = useState<Role | null>(null)
  const [deleting, setDeleting] = useState<Role | null>(null)

  const load = useCallback(async () => {
    try {
      const [roleList, permissionList] = await Promise.all([roleRepository.list(), permissionRepository.list()])
      setRoles(roleList.sort(byLevel))
      setPermissions(permissionList)
      setLoadError("")
    } catch (cause) {
      setLoadError(errorMessage(cause))
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- chargement initial depuis l'API
    load()
  }, [load])

  const confirmDelete = async () => {
    if (!deleting) return
    const target = deleting
    setDeleting(null)
    try {
      await roleRepository.remove(target.id)
      setRoles((current) => current?.filter((role) => role.id !== target.id) ?? null)
      toast.add({ title: "Rôle supprimé", type: "success" })
    } catch (cause) {
      notifyError(cause)
    }
  }

  return (
    <>
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Administration</p>
          <h1 className="mt-1 text-3xl font-medium tracking-tight sm:text-4xl">Rôles</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Définissez les rôles et les permissions qui leur sont associées.
          </p>
        </div>
        <Button onClick={() => setEditing(null)} className="w-fit rounded-xl">
          <Plus aria-hidden="true" />
          Nouveau rôle
        </Button>
      </section>

      {loadError ? (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
          <span className="flex items-start gap-2">
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {loadError}
          </span>
          <Button variant="outline" size="sm" onClick={load}>Réessayer</Button>
        </div>
      ) : !roles ? (
        <Skeleton className="h-60 rounded-2xl" />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/80 bg-card/70 shadow-sm backdrop-blur-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rôle</TableHead>
                <TableHead className="hidden sm:table-cell">Code</TableHead>
                <TableHead className="text-right">Niveau</TableHead>
                <TableHead className="text-right">Permissions</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{role.label}</span>
                      {role.isSystem && <Badge variant="outline">Système</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="hidden font-mono text-xs sm:table-cell">{role.code}</TableCell>
                  <TableCell className="text-right tabular-nums">{role.level}</TableCell>
                  <TableCell className="text-right tabular-nums">{role.permissions?.length ?? 0}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => setPermsOf(role)} aria-label={`Permissions de ${role.label}`} title="Permissions">
                        <KeyRound />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => setEditing(role)} aria-label={`Modifier ${role.label}`}>
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleting(role)}
                        disabled={role.isSystem}
                        title={role.isSystem ? "Un rôle système ne peut pas être supprimé" : undefined}
                        aria-label={`Supprimer ${role.label}`}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={editing !== undefined} onOpenChange={(open) => !open && setEditing(undefined)}>
        <DialogContent className="sm:max-w-lg">
          <RoleForm
            role={editing ?? null}
            onClose={() => setEditing(undefined)}
            onSaved={(_saved, created) => {
              setEditing(undefined)
              toast.add({ title: created ? "Rôle créé" : "Rôle modifié", type: "success" })
              load()
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={permsOf !== null} onOpenChange={(open) => !open && setPermsOf(null)}>
        <DialogContent className="sm:max-w-lg">
          {permsOf && (
            <RolePermissionsForm
              role={permsOf}
              permissions={permissions}
              onClose={() => setPermsOf(null)}
              onSaved={() => {
                setPermsOf(null)
                toast.add({ title: "Permissions mises à jour", type: "success" })
                load()
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le rôle « {deleting?.label} » ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est définitive. Un rôle encore attribué à des utilisateurs ne peut pas être supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete}>Supprimer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
