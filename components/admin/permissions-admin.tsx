"use client"

import { useCallback, useEffect, useState, type FormEvent } from "react"
import { CircleAlert, Pencil, Plus, Trash2 } from "lucide-react"

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
import { toast } from "@/components/ui/toast"
import { permissionRepository, type Permission } from "@/repository/admin.repository"

const errorMessage = (cause: unknown) => (cause instanceof Error ? cause.message : "Une erreur est survenue")

// ── Création / modification ──────────────────────────────────
function PermissionForm({
  permission,
  onClose,
  onSaved,
}: {
  permission: Permission | null
  onClose: () => void
  onSaved: (created: boolean) => void
}) {
  const [code, setCode] = useState("")
  const [label, setLabel] = useState(permission?.label ?? "")
  const [module, setModule] = useState(permission?.module ?? "")
  const [error, setError] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const isEditing = permission !== null

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setIsSaving(true)
    try {
      if (isEditing) {
        await permissionRepository.update(permission.id, { label: label.trim(), module: module.trim().toLowerCase() })
      } else {
        // Module vide : l'API le déduit du premier segment du code
        await permissionRepository.create({
          code: code.trim().toLowerCase(),
          label: label.trim(),
          module: module.trim().toLowerCase() || code.trim().toLowerCase().split(".")[0],
        })
      }
      onSaved(!isEditing)
    } catch (cause) {
      setError(errorMessage(cause))
      setIsSaving(false)
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEditing ? "Modifier la permission" : "Nouvelle permission"}</DialogTitle>
        <DialogDescription>
          {isEditing
            ? "Le code est référencé dans le code de l’application : il ne peut pas être modifié."
            : "Format du code : module.ressource.action, en minuscules (ex. citizen.reports.create)."}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="perm-code">Code</Label>
          <Input
            id="perm-code"
            value={isEditing ? permission.code : code}
            onChange={(event) => setCode(event.target.value)}
            disabled={isEditing}
            required
            maxLength={100}
            pattern="[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)+"
            title="Au moins deux segments séparés par des points, ex. citizen.reports.create"
            placeholder="citizen.reports.create"
            className="font-mono"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="perm-label">Libellé</Label>
          <Input id="perm-label" value={label} onChange={(event) => setLabel(event.target.value)} required maxLength={150} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="perm-module">Module</Label>
          <Input
            id="perm-module"
            value={module}
            onChange={(event) => setModule(event.target.value)}
            required={isEditing}
            maxLength={50}
            placeholder={isEditing ? undefined : "Déduit du code si vide"}
          />
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
            {isEditing ? "Enregistrer" : "Créer la permission"}
          </Button>
        </DialogFooter>
      </form>
    </>
  )
}

export function PermissionsAdmin() {
  const [permissions, setPermissions] = useState<Permission[] | null>(null)
  const [loadError, setLoadError] = useState("")
  // undefined = fermé ; null = création ; permission = modification
  const [editing, setEditing] = useState<Permission | null | undefined>(undefined)
  const [deleting, setDeleting] = useState<Permission | null>(null)
  // Rôles qui possèdent encore la permission (réponse 409) : propose une suppression forcée
  const [conflictRoles, setConflictRoles] = useState<string[] | null>(null)

  const load = useCallback(async () => {
    try {
      setPermissions(await permissionRepository.list())
      setLoadError("")
    } catch (cause) {
      setLoadError(errorMessage(cause))
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- chargement initial depuis l'API
    load()
  }, [load])

  const closeDelete = () => {
    setDeleting(null)
    setConflictRoles(null)
  }

  // Charge les rôles qui possèdent la permission pour avertir avant suppression
  const askDelete = async (permission: Permission) => {
    setDeleting(permission)
    setConflictRoles(null)
    try {
      setConflictRoles((await permissionRepository.get(permission.id)).roles ?? [])
    } catch (cause) {
      toast.add({ title: "Erreur", description: errorMessage(cause), type: "error" })
      closeDelete()
    }
  }

  const confirmDelete = async () => {
    if (!deleting || conflictRoles === null) return
    const target = deleting
    closeDelete()
    try {
      // Attribuée à des rôles : suppression forcée (détache puis supprime), annoncée dans la confirmation
      await permissionRepository.remove(target.id, conflictRoles.length > 0)
      toast.add({ title: "Permission supprimée", type: "success" })
      load()
    } catch (cause) {
      toast.add({ title: "Erreur", description: errorMessage(cause), type: "error" })
    }
  }

  const modules = permissions ? Array.from(new Set(permissions.map((item) => item.module))).sort() : []

  return (
    <>
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Administration</p>
          <h1 className="mt-1 text-3xl font-medium tracking-tight sm:text-4xl">Permissions</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Liste des droits d’accès disponibles, groupés par module. Les rôles les reçoivent depuis la page Rôles.
          </p>
        </div>
        <Button onClick={() => setEditing(null)} className="w-fit rounded-xl">
          <Plus aria-hidden="true" />
          Nouvelle permission
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
      ) : !permissions ? (
        <Skeleton className="h-72 rounded-2xl" />
      ) : (
        <div className="space-y-6">
          {modules.map((module) => (
            <section key={module} aria-labelledby={`module-${module}`} className="space-y-2">
              <h2 id={`module-${module}`} className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {module}
              </h2>
              <ul className="divide-y divide-border/70 overflow-hidden rounded-2xl border border-border/80 bg-card/70 shadow-sm backdrop-blur-sm">
                {permissions
                  .filter((item) => item.module === module)
                  .map((item) => (
                    <li key={item.id} className="flex items-center gap-3 px-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{item.label}</p>
                        <p className="truncate font-mono text-xs text-muted-foreground">{item.code}</p>
                      </div>
                      <Button variant="ghost" size="icon-sm" onClick={() => setEditing(item)} aria-label={`Modifier ${item.label}`}>
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => askDelete(item)}
                        aria-label={`Supprimer ${item.label}`}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 />
                      </Button>
                    </li>
                  ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <Dialog open={editing !== undefined} onOpenChange={(open) => !open && setEditing(undefined)}>
        <DialogContent className="sm:max-w-lg">
          <PermissionForm
            permission={editing ?? null}
            onClose={() => setEditing(undefined)}
            onSaved={(created) => {
              setEditing(undefined)
              toast.add({ title: created ? "Permission créée" : "Permission modifiée", type: "success" })
              load()
            }}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && closeDelete()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer « {deleting?.label} » ?</AlertDialogTitle>
            <AlertDialogDescription>
              {conflictRoles === null ? (
                "Vérification des rôles concernés…"
              ) : conflictRoles.length === 0 ? (
                "Cette action est définitive."
              ) : (
                <>
                  Cette permission est attribuée aux rôles <Badge variant="outline">{conflictRoles.join(", ")}</Badge>. La
                  supprimer la retirera de ces rôles, et leurs utilisateurs perdront ce droit immédiatement.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={conflictRoles === null} onClick={confirmDelete}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
