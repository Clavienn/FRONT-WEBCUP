import { authorizedRequest } from "@/repository/auth.repository"

// Réseau de transport de Terra Nova (navettes entre les dômes, tram, téléphérique, bus) :
// lecture PUBLIQUE sous /api/public/transport (état des lignes, arrêts, trajet de remplacement, sans compte)
// et déclaration des interruptions par le personnel sous /api/transport (permission agent.transport.manage).

export type TransportMode = "bus" | "tram" | "shuttle" | "cable"
export type LineState = "normal" | "delayed" | "interrupted"
export type DisruptionKind = "interrupted" | "delayed"
export type AlternativeKind = "line" | "replacement_bus" | "walk" | "on_demand" | "other"
export const ALTERNATIVE_KINDS: AlternativeKind[] = ["line", "replacement_bus", "walk", "on_demand", "other"]

export type Localized = { fr: string; en: string }

export interface LineRef {
  code: string
  name: string
  mode: TransportMode
  // Couleur de la ligne : « #RRGGBB »
  color: string
}

export interface Alternative {
  kind: AlternativeKind
  kindLabel?: Localized
  // Phrase à lire telle quelle : « Prenez le tram T1 à Gare Centrale »
  text: string
  line?: string
  from?: string
  to?: string
  extraMinutes?: number
}

export interface SuggestedLine extends LineRef {
  servesStops: string[]
}

export interface Disruption {
  id: number
  status: "active" | "ended"
  line: LineRef
  kind: DisruptionKind
  kindLabel: Localized
  // « Ligne S1 interrompue entre Marché et Dôme Sud » : la phrase qu'un habitant comprend sans explication
  headline: Localized
  section: { from: string; to: string } | null
  // Arrêts où plus rien ne passe
  unservedStops: string[]
  reason: string
  alternatives: Alternative[]
  // Lignes qui desservent encore les arrêts touchés
  suggestedLines: SuggestedLine[]
  startsAt: string
  expectedEndAt: string | null
  endedAt: string | null
  alertId: number | null
  updatedAt: string
}

export interface StaffDisruption extends Disruption {
  createdBy: number | null
}

export interface LineInfo {
  days: Localized | null
  first: string | null
  last: string | null
  frequencyMinutes: number | null
  peaks: { from: string; to: string; every: number }[]
  travelMinutes: number
  accessible: boolean
  notes: string | null
}

export interface TransportLine extends LineRef {
  modeLabel: Localized
  stops: string[]
  zones: string[]
  zoneLabels: { fr: string[]; en: string[] }
  frequencyMinutes: number | null
  info: LineInfo
  state: LineState
  stateLabel: Localized
  disruptions: Disruption[]
}

export interface TransportStatus {
  summary: { interrupted: number; delayed: number; normal: number }
  // Les lignes touchées d'abord
  lines: TransportLine[]
}

export interface Departure {
  // « 14:32 », heure locale de Terra Nova
  time: string
  inMinutes: number
  // Premier départ du lendemain (service terminé pour aujourd'hui)
  tomorrow: boolean
}

export interface LineDetail extends TransportLine {
  timetable: LineInfo & {
    directions: { towards: string; stops: { name: string; minutesFromStart: number }[] }[]
    firstMinute: number | null
  }
  nextFromTermini: { from: string; towards: string; departures: Departure[] }[]
}

export interface StopSummary {
  name: string
  lines: string[]
  unservedBy: string[]
  // Au moins une ligne dessert encore l'arrêt
  served: boolean
}

export interface StopCard {
  stop: string
  now: number
  nowLabel: string
  // Une phrase qui dit quoi faire maintenant (ligne coupée et solution, prochain départ)
  advice: string
  lines: {
    line: LineRef
    directions: { towards: string; served: boolean; delayed: boolean; departures: Departure[] }[]
    disruption: Disruption | null
  }[]
}

export interface JourneyLeg {
  line: LineRef & { replacement: boolean }
  from: string
  to: string
  // Terminus dans le sens du trajet : ce qui est écrit sur le véhicule
  direction: string
  stops: number
  delayed: boolean
  departure: string | null
  arrival: string | null
}

export interface JourneyOption {
  summary: Localized
  legs: JourneyLeg[]
  transfers: number
  stops: number
  delayed: boolean
  usesReplacement: boolean
  departure: string | null
  arrival: string | null
  waitMinutes: number | null
  durationMinutes: number | null
  // Plus de service aujourd'hui : départ demain
  tomorrow: boolean
}

export interface Journey {
  from: string
  to: string
  // Le trajet habituel (réseau sans interruption) : est-il touché ?
  usual: {
    summary: Localized
    affected: boolean
    disruptions: { id: number; kind: DisruptionKind; headline: Localized; reason: string; expectedEndAt: string | null }[]
  } | null
  options: JourneyOption[]
  // Rien en transport en commun : ce que les services ont prévu d'autre (navette à la demande, à pied...)
  otherSolutions: Alternative[]
  message: Localized | null
}

// ── Personnel ──
export interface DisruptionItemInput {
  line: string
  kind: DisruptionKind
  // Les deux ou aucun : absents = toute la ligne
  fromStop?: string
  toStop?: string
  alternatives?: Alternative[]
}

export interface DeclareDisruptionsInput {
  reason: string
  // ISO, dans les 72 prochaines heures
  expectedEndAt?: string
  // true par défaut : une alerte à la population est publiée pour les quartiers desservis
  publishAlert?: boolean
  items: DisruptionItemInput[]
}

export interface DisruptionUpdateInput {
  kind?: DisruptionKind
  fromStop?: string | null
  toStop?: string | null
  reason?: string
  alternatives?: Alternative[]
  expectedEndAt?: string | null
}

export interface DisruptionPage {
  disruptions: StaffDisruption[]
  page: number
  limit: number
  total: number
}

// Événement temps réel (canal public) : le client relit l'état du réseau
export const TRANSPORT_UPDATED_EVENT = "transport:updated"

const json = (method: string, data: unknown): RequestInit => ({ method, body: JSON.stringify(data) })

export const transportRepository = {
  // ── Public, sans compte ──
  // lines : « Mes lignes », le client ne demande que celles-ci
  status: (lines?: string[]) =>
    authorizedRequest<TransportStatus>(`/public/transport${lines && lines.length > 0 ? `?lines=${lines.join(",")}` : ""}`),

  stops: () => authorizedRequest<StopSummary[]>("/public/transport/stops"),

  stopCard: (name: string) => authorizedRequest<StopCard>(`/public/transport/stops/${encodeURIComponent(name)}`),

  line: (code: string) => authorizedRequest<LineDetail>(`/public/transport/lines/${encodeURIComponent(code)}`),

  // Trajets qui évitent les interruptions. 400 unknown_stop : `suggestions` propose des arrêts proches.
  journey: (from: string, to: string) =>
    authorizedRequest<Journey>(`/public/transport/journey?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`),

  disruption: (id: number) => authorizedRequest<Disruption>(`/public/transport/disruptions/${id}`),

  // ── Personnel (agent.transport.manage, compte validé pour déclarer) ──
  staffLines: () => authorizedRequest<TransportLine[]>("/transport/lines"),

  listDisruptions: (status?: "active" | "ended", page = 1, limit = 10) =>
    authorizedRequest<DisruptionPage>(`/transport/disruptions?page=${page}&limit=${limit}${status ? `&status=${status}` : ""}`),

  declare: (input: DeclareDisruptionsInput) =>
    authorizedRequest<{ disruptions: Disruption[]; alert: unknown | null }>("/transport/disruptions", json("POST", input)),

  update: (id: number, input: DisruptionUpdateInput) => authorizedRequest<Disruption>(`/transport/disruptions/${id}`, json("PATCH", input)),

  end: (id: number) => authorizedRequest<{ disruption: Disruption; alert: unknown | null }>(`/transport/disruptions/${id}/end`, { method: "POST" }),
}
