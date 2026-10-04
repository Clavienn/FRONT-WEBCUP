import type { AlertZone, PublicAlert } from "@/repository/alert.repository"
import { authorizedRequest } from "@/repository/auth.repository"

// Signalements d'urgence et d'incident (/api/signalements). Ce n'est PAS une demande ordinaire : la
// priorité vient du type, un délai de prise en compte est visé, et la file du personnel est triée par
// attention. Spécification : api/README.md, « Signalements (urgences et incidents) ».

export type SignalementType =
  | "medical"
  | "fire"
  | "flood"
  | "cyclone"
  | "accident"
  | "security"
  | "breakdown"
  | "heavy_rain"
  | "other"

export type SignalementPriority = "urgent" | "high" | "medium" | "low"
export const SIGNALEMENT_PRIORITIES: SignalementPriority[] = ["urgent", "high", "medium", "low"]

export type SignalementStatus = "new" | "acknowledged" | "in_progress" | "resolved" | "cancelled"
export const SIGNALEMENT_STATUSES: SignalementStatus[] = ["new", "acknowledged", "in_progress", "resolved", "cancelled"]

export interface SignalementTypeInfo {
  code: SignalementType
  label: { fr: string; en: string }
  defaultPriority: SignalementPriority
  // Urgence vitale : formulaire minimal et consigne d'appeler aussi les secours
  emergency: boolean
}

// Vue du déclarant
export interface Signalement {
  id: number
  type: SignalementType
  label: { fr: string; en: string }
  priority: SignalementPriority
  status: SignalementStatus
  title: string
  description: string | null
  location: string
  contactPhone: string | null
  createdAt: string
  acknowledged: boolean
  acknowledgedAt: string | null
  resolvedAt: string | null
  // « Marie S. » : rassure le déclarant sur la prise en charge
  handledBy: string | null
}

export interface SignalementTimelineEntry {
  at: string
  status: SignalementStatus
  action: string
}

export interface SignalementDetail extends Signalement {
  timeline: SignalementTimelineEntry[]
}

export interface SignalementReceipt extends Signalement {
  // Le même envoi vient d'être reçu une seconde fois (double clic, réseau instable) : à afficher comme réussi
  duplicate: boolean
  urgent: boolean
  acknowledgeTargetMinutes: number
  // Consigne à afficher en évidence (appeler aussi les secours pour une urgence vitale)
  guidance: string
  // Alertes à la population en vigueur : à afficher juste après l'envoi (les consignes sont peut-être déjà connues)
  activeAlerts: PublicAlert[]
}

export interface NewSignalementInput {
  type: SignalementType
  location: string
  title?: string
  description?: string
  contactPhone?: string
  lifeThreatening?: boolean
  // Quartier du signalement (mêmes codes que les alertes, sans « all »)
  zone?: AlertZone
}

// Vue du personnel
export interface StaffPerson {
  id: number
  firstName: string
  lastName: string
}

export interface StaffSignalement extends Signalement {
  emergency: boolean
  reporter: StaffPerson | null
  assignedTo: number | null
  assignee: StaffPerson | null
  ageMinutes: number
  slaMinutes: number
  overdue: boolean
}

// Une ligne d'historique couvre un changement d'état, de priorité ou d'assignation :
// les champs non concernés valent null
export interface SignalementHistoryEntry {
  at: string
  // created, acknowledged, status, priority, assigned, update, cancelled_by_reporter...
  action: string
  oldStatus: SignalementStatus | null
  newStatus: SignalementStatus | null
  oldPriority: SignalementPriority | null
  newPriority: SignalementPriority | null
  assignedTo: number | null
  note: string | null
  author: StaffPerson | null
}

export interface StaffSignalementDetail extends StaffSignalement {
  history: SignalementHistoryEntry[]
}

// Concentration de signalements du même type dans un quartier : candidat à une alerte à la population
export interface SignalementHotspot {
  zone: AlertZone
  type: SignalementType
  count: number
  latestAt: string
  // Une alerte est déjà en vigueur pour ce quartier : inutile de prévenir
  alertActive: boolean
}

export interface SignalementSummary {
  open: number
  unacknowledged: number
  urgentOpen: number
  overdue: number
  unassigned: number
  mine: number
  oldestUnacknowledgedMinutes: number | null
  byPriority: Partial<Record<SignalementPriority, number>>
  byType: Partial<Record<SignalementType, number>>
  byZone?: Partial<Record<AlertZone, number>>
  hotspots?: SignalementHotspot[]
  // Nombre d'alertes à la population en vigueur
  activeAlerts?: number
}

export interface SignalementPage {
  signalements: StaffSignalement[]
  page: number
  limit: number
  total: number
}

export interface StaffQuery {
  // « open » (défaut), « closed », « all », ou une liste d'états (« new,in_progress »)
  status?: string
  priority?: SignalementPriority
  type?: SignalementType
  assigned?: "me" | "none"
  overdue?: boolean
  q?: string
  page?: number
  limit?: number
}

export interface SignalementUpdateInput {
  status?: SignalementStatus
  priority?: SignalementPriority
  assignedTo?: number | null
  note?: string | null
}

// Événements temps réel du canal « /staff » : sans description, téléphone ni identité du déclarant
export interface SignalementEvent {
  id: number
  type: SignalementType
  priority: SignalementPriority
  status: SignalementStatus
  title: string
  location: string
  createdAt: string
  assignedTo: number | null
}

const json = (method: string, data: unknown): RequestInit => ({ method, body: JSON.stringify(data) })

function search(params: Record<string, string | number | boolean | undefined>): string {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) if (value !== undefined && value !== "") query.set(key, String(value))
  const encoded = query.toString()
  return encoded ? `?${encoded}` : ""
}

export const signalementRepository = {
  // ── Déclarant ──
  types: () => authorizedRequest<SignalementTypeInfo[]>("/signalements/types"),

  // Volontairement SANS jeton anti-robots ni délai minimal : une personne en détresse n'attend pas.
  // Ne jamais envoyer `priority` (ignorée par l'API).
  create: (input: NewSignalementInput) => authorizedRequest<SignalementReceipt>("/signalements", json("POST", input)),

  listMine: (status: "open" | "closed" | "all" = "all") =>
    authorizedRequest<Signalement[] | { signalements: Signalement[] }>(`/signalements/mine${search({ status })}`).then(
      (data) => (Array.isArray(data) ? data : data.signalements)
    ),

  getMine: (id: number) => authorizedRequest<SignalementDetail>(`/signalements/mine/${id}`),

  cancelMine: (id: number) => authorizedRequest<Signalement>(`/signalements/mine/${id}/cancel`, { method: "POST" }),

  // ── Personnel ──
  summary: () => authorizedRequest<SignalementSummary>("/signalements/summary"),

  // La liste est DÉJÀ triée par attention côté serveur (urgent non pris > en retard > important > ...) :
  // ne jamais la retrier par date côté client.
  listStaff: (query: StaffQuery = {}) =>
    authorizedRequest<SignalementPage>(`/signalements${search({ ...query, sort: "attention" })}`),

  getStaff: (id: number) => authorizedRequest<StaffSignalementDetail>(`/signalements/${id}`),

  // « Je m'en occupe » ; 409 already_acknowledged si un autre agent l'a déjà pris
  acknowledge: (id: number, note?: string) =>
    authorizedRequest<StaffSignalement>(`/signalements/${id}/acknowledge`, json("POST", { note })),

  update: (id: number, input: SignalementUpdateInput) =>
    authorizedRequest<StaffSignalementDetail>(`/signalements/${id}`, json("PATCH", input)),
}
