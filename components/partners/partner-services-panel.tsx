"use client"

import { useCallback, useEffect, useState, type FormEvent } from "react"
import { CircleAlert, Pencil, Plus, Trash2 } from "lucide-react"

import { useLanguage } from "@/components/i18n/language-provider"
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
import {
  partnerServiceRepository,
  type NextActionType,
  type PartnerService,
} from "@/repository/partnerService.repository"

interface FormState {
  name: string
  category: string
  description: string
  address: string
  openingHours: string
  contactPhone: string
  contactEmail: string
  isAvailable: boolean
  availabilityNote: string
  nextActionLabel: string
  nextActionType: NextActionType | ""
  nextActionValue: string
  isActive: boolean
}

const emptyForm: FormState = {
  name: "",
  category: "",
  description: "",
  address: "",
  openingHours: "",
  contactPhone: "",
  contactEmail: "",
  isAvailable: true,
  availabilityNote: "",
  nextActionLabel: "",
  nextActionType: "",
  nextActionValue: "",
  isActive: true,
}

const toForm = (service: PartnerService): FormState => ({
  name: service.name,
  category: service.category ?? "",
  description: service.description ?? "",
  address: service.address ?? "",
  openingHours: service.openingHours ?? "",
  contactPhone: service.contactPhone ?? "",
  contactEmail: service.contactEmail ?? "",
  isAvailable: service.isAvailable,
  availabilityNote: service.availabilityNote ?? "",
  nextActionLabel: service.nextActionLabel ?? "",
  nextActionType: service.nextActionType ?? "",
  nextActionValue: service.nextActionValue ?? "",
  isActive: service.isActive,
})

function ServiceForm({
  service,
  onClose,
  onSaved,
}: {
  service: PartnerService | null
  onClose: () => void
  onSaved: (service: PartnerService, created: boolean) => void
}) {
  const { t } = useLanguage()
  const [form, setForm] = useState<FormState>(service ? toForm(service) : emptyForm)
  const [error, setError] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const isEditing = service !== null

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }))

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")

    const data = {
      name: form.name.trim(),
      category: form.category.trim() || null,
      description: form.description.trim() || null,
      address: form.address.trim() || null,
      openingHours: form.openingHours.trim() || null,
      contactPhone: form.contactPhone.trim() || null,
      contactEmail: form.contactEmail.trim() || null,
      isAvailable: form.isAvailable,
      availabilityNote: form.availabilityNote.trim() || null,
      nextActionLabel: form.nextActionLabel.trim() || null,
      nextActionType: form.nextActionType || null,
      nextActionValue: form.nextActionValue.trim() || null,
      isActive: form.isActive,
    }

    setIsSaving(true)
    try {
      const saved = isEditing
        ? await partnerServiceRepository.update(service.id, data)
        : await partnerServiceRepository.create(data)
      onSaved(saved, !isEditing)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("partnerDashboard.genericError"))
      setIsSaving(false)
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEditing ? t("partnerDashboard.dialogTitleEdit") : t("partnerDashboard.dialogTitleCreate")}</DialogTitle>
        <DialogDescription>{t("partnerDashboard.dialogDescription")}</DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="ps-name">{t("partnerDashboard.fieldName")}</Label>
            <Input id="ps-name" value={form.name} onChange={(event) => set("name", event.target.value)} required maxLength={150} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ps-category">{t("partnerDashboard.fieldCategory")}</Label>
            <Input
              id="ps-category"
              value={form.category}
              onChange={(event) => set("category", event.target.value)}
              maxLength={100}
              placeholder={t("partnerDashboard.fieldCategoryPlaceholder")}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="ps-description">{t("partnerDashboard.fieldDescription")}</Label>
          <Textarea id="ps-description" rows={3} value={form.description} onChange={(event) => set("description", event.target.value)} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="ps-address">{t("partnerDashboard.fieldAddress")}</Label>
            <Input id="ps-address" value={form.address} onChange={(event) => set("address", event.target.value)} maxLength={255} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ps-hours">{t("partnerDashboard.fieldHours")}</Label>
            <Input
              id="ps-hours"
              value={form.openingHours}
              onChange={(event) => set("openingHours", event.target.value)}
              maxLength={255}
              placeholder={t("partnerDashboard.fieldHoursPlaceholder")}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="ps-phone">{t("partnerDashboard.fieldPhone")}</Label>
            <Input id="ps-phone" value={form.contactPhone} onChange={(event) => set("contactPhone", event.target.value)} maxLength={30} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ps-email">{t("partnerDashboard.fieldEmail")}</Label>
            <Input id="ps-email" type="email" value={form.contactEmail} onChange={(event) => set("contactEmail", event.target.value)} maxLength={255} />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2.5">
          <Label htmlFor="ps-available">{t("partnerDashboard.availableSwitchLabel")}</Label>
          <Switch id="ps-available" checked={form.isAvailable} onCheckedChange={(checked) => set("isAvailable", checked)} />
        </div>
        {!form.isAvailable && (
          <div className="space-y-2">
            <Label htmlFor="ps-availability-note">{t("partnerDashboard.availabilityNoteLabel")}</Label>
            <Input
              id="ps-availability-note"
              value={form.availabilityNote}
              onChange={(event) => set("availabilityNote", event.target.value)}
              maxLength={255}
              placeholder={t("partnerDashboard.availabilityNotePlaceholder")}
            />
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="ps-action-type">{t("partnerDashboard.nextActionSelectLabel")}</Label>
            <NativeSelect
              id="ps-action-type"
              value={form.nextActionType}
              onChange={(event) => set("nextActionType", event.target.value as FormState["nextActionType"])}
            >
              <NativeSelectOption value="">{t("partnerDashboard.nextActionNone")}</NativeSelectOption>
              <NativeSelectOption value="phone">{t("partnerDashboard.nextActionPhone")}</NativeSelectOption>
              <NativeSelectOption value="email">{t("partnerDashboard.nextActionEmail")}</NativeSelectOption>
              <NativeSelectOption value="link">{t("partnerDashboard.nextActionLink")}</NativeSelectOption>
              <NativeSelectOption value="visit">{t("partnerDashboard.nextActionVisit")}</NativeSelectOption>
            </NativeSelect>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="ps-action-label">{t("partnerDashboard.nextActionLabelField")}</Label>
            <Input
              id="ps-action-label"
              value={form.nextActionLabel}
              onChange={(event) => set("nextActionLabel", event.target.value)}
              maxLength={100}
              placeholder={t("partnerDashboard.nextActionLabelPlaceholder")}
              disabled={!form.nextActionType}
            />
          </div>
        </div>
        {form.nextActionType && form.nextActionType !== "visit" && (
          <div className="space-y-2">
            <Label htmlFor="ps-action-value">
              {form.nextActionType === "phone"
                ? t("partnerDashboard.nextActionValuePhoneLabel")
                : form.nextActionType === "email"
                  ? t("partnerDashboard.nextActionValueEmailLabel")
                  : t("partnerDashboard.nextActionValueLinkLabel")}
            </Label>
            <Input id="ps-action-value" value={form.nextActionValue} onChange={(event) => set("nextActionValue", event.target.value)} maxLength={255} />
          </div>
        )}
        {form.nextActionType === "visit" && (
          <div className="space-y-2">
            <Label htmlFor="ps-action-value-visit">{t("partnerDashboard.nextActionValueVisitLabel")}</Label>
            <Input
              id="ps-action-value-visit"
              value={form.nextActionValue}
              onChange={(event) => set("nextActionValue", event.target.value)}
              maxLength={255}
              placeholder={t("partnerDashboard.nextActionValueVisitPlaceholder")}
            />
          </div>
        )}

        <div className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2.5">
          <Label htmlFor="ps-active">{t("partnerDashboard.publishedSwitchLabel")}</Label>
          <Switch id="ps-active" checked={form.isActive} onCheckedChange={(checked) => set("isActive", checked)} />
        </div>

        {error && (
          <p role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </p>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            {t("partnerDashboard.cancel")}
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving && <Spinner />}
            {isEditing ? t("partnerDashboard.save") : t("partnerDashboard.create")}
          </Button>
        </DialogFooter>
      </form>
    </>
  )
}

export function PartnerServicesPanel() {
  const { t } = useLanguage()
  const [services, setServices] = useState<PartnerService[] | null>(null)
  const [loadError, setLoadError] = useState("")
  // undefined = dialogue fermé ; null = création ; service = modification
  const [editing, setEditing] = useState<PartnerService | null | undefined>(undefined)
  const [deleting, setDeleting] = useState<PartnerService | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  const load = useCallback(async () => {
    try {
      setServices(await partnerServiceRepository.mine())
      setLoadError("")
    } catch (cause) {
      setLoadError(cause instanceof Error ? cause.message : t("partnerDashboard.genericError"))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- t() n'a pas besoin de redéclencher le chargement
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const handleSaved = (saved: PartnerService, created: boolean) => {
    setServices((current) => [saved, ...(current ?? []).filter((item) => item.id !== saved.id)])
    setEditing(undefined)
    toast.add({ title: created ? t("partnerDashboard.toastCreated") : t("partnerDashboard.toastUpdated"), type: "success" })
  }

  const toggleActive = async (service: PartnerService, isActive: boolean) => {
    setBusyId(service.id)
    try {
      const saved = await partnerServiceRepository.update(service.id, { isActive })
      setServices((current) => current?.map((item) => (item.id === saved.id ? saved : item)) ?? null)
    } catch (cause) {
      toast.add({ title: "Erreur", description: cause instanceof Error ? cause.message : t("partnerDashboard.genericError"), type: "error" })
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
      await partnerServiceRepository.remove(target.id)
      setServices((current) => current?.filter((item) => item.id !== target.id) ?? null)
      toast.add({ title: t("partnerDashboard.toastDeleted"), type: "success" })
    } catch (cause) {
      toast.add({ title: "Erreur", description: cause instanceof Error ? cause.message : t("partnerDashboard.genericError"), type: "error" })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">{t("partnerDashboard.eyebrow")}</p>
          <h1 className="mt-1 text-3xl font-medium tracking-tight sm:text-4xl">{t("partnerDashboard.title")}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{t("partnerDashboard.subtitle")}</p>
        </div>
        <Button onClick={() => setEditing(null)} className="w-fit rounded-xl">
          <Plus aria-hidden="true" />
          {t("partnerDashboard.newButton")}
        </Button>
      </section>

      {loadError ? (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
          <span className="flex items-start gap-2">
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {loadError}
          </span>
          <Button variant="outline" size="sm" onClick={load}>{t("partnerDashboard.retry")}</Button>
        </div>
      ) : !services ? (
        <Skeleton className="h-72 rounded-2xl" />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/80 bg-card/70 shadow-sm backdrop-blur-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("partnerDashboard.tableHeaderOffer")}</TableHead>
                <TableHead className="hidden md:table-cell">{t("partnerDashboard.tableHeaderAvailability")}</TableHead>
                <TableHead>{t("partnerDashboard.tableHeaderPublished")}</TableHead>
                <TableHead className="text-right">{t("partnerDashboard.tableHeaderActions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                    {t("partnerDashboard.emptyState")}
                  </TableCell>
                </TableRow>
              )}
              {services.map((service) => (
                <TableRow key={service.id} className={service.isActive ? undefined : "opacity-60"}>
                  <TableCell>
                    <p className="truncate font-medium">{service.name}</p>
                    {service.category && <p className="truncate text-xs text-muted-foreground">{service.category}</p>}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant={service.isAvailable ? "default" : "secondary"}>
                      {service.isAvailable ? t("partnerDashboard.available") : t("partnerDashboard.unavailable")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={service.isActive}
                      disabled={busyId === service.id}
                      onCheckedChange={(checked) => toggleActive(service, checked)}
                      aria-label={t(service.isActive ? "partnerDashboard.publishAriaOn" : "partnerDashboard.publishAriaOff", { name: service.name })}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setEditing(service)}
                        disabled={busyId === service.id}
                        aria-label={t("partnerDashboard.editAria", { name: service.name })}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleting(service)}
                        disabled={busyId === service.id}
                        aria-label={t("partnerDashboard.deleteAria", { name: service.name })}
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
          <ServiceForm service={editing ?? null} onClose={() => setEditing(undefined)} onSaved={handleSaved} />
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("partnerDashboard.deleteConfirmTitle", { name: deleting?.name ?? "" })}</AlertDialogTitle>
            <AlertDialogDescription>{t("partnerDashboard.deleteConfirmDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("partnerDashboard.deleteCancel")}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete}>
              {t("partnerDashboard.deleteConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
