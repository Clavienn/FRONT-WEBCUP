"use client"

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react"
import Image from "next/image"
import { Building2, CircleAlert, ImagePlus, Pencil, Plus, Trash2, UserPlus, X } from "lucide-react"

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
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { userAdminRepository, type ManagedUser } from "@/repository/admin.repository"
import { externalEntityRepository, type ExternalEntity } from "@/repository/externalEntity.repository"
import {
  projectRepository,
  resolveProjectImageUrl,
  type Project,
  type ProjectStatus,
} from "@/repository/project.repository"

const errorMessage = (cause: unknown) => (cause instanceof Error ? cause.message : "Une erreur est survenue")
const notifyError = (cause: unknown) => toast.add({ title: "Erreur", description: errorMessage(cause), type: "error" })
const notifySuccess = (title: string) => toast.add({ title, type: "success" })

const STATUS_LABELS: Record<ProjectStatus, string> = {
  planned: "À venir",
  ongoing: "En cours",
  completed: "Terminé",
}

const byCreatedDesc = (a: Project, b: Project) => (a.createdAt < b.createdAt ? 1 : -1)

interface InfoForm {
  title: string
  description: string
  imageUrl: string
  status: ProjectStatus
  // Pertinent seulement quand status = "ongoing"
  progress: number
}

const toInfoForm = (project: Project | null): InfoForm => ({
  title: project?.title ?? "",
  description: project?.description ?? "",
  imageUrl: project?.imageUrl ?? "",
  status: project?.status ?? "ongoing",
  progress: project?.progress ?? 0,
})

// Section 1 du dialogue : les champs de base. Un nouveau projet doit être enregistré une
// première fois (il faut un id) avant de pouvoir lui associer participants et entités.
function ProjectInfoSection({
  project,
  onSaved,
}: {
  project: Project | null
  onSaved: (project: Project, created: boolean) => void
}) {
  const [form, setForm] = useState<InfoForm>(toInfoForm(project))
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isEditing = project !== null

  const set = <K extends keyof InfoForm>(key: K, value: InfoForm[K]) =>
    setForm((current) => ({ ...current, [key]: value }))

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    setIsUploading(true)
    try {
      const { url } = await projectRepository.uploadImage(file)
      set("imageUrl", url)
    } catch (cause) {
      notifyError(cause)
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    const data = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      imageUrl: form.imageUrl.trim() || null,
      status: form.status,
      progress: form.status === "ongoing" ? form.progress : null,
    }
    setIsSaving(true)
    try {
      const saved = isEditing ? await projectRepository.update(project.id, data) : await projectRepository.create(data)
      onSaved(saved, !isEditing)
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setIsSaving(false)
    }
  }

  const previewSrc = resolveProjectImageUrl(form.imageUrl || null)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="project-title">Titre</Label>
        <Input
          id="project-title"
          value={form.title}
          onChange={(event) => set("title", event.target.value)}
          required
          maxLength={200}
          placeholder="Rénovation du parc central"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="project-description">Description</Label>
        <Textarea
          id="project-description"
          rows={4}
          value={form.description}
          onChange={(event) => set("description", event.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-start">
        <div className="space-y-2">
          <Label>Image</Label>
          <div className="relative grid size-24 place-items-center overflow-hidden rounded-lg border border-border/80 bg-accent text-accent-foreground">
            {previewSrc ? (
              <Image src={previewSrc} alt="" fill className="object-cover" unoptimized />
            ) : (
              <Building2 className="size-8" aria-hidden="true" />
            )}
          </div>
        </div>
        <div className="space-y-2 self-end">
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleFileChange} />
          <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
            {isUploading ? <Spinner /> : <ImagePlus />}
            {form.imageUrl ? "Changer l'image" : "Ajouter une image"}
          </Button>
          <p className="text-xs text-muted-foreground">JPEG, PNG, WebP ou GIF, 5 Mo maximum.</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="project-status">Statut</Label>
        <NativeSelect
          id="project-status"
          className="w-full"
          value={form.status}
          onChange={(event) => set("status", event.target.value as ProjectStatus)}
        >
          {(Object.keys(STATUS_LABELS) as ProjectStatus[]).map((status) => (
            <NativeSelectOption key={status} value={status}>
              {STATUS_LABELS[status]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>

      {form.status === "ongoing" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="project-progress">Progression</Label>
            <span className="text-sm font-medium tabular-nums text-muted-foreground">{form.progress}%</span>
          </div>
          <input
            id="project-progress"
            type="range"
            min={0}
            max={100}
            step={1}
            value={form.progress}
            onChange={(event) => set("progress", Number(event.target.value))}
            className="w-full"
          />
        </div>
      )}

      {error && (
        <p role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={isSaving || isUploading}>
          {isSaving && <Spinner />}
          {isEditing ? "Enregistrer les informations" : "Créer le projet"}
        </Button>
      </div>
    </form>
  )
}

// Section 2 : recherche d'un utilisateur existant (citoyen ou agent) à associer au projet
function ParticipantsSection({ project, onChanged }: { project: Project; onChanged: (project: Project) => void }) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<ManagedUser[]>([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const term = query.trim()
    if (term.length < 2) {
      setResults([])
      return
    }
    const timer = setTimeout(() => {
      userAdminRepository.list({ q: term, limit: 5 }).then((page) => setResults(page.users)).catch(() => undefined)
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  const participantIds = new Set(project.participants.map((p) => p.id))

  const add = async (userId: number) => {
    setBusy(true)
    try {
      onChanged(await projectRepository.addParticipant(project.id, userId))
    } catch (cause) {
      notifyError(cause)
    } finally {
      setBusy(false)
    }
  }

  const remove = async (userId: number) => {
    setBusy(true)
    try {
      onChanged(await projectRepository.removeParticipant(project.id, userId))
    } catch (cause) {
      notifyError(cause)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-3">
      <Label htmlFor="participant-search">Associer un citoyen ou un agent</Label>
      <Input
        id="participant-search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Nom ou e-mail (2 caractères min.)"
        disabled={busy}
      />
      {results.length > 0 && (
        <ul className="divide-y divide-border/70 rounded-lg border border-border/70">
          {results.map((user) => {
            const already = participantIds.has(user.id)
            return (
              <li key={user.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <span className="min-w-0 truncate">
                  {user.firstName} {user.lastName} <span className="text-muted-foreground">· {user.email}</span>
                </span>
                <Button type="button" size="sm" variant="outline" disabled={already || busy} onClick={() => add(user.id)}>
                  <UserPlus className="size-3.5" />
                  {already ? "Déjà associé" : "Ajouter"}
                </Button>
              </li>
            )
          })}
        </ul>
      )}

      <div className="flex flex-wrap gap-2">
        {project.participants.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune personne associée.</p>
        ) : (
          project.participants.map((participant) => (
            <Badge key={participant.id} variant="secondary" className="gap-1.5">
              {participant.firstName} {participant.lastName}
              <button
                type="button"
                onClick={() => remove(participant.id)}
                disabled={busy}
                aria-label={`Retirer ${participant.firstName} ${participant.lastName}`}
                className="rounded-full hover:text-destructive"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))
        )}
      </div>
    </div>
  )
}

// Section 3 : entités externes existantes, + "ajout rapide" d'une nouvelle entité (créée et
// associée en un seul appel)
function ExternalEntitiesSection({ project, onChanged }: { project: Project; onChanged: (project: Project) => void }) {
  const [available, setAvailable] = useState<ExternalEntity[]>([])
  const [selectedId, setSelectedId] = useState("")
  const [newName, setNewName] = useState("")
  const [newType, setNewType] = useState("")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    externalEntityRepository.list().then(setAvailable).catch(() => undefined)
  }, [])

  const attachedIds = new Set(project.externalEntities.map((e) => e.id))
  const selectable = available.filter((entity) => !attachedIds.has(entity.id))

  const attachExisting = async () => {
    const id = Number(selectedId)
    if (!id) return
    setBusy(true)
    try {
      onChanged(await projectRepository.addExternalEntity(project.id, { externalEntityId: id }))
      setSelectedId("")
    } catch (cause) {
      notifyError(cause)
    } finally {
      setBusy(false)
    }
  }

  const quickAdd = async () => {
    const name = newName.trim()
    if (!name) return
    setBusy(true)
    try {
      const updated = await projectRepository.addExternalEntity(project.id, { name, type: newType.trim() || null })
      onChanged(updated)
      setNewName("")
      setNewType("")
      externalEntityRepository.list().then(setAvailable).catch(() => undefined)
    } catch (cause) {
      notifyError(cause)
    } finally {
      setBusy(false)
    }
  }

  const remove = async (entityId: number) => {
    setBusy(true)
    try {
      onChanged(await projectRepository.removeExternalEntity(project.id, entityId))
    } catch (cause) {
      notifyError(cause)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-3">
      <Label>Entité externe (groupe, société…)</Label>

      {selectable.length > 0 && (
        <div className="flex gap-2">
          <NativeSelect className="flex-1" value={selectedId} onChange={(event) => setSelectedId(event.target.value)} disabled={busy}>
            <NativeSelectOption value="">Choisir une entité existante…</NativeSelectOption>
            {selectable.map((entity) => (
              <NativeSelectOption key={entity.id} value={String(entity.id)}>
                {entity.type ? `${entity.name} (${entity.type})` : entity.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <Button type="button" variant="outline" disabled={!selectedId || busy} onClick={attachExisting}>
            Ajouter
          </Button>
        </div>
      )}

      <div className="flex flex-wrap items-end gap-2 rounded-lg border border-dashed border-border/70 p-3">
        <div className="min-w-0 flex-1 space-y-1">
          <Label htmlFor="entity-new-name" className="text-xs text-muted-foreground">Nouvelle entité — nom</Label>
          <Input id="entity-new-name" value={newName} onChange={(event) => setNewName(event.target.value)} placeholder="Terra Nova Travaux SA" disabled={busy} />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <Label htmlFor="entity-new-type" className="text-xs text-muted-foreground">Type (optionnel)</Label>
          <Input id="entity-new-type" value={newType} onChange={(event) => setNewType(event.target.value)} placeholder="Entreprise, association…" disabled={busy} />
        </div>
        <Button type="button" variant="outline" disabled={!newName.trim() || busy} onClick={quickAdd}>
          <Plus className="size-3.5" />
          Créer et ajouter
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {project.externalEntities.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune entité associée.</p>
        ) : (
          project.externalEntities.map((entity) => (
            <Badge key={entity.id} variant="outline" className="gap-1.5">
              {entity.type ? `${entity.name} · ${entity.type}` : entity.name}
              <button
                type="button"
                onClick={() => remove(entity.id)}
                disabled={busy}
                aria-label={`Retirer ${entity.name}`}
                className="rounded-full hover:text-destructive"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))
        )}
      </div>
    </div>
  )
}

function ProjectDialog({
  open,
  project,
  onClose,
  onSaved,
}: {
  open: boolean
  project: Project | null
  onClose: () => void
  onSaved: (project: Project, created: boolean) => void
}) {
  // Permet de passer de "création" à "édition" sans fermer le dialogue, dès que le projet a un id
  const [current, setCurrent] = useState<Project | null>(project)

  useEffect(() => {
    setCurrent(project)
  }, [project])

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{current ? "Modifier le projet" : "Nouveau projet"}</DialogTitle>
          <DialogDescription>
            {current
              ? "Les critiques des habitants et agents restent visibles sur la page du projet."
              : "Enregistrez les informations de base, puis associez des personnes et des entités."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <ProjectInfoSection
            project={current}
            onSaved={(saved, created) => {
              setCurrent(saved)
              onSaved(saved, created)
            }}
          />

          {current && (
            <>
              <div className="h-px bg-border/70" />
              <ParticipantsSection project={current} onChanged={setCurrent} />
              <div className="h-px bg-border/70" />
              <ExternalEntitiesSection project={current} onChanged={setCurrent} />
            </>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function ProjectsAdmin() {
  const [projects, setProjects] = useState<Project[] | null>(null)
  const [loadError, setLoadError] = useState("")
  // undefined = dialogue fermé ; null = création ; projet = modification
  const [editing, setEditing] = useState<Project | null | undefined>(undefined)
  const [deleting, setDeleting] = useState<Project | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  const load = useCallback(async () => {
    try {
      setProjects((await projectRepository.list()).sort(byCreatedDesc))
      setLoadError("")
    } catch (cause) {
      setLoadError(errorMessage(cause))
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- chargement initial depuis l'API
    load()
  }, [load])

  const handleSaved = (saved: Project, created: boolean) => {
    setProjects((current) => [...(current ?? []).filter((item) => item.id !== saved.id), saved].sort(byCreatedDesc))
    if (created) notifySuccess("Projet créé")
    else notifySuccess("Projet modifié")
  }

  const confirmDelete = async () => {
    if (!deleting) return
    const target = deleting
    setDeleting(null)
    setBusyId(target.id)
    try {
      await projectRepository.remove(target.id)
      setProjects((current) => current?.filter((item) => item.id !== target.id) ?? null)
      notifySuccess("Projet supprimé")
    } catch (cause) {
      notifyError(cause)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Administration</p>
          <h1 className="mt-1 text-3xl font-medium tracking-tight sm:text-4xl">Gérer les projets</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Créez les projets de la ville, associez des personnes et des entités externes, et suivez les avis déposés.
          </p>
        </div>
        <Button onClick={() => setEditing(null)} className="w-fit rounded-xl">
          <Plus aria-hidden="true" />
          Nouveau projet
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
      ) : !projects ? (
        <Skeleton className="h-72 rounded-2xl" />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/80 bg-card/70 shadow-sm backdrop-blur-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Projet</TableHead>
                <TableHead className="hidden md:table-cell">Statut</TableHead>
                <TableHead className="hidden lg:table-cell">Associés</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                    Aucun projet. Créez le premier avec « Nouveau projet ».
                  </TableCell>
                </TableRow>
              )}
              {projects.map((project) => {
                const imageSrc = resolveProjectImageUrl(project.imageUrl)
                return (
                  <TableRow key={project.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-accent text-accent-foreground">
                          {imageSrc ? (
                            <Image src={imageSrc} alt="" fill className="object-cover" unoptimized />
                          ) : (
                            <Building2 className="size-4" aria-hidden="true" />
                          )}
                        </span>
                        <p className="min-w-0 truncate font-medium">{project.title}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{STATUS_LABELS[project.status]}</TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                      {project.participants.length} personne(s) · {project.externalEntities.length} entité(s)
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setEditing(project)}
                          disabled={busyId === project.id}
                          aria-label={`Modifier ${project.title}`}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setDeleting(project)}
                          disabled={busyId === project.id}
                          aria-label={`Supprimer ${project.title}`}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <ProjectDialog
        open={editing !== undefined}
        project={editing ?? null}
        onClose={() => {
          setEditing(undefined)
          load()
        }}
        onSaved={handleSaved}
      />

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer « {deleting?.title} » ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est définitive et supprime aussi les avis déposés sur ce projet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
