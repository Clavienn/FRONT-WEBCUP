"use client"

import { useCallback, useEffect, useState } from "react"
import { CalendarClock, CircleAlert, Info, MapPin, RefreshCw } from "lucide-react"

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
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import {
  appointmentRepository,
  type AppointmentSlot,
  type AppointmentStatus,
  type CitizenAppointment,
} from "@/repository/appointment.repository"
import { serviceRepository, type MunicipalService } from "@/repository/service.repository"

type LoadState = "loading" | "error" | "ready"

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { dateStyle: "full" })
const timeFormatter = new Intl.DateTimeFormat("fr-FR", { timeStyle: "short" })

// Date complète + heures précises : le créneau doit se lire sans aucune place au doute.
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

function SlotDetails({ slot }: { slot: AppointmentSlot }) {
  const { t } = useLanguage()
  const agentName = personName(slot.agent)
  return (
    <div className="space-y-2 rounded-xl border border-border/70 bg-background/55 p-4 text-sm">
      <p className="flex items-start gap-2 font-medium">
        <CalendarClock className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
        {formatRange(slot.startAt, slot.endAt)}
      </p>
      <p className="text-muted-foreground">
        {agentName ? t("appointments.withAgent", { name: agentName }) : t("appointments.noAgent")}
        {slot.service && ` · ${slot.service.name}`}
      </p>
      <p className="flex items-start gap-2 text-muted-foreground">
        <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        {slot.location || t("appointments.noLocation")}
      </p>
      {slot.instructions && (
        <p className="flex items-start gap-2 text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            <span className="font-medium text-foreground">{t("appointments.instructionsLabel")}</span>{" "}
            {slot.instructions}
          </span>
        </p>
      )}
    </div>
  )
}

interface BookingDialogProps {
  slot: AppointmentSlot | null
  onClose: () => void
  onBooked: () => void
}

function BookingDialog({ slot, onClose, onBooked }: BookingDialogProps) {
  const { t } = useLanguage()
  const [subject, setSubject] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setSubject("")
    setError("")
  }, [slot])

  if (!slot) return null

  const handleSubmit = async () => {
    if (submitting) return
    setSubmitting(true)
    setError("")
    try {
      await appointmentRepository.book(slot.id, subject.trim() || null)
      toast.add({ title: t("appointments.booked"), description: t("appointments.bookedDescription"), type: "success" })
      onBooked()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("appointments.bookError"))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={slot !== null} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("appointments.confirmTitle")}</DialogTitle>
          <DialogDescription>{t("appointments.confirmDescription")}</DialogDescription>
        </DialogHeader>

        <SlotDetails slot={slot} />

        <div className="space-y-1.5">
          <Label htmlFor="appointment-subject">{t("appointments.subjectLabel")}</Label>
          <Textarea
            id="appointment-subject"
            rows={2}
            value={subject}
            maxLength={500}
            placeholder={t("appointments.subjectPlaceholder")}
            onChange={(event) => setSubject(event.target.value)}
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            {t("appointments.confirmCancelLabel")}
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Spinner />}
            {submitting ? t("appointments.confirmSubmittingLabel") : t("appointments.confirmSubmitLabel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function SlotCard({ slot, onChoose }: { slot: AppointmentSlot; onChoose: () => void }) {
  const { t } = useLanguage()
  const agentName = personName(slot.agent)
  return (
    <li className="rounded-xl border border-border/80 bg-background/55 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">{formatRange(slot.startAt, slot.endAt)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {agentName ? t("appointments.withAgent", { name: agentName }) : t("appointments.noAgent")}
            {" · "}
            {slot.service?.name ?? t("appointments.noService")}
          </p>
          {slot.location && (
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
              {slot.location}
            </p>
          )}
        </div>
        <Button size="sm" onClick={onChoose}>
          {t("appointments.chooseLabel")}
        </Button>
      </div>
    </li>
  )
}

function MyAppointmentCard({ appointment, onCancelled }: { appointment: CitizenAppointment; onCancelled: () => void }) {
  const { t } = useLanguage()
  const [cancelling, setCancelling] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const agentName = personName(appointment.agent)
  const canCancel = appointment.status === "booked" && new Date(appointment.startAt) > new Date()

  const handleCancel = async () => {
    setCancelling(true)
    try {
      await appointmentRepository.cancelMine(appointment.id)
      toast.add({ title: t("appointments.cancelled"), type: "success" })
      setConfirmOpen(false)
      onCancelled()
    } catch (cause) {
      toast.add({
        title: cause instanceof Error ? cause.message : t("appointments.cancelError"),
        type: "error",
      })
    } finally {
      setCancelling(false)
    }
  }

  return (
    <li className="rounded-xl border border-border/80 bg-background/55 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">{formatRange(appointment.startAt, appointment.endAt)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {agentName ? t("appointments.withAgent", { name: agentName }) : t("appointments.noAgent")}
            {" · "}
            {appointment.service?.name ?? t("appointments.noService")}
          </p>
        </div>
        <Badge variant="outline" className={STATUS_STYLES[appointment.status]}>
          {appointment.status === "booked" ? t("appointments.statusBooked") : t("appointments.statusCancelled")}
        </Badge>
      </div>

      <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
        <p className="flex items-start gap-2">
          <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {appointment.location || t("appointments.noLocation")}
        </p>
        {appointment.instructions && (
          <p className="flex items-start gap-2">
            <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>
              <span className="font-medium text-foreground">{t("appointments.instructionsLabel")}</span>{" "}
              {appointment.instructions}
            </span>
          </p>
        )}
        <p>{appointment.subject || t("appointments.subjectNoneLabel")}</p>
      </div>

      {canCancel && (
        <Button
          variant="outline"
          size="sm"
          className="mt-3 text-destructive hover:text-destructive"
          onClick={() => setConfirmOpen(true)}
        >
          {t("appointments.cancelLabel")}
        </Button>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("appointments.cancelConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("appointments.cancelConfirmDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>{t("appointments.cancelConfirmBack")}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={cancelling} onClick={handleCancel}>
              {cancelling && <Spinner />}
              {t("appointments.cancelConfirmAction")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  )
}

export function CitizenAppointments() {
  const { t } = useLanguage()
  const [services, setServices] = useState<MunicipalService[] | null>(null)
  const [serviceFilter, setServiceFilter] = useState("")

  const [slotsState, setSlotsState] = useState<LoadState>("loading")
  const [slots, setSlots] = useState<AppointmentSlot[]>([])
  const [slotsError, setSlotsError] = useState("")
  const [selectedSlot, setSelectedSlot] = useState<AppointmentSlot | null>(null)

  const [mineState, setMineState] = useState<LoadState>("loading")
  const [mine, setMine] = useState<CitizenAppointment[]>([])
  const [mineError, setMineError] = useState("")

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

  const loadSlots = useCallback(() => {
    appointmentRepository
      .listOpenSlots(serviceFilter ? Number(serviceFilter) : undefined)
      .then((page) => {
        setSlots(page.slots)
        setSlotsError("")
        setSlotsState("ready")
      })
      .catch((cause) => {
        setSlotsError(cause instanceof Error ? cause.message : "")
        setSlotsState("error")
      })
  }, [serviceFilter])

  const loadMine = useCallback(() => {
    appointmentRepository
      .listMine()
      .then((page) => {
        setMine(page.appointments)
        setMineError("")
        setMineState("ready")
      })
      .catch((cause) => {
        setMineError(cause instanceof Error ? cause.message : "")
        setMineState("error")
      })
  }, [])

  useEffect(() => {
    setSlotsState("loading")
    loadSlots()
  }, [loadSlots])

  useEffect(() => {
    loadMine()
  }, [loadMine])

  const handleBooked = () => {
    setSelectedSlot(null)
    loadSlots()
    loadMine()
  }

  return (
    <div className="space-y-8">
      <section aria-labelledby="appointments-title">
        <div>
          <h1 id="appointments-title" className="text-3xl font-medium tracking-tight sm:text-4xl">
            {t("appointments.title")}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{t("appointments.subtitle")}</p>
        </div>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="appointments-service-filter">{t("appointments.serviceLabel")}</Label>
            <NativeSelect
              id="appointments-service-filter"
              value={serviceFilter}
              onChange={(event) => setServiceFilter(event.target.value)}
            >
              <NativeSelectOption value="">{t("appointments.serviceAll")}</NativeSelectOption>
              {services?.map((service) => (
                <NativeSelectOption key={service.id} value={String(service.id)}>
                  {service.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </div>
          <Button variant="ghost" size="icon" onClick={loadSlots} aria-label={t("appointments.retryLabel")}>
            <RefreshCw aria-hidden="true" />
          </Button>
        </div>

        <div className="mt-4" aria-live="polite">
          {slotsState === "loading" && (
            <div className="space-y-3" aria-hidden="true">
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
          )}

          {slotsState === "error" && (
            <div className="flex flex-col items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-3">
              <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
                <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {slotsError || t("appointments.errorLoad")}
              </p>
              <Button variant="outline" size="sm" onClick={loadSlots}>
                <RefreshCw aria-hidden="true" />
                {t("appointments.retryLabel")}
              </Button>
            </div>
          )}

          {slotsState === "ready" && slots.length === 0 && (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border/80 px-4 py-10 text-center">
              <CalendarClock className="size-6 text-muted-foreground/70" aria-hidden="true" />
              <p className="text-sm font-medium">{t("appointments.emptySlotsTitle")}</p>
              <p className="max-w-md text-sm leading-6 text-muted-foreground">{t("appointments.emptySlotsDescription")}</p>
            </div>
          )}

          {slotsState === "ready" && slots.length > 0 && (
            <ul className="space-y-3">
              {slots.map((slot) => (
                <SlotCard key={slot.id} slot={slot} onChoose={() => setSelectedSlot(slot)} />
              ))}
            </ul>
          )}
        </div>
      </section>

      <section aria-labelledby="my-appointments-title" className="rounded-2xl border border-border/80 bg-card/75 p-5 shadow-sm backdrop-blur-sm sm:p-6">
        <h2 id="my-appointments-title" className="text-lg font-semibold">
          {t("appointments.mineTitle")}
        </h2>

        <div className="mt-4" aria-live="polite">
          {mineState === "loading" && (
            <div className="space-y-3" aria-hidden="true">
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          )}

          {mineState === "error" && (
            <p role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
              <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              {mineError || t("appointments.errorLoad")}
            </p>
          )}

          {mineState === "ready" && mine.length === 0 && (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border/80 px-4 py-10 text-center">
              <p className="text-sm font-medium">{t("appointments.mineEmptyTitle")}</p>
              <p className="max-w-md text-sm leading-6 text-muted-foreground">{t("appointments.mineEmptyDescription")}</p>
            </div>
          )}

          {mineState === "ready" && mine.length > 0 && (
            <ul className="space-y-3">
              {mine.map((appointment) => (
                <MyAppointmentCard key={appointment.id} appointment={appointment} onCancelled={loadMine} />
              ))}
            </ul>
          )}
        </div>
      </section>

      <BookingDialog slot={selectedSlot} onClose={() => setSelectedSlot(null)} onBooked={handleBooked} />
    </div>
  )
}
