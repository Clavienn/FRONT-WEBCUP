import { authorizedRequest } from "@/repository/auth.repository"

export interface EstablishmentService {
  id: number
  code: string
  name: string
  icon: string | null
}

export interface Establishment {
  id: number
  name: string
  service: EstablishmentService | null
  description: string | null
  address: string
  isOpen: boolean
  statusNote: string | null
  // Absent de la vue publique (citoyen) : réservé aux gestionnaires
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
}

export interface EstablishmentInput {
  name: string
  address: string
  serviceId?: number | null
  description?: string | null
  isOpen?: boolean
  statusNote?: string | null
  isActive?: boolean
}

export type EstablishmentUpdate = Partial<EstablishmentInput>

const json = (method: string, data: unknown): RequestInit => ({ method, body: JSON.stringify(data) })

export const establishmentRepository = {
  // all: inclut les lieux désactivés et les champs de gestion (réservé aux gestionnaires, ignoré sinon par le serveur)
  list: (all = false) => authorizedRequest<Establishment[]>(`/establishments${all ? "?all=true" : ""}`),

  get: (id: number) => authorizedRequest<Establishment>(`/establishments/${id}`),

  create: (data: EstablishmentInput) => authorizedRequest<Establishment>("/establishments", json("POST", data)),

  update: (id: number, data: EstablishmentUpdate) =>
    authorizedRequest<Establishment>(`/establishments/${id}`, json("PATCH", data)),

  remove: (id: number) => authorizedRequest<void>(`/establishments/${id}`, { method: "DELETE" }),
}
