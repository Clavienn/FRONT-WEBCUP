"use client"

import { useCallback, useEffect, useState } from "react"
import { CircleAlert, Inbox, MapPin, RefreshCw } from "lucide-react"

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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import {
  appointmentRepository,
  type AgentAppointment,
  type AppointmentStatus,
} from "@/repository/appointment.repository"
import { serviceRepository, type MunicipalService } from "@/repository/service.repository"

type LoadState = "loading" | "error" | "ready"

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { dateStyle: "full" })
const timeFormatter = new Intl.DateTimeFormat("fr-FR", { timeStyle: "short" })

function formatRange(startAt: string, endAt: string) {
  return `${dateFormatter.format(new Date(startAt))} · ${timeFormatter.format(new Date(startAt))}–${timeFormatter.format(new Date(endAt))}`
}

function personName(person: { firstName: string; lastName: string } | null) {
  return person ? [person.firstName, person.lastName].filter(Boolean).join(" ") : null
}

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  open: "border-sky-500/30 bg-sky-500/10 text-sky-800 dark:text-sky-200",
  booked: "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
  cancelled: "border-destructive/30 bg-destructive/10 text-destructive",
}

const FILTERS: Array<AppointmentStatus | "all"> = ["all", "open", "booked", "cancelled"]

// Format attendu par <input type="datetime-local"> : pas de secondes, pas de fuseau
function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

interface NewSlotFormProps {
  onCreated: () => void
}

function NewSlotForm({ onCreated }: NewSlotFormProps) {
  const { t } = useLanguage()
  const [services, setServices] = useState<MunicipalService[] | null>(null)
  const [serviceId, setServiceId] = useState("")
  const [startAt, setStartAt] = useState("")
  const [endAt, setEndAt] = useState("")
  const [location, setLocation] = useState("")
  const [instructions, setInstructions] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    serviceRepository
      .list()
      .then((data) => !cancelled && setServices(data))
      .catch(() => !cancelled && setServices([]))
    return () => {
      cancelled = true
    }
  }, [])

  const minStart = toLocalInputValue(new Date())

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting) return

    if (!startAt || !endAt) return setError(t("agentAppointments.datesRequired"))
    const start = new Date(startAt)
    const end = new Date(endAt)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return setError(t("agentAppointments.datesRequired"))
    if (end <= start) return setError(t("agentAppointments.invalidRange"))

    setError("")
    setSubmitting(true)
    try {
      await appointmentRepository.createSlot({
        serviceId: serviceId ? Number(serviceId) : null,
        startAt: start.toISOString(),
        endAt: end.toISOString(),
        location: location.trim() || null,
        instructions: instructions.trim() || null,
      })
      setStartAt("")
      setEndAt("")
      setLocation("")
      setInstructions("")
      setServiceId("")
      toast.add({ title: t("agentAppointments.created"), type: "success" })
      onCreated()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("agentAppointments.createError"))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="slot-start">{t("agentAppointments.startLabel")}</Label>
          <Input
            id="slot-start"
            type="datetime-local"
            value={startAt}
            min={minStart}
            onChange={(event) => setStartAt(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="slot-end">{t("agentAppointments.endLabel")}</Label>
          <Input
            id="slot-end"
            type="datetime-local"
            value={endAt}
            min={startAt || minStart}
            onChange={(event) => setEndAt(event.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="slot-service">{t("agentAppointments.serviceLabel")}</Label>
        <NativeSelect id="slot-service" className="w-full" value={serviceId} onChange={(event) => setServiceId(event.target.value)}>
          <NativeSelectOption value="">{t("agentAppointments.serviceNone")}</NativeSelectOption>
          {services?.map((service) => (
            <NativeSelectOption key={service.id} value={String(service.id)}>
              {service.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="slot-location">{t("agentAppointments.locationLabel")}</Label>
        <Input
          id="slot-location"
          value={location}
          maxLength={255}
          placeholder={t("agentAppointments.locationPlaceholder")}
          onChange={(event) => setLocation(event.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="slot-instructions">{t("agentAppointments.instructionsLabel")}</Label>
        <Textarea
          id="slot-instructions"
          rows={3}
          value={instructions}
          maxLength={5000}
          placeholder={t("agentAppointments.instructionsPlaceholder")}
          onChange={(event) => setInstructions(event.target.value)}
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" disabled={submitting}>
        {submitting && <Spinner />}
        {submitting ? t("agentAppointments.submittingLabel") : t("agentAppointments.submitLabel")}
      </Button>
    </form>
  )
}

interface SlotRowProps {
  appointment: AgentAppointment
  onChanged: () => void
}

function SlotRow({ appointment, onChanged }: SlotRowProps) {
  const { t } = useLanguage()
  const [cancelOpen, setCancelOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const citizenName = personName(appointment.citizen)

  const handleCancel = async () => {
    setBusy(true)
    try {
      await appointmentRepository.cancelSlot(appointment.id)
      toast.add({ title: t("agentAppointments.updated"), type: "success" })
      setCancelOpen(false)
      onChanged()
    } catch (cause) {
      toast.add({ title: cause instanceof Error ? cause.message : t("agentAppointments.updateError"), type: "error" })
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async () => {
    setBusy(true)
    try {
      await appointmentRepository.deleteSlot(appointment.id)
      toast.add({ title: t("agentAppointments.updated"), type: "success" })
      setDeleteOpen(false)
      onChanged()
    } catch (cause) {
      toast.add({ title: cause instanceof Error ? cause.message : t("agentAppointments.updateError"), type: "error" })
    } finally {
      setBusy(false)
    }
  }

  return (
    <li className="rounded-xl border border-border/80 bg-background/55 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">{formatRange(appointment.startAt, appointment.endAt)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {appointment.service?.name ?? t("agentAppointments.noService")}
            {" · "}
            {citizenName
              ? t("agentAppointments.withCitizen", { name: citizenName })
              : t("agentAppointments.noCitizen")}
          </p>
          {appointment.location && (
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
              {appointment.location}
            </p>
          )}
          {appointment.subject && (
            <p className="mt-1 text-xs text-muted-foreground">
              {t("agentAppointments.subjectLabel")} : {appointment.subject}
            </p>
          )}
        </div>
        <Badge variant="outline" className={STATUS_STYLES[appointment.status]}>
          {t(`agentAppointments.status${appointment.status[0].toUpperCase()}${appointment.status.slice(1)}`)}
        </Badge>
      </div>

      {appointment.status !== "cancelled" && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setCancelOpen(true)}>
            {t("agentAppointments.cancelLabel")}
          </Button>
          {appointment.status === "open" && (
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteOpen(true)}>
              {t("agentAppointments.deleteLabel")}
            </Button>
          )}
        </div>
      )}

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("agentAppointments.cancelConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {appointment.status === "booked"
                ? t("agentAppointments.cancelConfirmDescriptionBooked")
                : t("agentAppointments.cancelConfirmDescriptionOpen")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>{t("agentAppointments.cancelConfirmBack")}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={busy} onClick={handleCancel}>
              {busy && <Spinner />}
              {t("agentAppointments.cancelConfirmAction")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("agentAppointments.deleteConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("agentAppointments.deleteConfirmDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>{t("agentAppointments.cancelConfirmBack")}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={busy} onClick={handleDelete}>
              {busy && <Spinner />}
              {t("agentAppointments.deleteConfirmAction")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  )
}

export function AgentAppointmentsPanel() {
  const { t } = useLanguage()
  const [formOpen, setFormOpen] = useState(false)
  const [state, setState] = useState<LoadState>("loading")
  const [appointments, setAppointments] = useState<AgentAppointment[]>([])
  const [error, setError] = useState("")
  const [status, setStatus] = useState<AppointmentStatus | "all">("all")

  const load = useCallback(() => {
    appointmentRepository
      .listMySlots(status === "all" ? undefined : status)
      .then((page) => {
        setAppointments(page.appointments)
        setError("")
        setState("ready")
      })
      .catch((cause) => {
        setError(cause instanceof Error ? cause.message : "")
        setState("error")
      })
  }, [status])

  useEffect(() => {
    load()
  }, [load])

  const refresh = useCallback(() => {
    setState("loading")
    load()
  }, [load])

  const handleCreated = () => {
    setFormOpen(false)
    refresh()
  }

  const filterLabel = (value: AppointmentStatus | "all") =>
    value === "all" ? t("agentAppointments.filterAll") : t(`agentAppointments.filter${value[0].toUpperCase()}${value.slice(1)}`)

  return (
    <section aria-labelledby="agent-appointments-title" className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 id="agent-appointments-title" className="text-3xl font-medium tracking-tight sm:text-4xl">
            {t("agentAppointments.title")}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{t("agentAppointments.subtitle")}</p>
        </div>
        <Button variant={formOpen ? "outline" : "default"} onClick={() => setFormOpen((open) => !open)} aria-expanded={formOpen}>
          {formOpen ? t("agentAppointments.formCancelLabel") : t("agentAppointments.newLabel")}
        </Button>
      </div>

      {formOpen && (
        <div className="rounded-xl border border-border/70 bg-background/55 p-4">
          <NewSlotForm onCreated={handleCreated} />
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <NativeSelect value={status} onChange={(event) => setStatus(event.target.value as AppointmentStatus | "all")}>
          {FILTERS.map((value) => (
            <NativeSelectOption key={value} value={value}>
              {filterLabel(value)}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <Button variant="ghost" size="icon" onClick={refresh} aria-label={t("agentAppointments.refreshLabel")}>
          <RefreshCw aria-hidden="true" />
        </Button>
      </div>

      <div aria-live="polite">
        {state === "loading" && (
          <div className="space-y-3" aria-hidden="true">
            <Skeleton className="h-28 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-xl" />
          </div>
        )}

        {state === "error" && (
          <p role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {error || t("agentAppointments.errorLoad")}
          </p>
        )}

        {state === "ready" && appointments.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border/80 px-4 py-10 text-center">
            <Inbox className="size-6 text-muted-foreground/70" aria-hidden="true" />
            <p className="text-sm font-medium">{t("agentAppointments.emptyTitle")}</p>
            <p className="max-w-md text-sm leading-6 text-muted-foreground">{t("agentAppointments.emptyDescription")}</p>
          </div>
        )}

        {state === "ready" && appointments.length > 0 && (
          <ul className="space-y-3">
            {appointments.map((appointment) => (
              <SlotRow key={appointment.id} appointment={appointment} onChanged={refresh} />
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
