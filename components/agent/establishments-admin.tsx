"use client"

import { useCallback, useEffect, useState, type FormEvent } from "react"
import { CircleAlert, MapPin, Pencil, Plus, Trash2 } from "lucide-react"

import { ServiceIcon } from "@/components/services/service-icon"
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
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { establishmentRepository, type Establishment } from "@/repository/establishment.repository"
import { serviceRepository, type MunicipalService } from "@/repository/service.repository"

const errorMessage = (cause: unknown) => (cause instanceof Error ? cause.message : "Une erreur est survenue")

const notifyError = (cause: unknown) => toast.add({ title: "Erreur", description: errorMessage(cause), type: "error" })

const notifySuccess = (title: string) => toast.add({ title, type: "success" })

const byName = (a: Establishment, b: Establishment) => a.name.localeCompare(b.name)

interface FormState {
  name: string
  // "" = aucun service
  serviceId: string
  address: string
  description: string
  isOpen: boolean
  statusNote: string
  isActive: boolean
}

const emptyForm: FormState = {
  name: "",
  serviceId: "",
  address: "",
  description: "",
  isOpen: true,
  statusNote: "",
  isActive: true,
}

const toForm = (item: Establishment): FormState => ({
  name: item.name,
  serviceId: item.service ? String(item.service.id) : "",
  address: item.address,
  description: item.description ?? "",
  isOpen: item.isOpen,
  statusNote: item.statusNote ?? "",
  isActive: item.isActive ?? true,
})

function EstablishmentForm({
  establishment,
  services,
  onClose,
  onSaved,
}: {
  establishment: Establishment | null
  services: MunicipalService[]
  onClose: () => void
  onSaved: (establishment: Establishment, created: boolean) => void
}) {
  const [form, setForm] = useState<FormState>(establishment ? toForm(establishment) : emptyForm)
  const [error, setError] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const isEditing = establishment !== null

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }))

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")

    const data = {
      name: form.name.trim(),
      serviceId: form.serviceId ? Number(form.serviceId) : null,
      address: form.address.trim(),
      description: form.description.trim() || null,
      isOpen: form.isOpen,
      statusNote: form.statusNote.trim() || null,
      isActive: form.isActive,
    }

    setIsSaving(true)
    try {
      const saved = isEditing
        ? await establishmentRepository.update(establishment.id, data)
        : await establishmentRepository.create(data)
      onSaved(saved, !isEditing)
    } catch (cause) {
      setError(errorMessage(cause))
      setIsSaving(false)
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEditing ? "Modifier le lieu" : "Nouveau lieu"}</DialogTitle>
        <DialogDescription>
          Le lieu sera visible des habitants s’il est actif.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="establishment-name">Nom</Label>
            <Input
              id="establishment-name"
              value={form.name}
              onChange={(event) => set("name", event.target.value)}
              required
              maxLength={150}
              placeholder="Hôpital Sainte-Marie"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="establishment-service">Service municipal</Label>
            <NativeSelect
              id="establishment-service"
              className="w-full"
              value={form.serviceId}
              onChange={(event) => set("serviceId", event.target.value)}
            >
              <NativeSelectOption value="">Aucun service</NativeSelectOption>
              {services.map((service) => (
                <NativeSelectOption key={service.id} value={String(service.id)}>
                  {service.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="establishment-address">Adresse</Label>
          <Input
            id="establishment-address"
            value={form.address}
            onChange={(event) => set("address", event.target.value)}
            required
            maxLength={255}
            placeholder="12 rue de la République"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="establishment-description">Description</Label>
          <Textarea
            id="establishment-description"
            rows={3}
            value={form.description}
            onChange={(event) => set("description", event.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2.5">
            <Label htmlFor="establishment-open">Ouvert actuellement</Label>
            <Switch id="establishment-open" checked={form.isOpen} onCheckedChange={(checked) => set("isOpen", checked)} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2.5">
            <Label htmlFor="establishment-active">Visible des habitants</Label>
            <Switch id="establishment-active" checked={form.isActive} onCheckedChange={(checked) => set("isActive", checked)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="establishment-status-note">Statut actuel (optionnel)</Label>
          <Input
            id="establishment-status-note"
            value={form.statusNote}
            onChange={(event) => set("statusNote", event.target.value)}
            maxLength={255}
            placeholder="Fermé à 18h"
          />
        </div>

        {error && (
          <p role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </p>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Annuler
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving && <Spinner />}
            {isEditing ? "Enregistrer" : "Créer le lieu"}
          </Button>
        </DialogFooter>
      </form>
    </>
  )
}

function EstablishmentDialog({
  open,
  establishment,
  services,
  onClose,
  onSaved,
}: {
  open: boolean
  establishment: Establishment | null
  services: MunicipalService[]
  onClose: () => void
  onSaved: (establishment: Establishment, created: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <EstablishmentForm establishment={establishment} services={services} onClose={onClose} onSaved={onSaved} />
      </DialogContent>
    </Dialog>
  )
}

export function EstablishmentsAdmin() {
  const [establishments, setEstablishments] = useState<Establishment[] | null>(null)
  const [services, setServices] = useState<MunicipalService[]>([])
  const [loadError, setLoadError] = useState("")
  // undefined = dialogue fermé ; null = création ; établissement = modification
  const [editing, setEditing] = useState<Establishment | null | undefined>(undefined)
  const [deleting, setDeleting] = useState<Establishment | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  const load = useCallback(async () => {
    try {
      setEstablishments((await establishmentRepository.list(true)).sort(byName))
      setLoadError("")
    } catch (cause) {
      setLoadError(errorMessage(cause))
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- chargement initial depuis l'API
    load()
    serviceRepository.list(true).then(setServices).catch(() => undefined)
  }, [load])

  const handleSaved = (saved: Establishment, created: boolean) => {
    setEstablishments((current) => [...(current ?? []).filter((item) => item.id !== saved.id), saved].sort(byName))
    setEditing(undefined)
    notifySuccess(created ? "Lieu créé" : "Lieu modifié")
  }

  const toggleOpen = async (item: Establishment, isOpen: boolean) => {
    setBusyId(item.id)
    try {
      const saved = await establishmentRepository.update(item.id, { isOpen })
      setEstablishments((current) => current?.map((row) => (row.id === saved.id ? saved : row)) ?? null)
    } catch (cause) {
      notifyError(cause)
    } finally {
      setBusyId(null)
    }
  }

  const confirmDelete = async () => {
    if (!deleting) return
    const target = deleting
    setDeleting(null)
    setBusyId(target.id)
    try {
      await establishmentRepository.remove(target.id)
      setEstablishments((current) => current?.filter((item) => item.id !== target.id) ?? null)
      notifySuccess("Lieu supprimé")
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
          <p className="text-sm font-medium text-primary">Console des agents</p>
          <h1 className="mt-1 text-3xl font-medium tracking-tight sm:text-4xl">Gérer les établissements</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Adresse et statut des lieux affichés aux habitants (hôpitaux, urgences, services municipaux…).
          </p>
        </div>
        <Button onClick={() => setEditing(null)} className="w-fit rounded-xl">
          <Plus aria-hidden="true" />
          Nouveau lieu
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
      ) : !establishments ? (
        <Skeleton className="h-72 rounded-2xl" />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/80 bg-card/70 shadow-sm backdrop-blur-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lieu</TableHead>
                <TableHead className="hidden md:table-cell">Service</TableHead>
                <TableHead className="hidden lg:table-cell">Adresse</TableHead>
                <TableHead>Ouvert</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {establishments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    Aucun lieu. Créez le premier avec « Nouveau lieu ».
                  </TableCell>
                </TableRow>
              )}
              {establishments.map((item) => (
                <TableRow key={item.id} className={item.isActive ? undefined : "opacity-60"}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
                        <ServiceIcon name={item.service?.icon ?? null} className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{item.name}</p>
                        {!item.isActive && <Badge variant="outline" className="mt-1">Masqué</Badge>}
                        {item.statusNote && <p className="truncate text-xs text-muted-foreground">{item.statusNote}</p>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{item.service?.name ?? "—"}</TableCell>
                  <TableCell className="hidden max-w-xs truncate lg:table-cell">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
                      {item.address}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={item.isOpen}
                      disabled={busyId === item.id}
                      onCheckedChange={(checked) => toggleOpen(item, checked)}
                      aria-label={`${item.isOpen ? "Fermer" : "Ouvrir"} ${item.name}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setEditing(item)}
                        disabled={busyId === item.id}
                        aria-label={`Modifier ${item.name}`}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleting(item)}
                        disabled={busyId === item.id}
                        aria-label={`Supprimer ${item.name}`}
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

      <EstablishmentDialog
        open={editing !== undefined}
        establishment={editing ?? null}
        services={services}
        onClose={() => setEditing(undefined)}
        onSaved={handleSaved}
      />

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer « {deleting?.name} » ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est définitive. Pour simplement le masquer aux habitants, désactivez-le plutôt.
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
