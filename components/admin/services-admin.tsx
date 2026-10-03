"use client"

import { useCallback, useEffect, useState, type FormEvent } from "react"
import { CircleAlert, Pencil, Plus, Trash2 } from "lucide-react"

import { ServiceIcon, serviceIcons } from "@/components/services/service-icon"
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
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { serviceRepository, type MunicipalService } from "@/repository/service.repository"

const errorMessage = (cause: unknown) => (cause instanceof Error ? cause.message : "Une erreur est survenue")

const notifyError = (cause: unknown) =>
  toast.add({ title: "Erreur", description: errorMessage(cause), type: "error" })

const notifySuccess = (title: string) => toast.add({ title, type: "success" })

const bySortOrder = (a: MunicipalService, b: MunicipalService) =>
  a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)

interface FormState {
  code: string
  name: string
  description: string
  icon: string
  sortOrder: string
  isActive: boolean
}

const emptyForm: FormState = { code: "", name: "", description: "", icon: "", sortOrder: "0", isActive: true }

const toForm = (service: MunicipalService): FormState => ({
  code: service.code,
  name: service.name,
  description: service.description ?? "",
  icon: service.icon ?? "",
  sortOrder: String(service.sortOrder),
  isActive: service.isActive,
})

// Formulaire monté à chaque ouverture du dialogue : son état repart donc toujours de zéro
function ServiceForm({
  service,
  onClose,
  onSaved,
}: {
  service: MunicipalService | null
  onClose: () => void
  onSaved: (service: MunicipalService, created: boolean) => void
}) {
  const [form, setForm] = useState<FormState>(service ? toForm(service) : emptyForm)
  const [error, setError] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const isEditing = service !== null

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }))

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")

    const sortOrder = Number(form.sortOrder)
    if (!Number.isInteger(sortOrder)) {
      setError("L’ordre d’affichage doit être un nombre entier.")
      return
    }

    const data = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      icon: form.icon.trim() || null,
      isActive: form.isActive,
      sortOrder,
    }

    setIsSaving(true)
    try {
      const saved = isEditing
        ? await serviceRepository.update(service.id, data)
        : await serviceRepository.create({ code: form.code.trim().toLowerCase(), ...data })
      onSaved(saved, !isEditing)
    } catch (cause) {
      setError(errorMessage(cause))
      setIsSaving(false)
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEditing ? "Modifier le service" : "Nouveau service"}</DialogTitle>
        <DialogDescription>
          {isEditing
            ? "Le code d’un service ne peut pas être modifié."
            : "Le service sera visible des habitants s’il est actif."}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="service-code">Code</Label>
            <Input
              id="service-code"
              value={form.code}
              onChange={(event) => set("code", event.target.value)}
              disabled={isEditing}
              required
              maxLength={50}
              pattern="[a-zA-Z][a-zA-Z0-9_\-]{1,49}"
              title="2 à 50 caractères : lettres, chiffres, - et _, en commençant par une lettre"
              placeholder="eau_energie"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="service-name">Nom</Label>
            <Input
              id="service-name"
              value={form.name}
              onChange={(event) => set("name", event.target.value)}
              required
              maxLength={150}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="service-description">Description</Label>
          <Textarea
            id="service-description"
            rows={4}
            value={form.description}
            onChange={(event) => set("description", event.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="service-icon">Icône</Label>
            <div className="flex items-center gap-2">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
                <ServiceIcon name={form.icon.trim() || null} className="size-4" />
              </span>
              <Input
                id="service-icon"
                value={form.icon}
                onChange={(event) => set("icon", event.target.value)}
                maxLength={255}
                placeholder="heart-pulse"
              />
            </div>
            <p className="text-xs text-muted-foreground">Icônes : {Object.keys(serviceIcons).join(", ")}.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="service-order">Ordre d’affichage</Label>
            <Input
              id="service-order"
              type="number"
              step={1}
              value={form.sortOrder}
              onChange={(event) => set("sortOrder", event.target.value)}
              required
            />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2.5">
          <Label htmlFor="service-active">Service actif</Label>
          <Switch id="service-active" checked={form.isActive} onCheckedChange={(checked) => set("isActive", checked)} />
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
            {isEditing ? "Enregistrer" : "Créer le service"}
          </Button>
        </DialogFooter>
      </form>
    </>
  )
}

function ServiceDialog({
  open,
  service,
  onClose,
  onSaved,
}: {
  open: boolean
  service: MunicipalService | null
  onClose: () => void
  onSaved: (service: MunicipalService, created: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <ServiceForm service={service} onClose={onClose} onSaved={onSaved} />
      </DialogContent>
    </Dialog>
  )
}

export function ServicesAdmin() {
  const [services, setServices] = useState<MunicipalService[] | null>(null)
  const [loadError, setLoadError] = useState("")
  // undefined = dialogue fermé ; null = création ; service = modification
  const [editing, setEditing] = useState<MunicipalService | null | undefined>(undefined)
  const [deleting, setDeleting] = useState<MunicipalService | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  const load = useCallback(async () => {
    try {
      setServices((await serviceRepository.list(true)).sort(bySortOrder))
      setLoadError("")
    } catch (cause) {
      setLoadError(errorMessage(cause))
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- chargement initial depuis l'API
    load()
  }, [load])

  const handleSaved = (saved: MunicipalService, created: boolean) => {
    setServices((current) =>
      [...(current ?? []).filter((item) => item.id !== saved.id), saved].sort(bySortOrder)
    )
    setEditing(undefined)
    notifySuccess(created ? "Service créé" : "Service modifié")
  }

  const toggleActive = async (service: MunicipalService, isActive: boolean) => {
    setBusyId(service.id)
    try {
      const saved = await serviceRepository.update(service.id, { isActive })
      setServices((current) => current?.map((item) => (item.id === saved.id ? saved : item)) ?? null)
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
      await serviceRepository.remove(target.id)
      setServices((current) => current?.filter((item) => item.id !== target.id) ?? null)
      notifySuccess("Service supprimé")
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
          <h1 className="mt-1 text-3xl font-medium tracking-tight sm:text-4xl">Gérer les services</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Créez, modifiez, désactivez ou supprimez les services municipaux affichés aux habitants.
          </p>
        </div>
        <Button onClick={() => setEditing(null)} className="w-fit rounded-xl">
          <Plus aria-hidden="true" />
          Nouveau service
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
      ) : !services ? (
        <Skeleton className="h-72 rounded-2xl" />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/80 bg-card/70 shadow-sm backdrop-blur-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead className="hidden md:table-cell">Code</TableHead>
                <TableHead className="hidden text-right sm:table-cell">Ordre</TableHead>
                <TableHead>Actif</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    Aucun service. Créez le premier avec « Nouveau service ».
                  </TableCell>
                </TableRow>
              )}
              {services.map((service) => (
                <TableRow key={service.id} className={service.isActive ? undefined : "opacity-60"}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-accent-foreground">
                        <ServiceIcon name={service.icon} className="size-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{service.name}</p>
                        {!service.isActive && <Badge variant="outline" className="mt-1">Désactivé</Badge>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden font-mono text-xs md:table-cell">{service.code}</TableCell>
                  <TableCell className="hidden text-right tabular-nums sm:table-cell">{service.sortOrder}</TableCell>
                  <TableCell>
                    <Switch
                      checked={service.isActive}
                      disabled={busyId === service.id}
                      onCheckedChange={(checked) => toggleActive(service, checked)}
                      aria-label={`${service.isActive ? "Désactiver" : "Activer"} ${service.name}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setEditing(service)}
                        disabled={busyId === service.id}
                        aria-label={`Modifier ${service.name}`}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleting(service)}
                        disabled={busyId === service.id}
                        aria-label={`Supprimer ${service.name}`}
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

      <ServiceDialog
        open={editing !== undefined}
        service={editing ?? null}
        onClose={() => setEditing(undefined)}
        onSaved={handleSaved}
      />

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer « {deleting?.name} » ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est définitive. Pour simplement masquer le service aux habitants, désactivez-le plutôt.
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
