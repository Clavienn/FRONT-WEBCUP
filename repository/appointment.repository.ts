import { authorizedRequest } from "@/repository/auth.repository"

export type AppointmentStatus = "open" | "booked" | "cancelled"

export const APPOINTMENT_STATUSES: AppointmentStatus[] = ["open", "booked", "cancelled"]

export interface AppointmentPerson {
  id: number
  firstName: string
  lastName: string
}

export interface AppointmentServiceRef {
  id: number
  code: string
  name: string
}

// Un créneau : ce qu'il faut pour choisir sans ambiguïté et se préparer
export interface AppointmentSlot {
  id: number
  startAt: string
  endAt: string
  location: string | null
  instructions: string | null
  service: AppointmentServiceRef | null
  agent: AppointmentPerson | null
}

export interface CitizenAppointment extends AppointmentSlot {
  status: AppointmentStatus
  subject: string | null
}

export interface AgentAppointment extends CitizenAppointment {
  citizen: AppointmentPerson | null
}

export interface SlotPage {
  slots: AppointmentSlot[]
  limit: number
  offset: number
  total: number
}

export interface AppointmentPage<T> {
  appointments: T[]
  limit: number
  offset: number
  total: number
}

export interface NewSlotInput {
  serviceId?: number | null
  startAt: string
  endAt: string
  location?: string | null
  instructions?: string | null
}

const json = (method: string, data?: unknown): RequestInit => ({ method, body: data === undefined ? undefined : JSON.stringify(data) })

function query(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.set(key, String(value))
  }
  const encoded = search.toString()
  return encoded ? `?${encoded}` : ""
}

/** Créneaux ouverts et à venir, filtrables par service. */
function listOpenSlots(serviceId?: number): Promise<SlotPage> {
  return authorizedRequest<SlotPage>(`/appointments/slots${query({ serviceId })}`)
}

/** Historique des rendez-vous réservés (et annulés) du citoyen connecté. */
function listMine(): Promise<AppointmentPage<CitizenAppointment>> {
  return authorizedRequest<AppointmentPage<CitizenAppointment>>("/appointments/mine")
}

/** Réservation : le serveur refuse (409) si le créneau vient d'être pris par un autre habitant. */
function book(id: number, subject?: string | null): Promise<CitizenAppointment> {
  return authorizedRequest<CitizenAppointment>(`/appointments/${id}/book`, json("POST", { subject }))
}

function cancelMine(id: number): Promise<void> {
  return authorizedRequest<void>(`/appointments/mine/${id}`, { method: "DELETE" })
}

/** Ouverture d'un créneau par l'agent connecté. */
function createSlot(input: NewSlotInput): Promise<AgentAppointment> {
  return authorizedRequest<AgentAppointment>("/appointments", json("POST", input))
}

/** Créneaux et rendez-vous de l'agent connecté. */
function listMySlots(status?: AppointmentStatus): Promise<AppointmentPage<AgentAppointment>> {
  return authorizedRequest<AppointmentPage<AgentAppointment>>(`/appointments${query({ status })}`)
}

function cancelSlot(id: number): Promise<AgentAppointment> {
  return authorizedRequest<AgentAppointment>(`/appointments/${id}/cancel`, { method: "PATCH" })
}

/** Remet un créneau annulé en circulation (citizenId/subject sont effacés côté serveur). */
function reopenSlot(id: number): Promise<AgentAppointment> {
  return authorizedRequest<AgentAppointment>(`/appointments/${id}/reopen`, { method: "PATCH" })
}

function deleteSlot(id: number): Promise<void> {
  return authorizedRequest<void>(`/appointments/${id}`, { method: "DELETE" })
}

export const appointmentRepository = {
  listOpenSlots,
  listMine,
  book,
  cancelMine,
  createSlot,
  listMySlots,
  cancelSlot,
  reopenSlot,
  deleteSlot,
}
