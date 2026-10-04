import { authorizedRequest } from "@/repository/auth.repository"

// Alertes à la population (montée des eaux, incendie, coupure...) : /api/public/alerts (lecture, SANS compte)
// et /api/alerts (publication par le personnel validé). Différentes d'une annonce : elles visent des
// QUARTIERS, ont un niveau de gravité, des CONSIGNES, une durée de validité et une fin d'alerte.

export type AlertZone = "north" | "south" | "east" | "west" | "center"
export type AlertZoneOrAll = AlertZone | "all"
export const ALERT_ZONES: AlertZone[] = ["north", "south", "east", "west", "center"]

export type AlertHazard =
  | "flood"
  | "heavy_rain"
  | "cyclone"
  | "fire"
  | "power_outage"
  | "water_outage"
  | "security"
  | "health"
  | "other"
export const ALERT_HAZARDS: AlertHazard[] = [
  "flood",
  "heavy_rain",
  "cyclone",
  "fire",
  "power_outage",
  "water_outage",
  "security",
  "health",
  "other",
]

// Du moins au plus grave
export type AlertSeverity = "info" | "watch" | "warning" | "emergency"
export const ALERT_SEVERITIES: AlertSeverity[] = ["info", "watch", "warning", "emergency"]
// Dès « warning », l'alerte DOIT contenir au moins une consigne (que faire ?)
export const SEVERITY_REQUIRES_ACTION: Record<AlertSeverity, boolean> = {
  info: false,
  watch: false,
  warning: true,
  emergency: true,
}

export type AlertColor = "blue" | "yellow" | "orange" | "red"
export type Localized = { fr: string; en: string }

export interface AlertUpdateEntry {
  at: string
  message: string
  severity: AlertSeverity | null
}

// Vue publique : tout ce qu'il faut pour comprendre en un coup d'œil (danger, lieu, gravité, QUE FAIRE)
export interface PublicAlert {
  id: number
  status: "active" | "ended"
  severity: AlertSeverity
  severityLabel: Localized
  // Couleur universelle du niveau : bleu, jaune, orange, rouge
  color: AlertColor
  // Faut-il agir ? C'est la première chose à montrer
  actionRequired: boolean
  hazard: AlertHazard
  hazardLabel: Localized
  zones: AlertZoneOrAll[]
  zoneLabels: { fr: string[]; en: string[] }
  // Ligne prête à afficher dans un bandeau
  headline: Localized
  title: string
  message: string
  // Ce qu'il faut FAIRE, en phrases courtes, dans l'ordre
  instructions: string[]
  endMessage: string | null
  issuer: Localized
  startsAt: string
  expiresAt: string
  endedAt: string | null
  updatedAt: string
  // Change à chaque mise à jour : l'alerte est ré-affichée même si elle avait été fermée
  version: number
  // L'évolution de la situation, la plus récente d'abord
  updates: AlertUpdateEntry[]
}

export interface PublicAlerts {
  zone: AlertZone | null
  active: PublicAlert[]
  recentlyEnded: PublicAlert[]
}

export interface ZoneInfo {
  code: AlertZoneOrAll
  label: Localized
}

export interface StaffAlert extends PublicAlert {
  createdBy: { id: number; firstName: string; lastName: string } | null
  createdAt: string
}

export interface AlertPage {
  alerts: StaffAlert[]
  page: number
  limit: number
  total: number
}

export interface NewAlertInput {
  title: string
  hazard: AlertHazard
  severity: AlertSeverity
  zones: AlertZoneOrAll[]
  message: string
  instructions: string[]
  expiresInMinutes?: number
}

export interface AlertUpdateInput {
  message: string
  severity?: AlertSeverity
  instructions?: string[]
  expiresInMinutes?: number
}

// Événements temps réel (canal public) : la charge utile est la vue publique de l'alerte
export type AlertEvent = "alert:published" | "alert:updated" | "alert:ended"

const json = (method: string, data: unknown): RequestInit => ({ method, body: JSON.stringify(data) })

export const alertRepository = {
  // ── Public : aucune session requise ──
  // Sans quartier : toutes les alertes en vigueur. Avec : celles du quartier ET celles de toute la ville.
  listPublic: (zone?: AlertZone | null) =>
    authorizedRequest<PublicAlerts>(`/public/alerts${zone ? `?zone=${zone}` : ""}`),

  zones: () => authorizedRequest<ZoneInfo[]>("/public/alerts/zones"),

  // ── Personnel (permission agent.alerts.manage, compte validé pour publier) ──
  listStaff: (status?: "active" | "ended", page = 1, limit = 20) =>
    authorizedRequest<AlertPage>(`/alerts?page=${page}&limit=${limit}${status ? `&status=${status}` : ""}`),

  publish: (input: NewAlertInput) => authorizedRequest<StaffAlert>("/alerts", json("POST", input)),

  update: (id: number, input: AlertUpdateInput) => authorizedRequest<StaffAlert>(`/alerts/${id}/updates`, json("POST", input)),

  end: (id: number, endMessage: string) => authorizedRequest<StaffAlert>(`/alerts/${id}/end`, json("POST", { endMessage })),
}
