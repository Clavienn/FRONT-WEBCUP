import { authorizedRequest } from "@/repository/auth.repository"

export interface MunicipalService {
  id: number
  code: string
  name: string
  description: string | null
  icon: string | null
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface ServiceInput {
  name: string
  description: string | null
  icon: string | null
  isActive: boolean
  sortOrder: number
}

// Le code est obligatoire à la création et immuable ensuite
export interface ServiceCreation extends ServiceInput {
  code: string
}

const json = (method: string, data: unknown): RequestInit => ({ method, body: JSON.stringify(data) })

export const serviceRepository = {
  // all: inclut les services désactivés (réservé aux gestionnaires, ignoré sinon par le serveur)
  list: (all = false) => authorizedRequest<MunicipalService[]>(`/services${all ? "?all=true" : ""}`),

  create: (data: ServiceCreation) => authorizedRequest<MunicipalService>("/services", json("POST", data)),

  update: (id: number, data: Partial<ServiceInput>) =>
    authorizedRequest<MunicipalService>(`/services/${id}`, json("PATCH", data)),

  remove: (id: number) => authorizedRequest<void>(`/services/${id}`, { method: "DELETE" }),
}
