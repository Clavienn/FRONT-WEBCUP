import { authorizedRequest } from "@/repository/auth.repository"

export type NextActionType = "phone" | "email" | "visit" | "link"

export interface PartnerService {
  id: number
  name: string
  description: string | null
  category: string | null
  address: string | null
  openingHours: string | null
  contactPhone: string | null
  contactEmail: string | null
  isAvailable: boolean
  availabilityNote: string | null
  nextActionLabel: string | null
  nextActionType: NextActionType | null
  nextActionValue: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  partner: { id: number; firstName: string; lastName: string } | null
}

export interface PartnerServiceInput {
  name: string
  description?: string | null
  category?: string | null
  address?: string | null
  openingHours?: string | null
  contactPhone?: string | null
  contactEmail?: string | null
  isAvailable?: boolean
  availabilityNote?: string | null
  nextActionLabel?: string | null
  nextActionType?: NextActionType | null
  nextActionValue?: string | null
  isActive?: boolean
}

export type PartnerRequestStatus = "pending" | "contacted" | "closed"

export interface PartnerServiceRequest {
  id: number
  message: string | null
  status: PartnerRequestStatus
  createdAt: string
  updatedAt: string
  service: { id: number; name: string } | null
  user: { id: number; firstName: string; lastName: string } | null
}

const json = (method: string, data: unknown): RequestInit => ({ method, body: JSON.stringify(data) })

// Catalogue vu par les habitants + gestion par le partenaire propriétaire
export const partnerServiceRepository = {
  list: () => authorizedRequest<PartnerService[]>("/partner-services"),

  get: (id: number) => authorizedRequest<PartnerService>(`/partner-services/${id}`),

  // Les offres du partenaire connecté, actives ou non
  mine: () => authorizedRequest<PartnerService[]>("/partner-services/mine"),

  create: (data: PartnerServiceInput) => authorizedRequest<PartnerService>("/partner-services", json("POST", data)),

  update: (id: number, data: Partial<PartnerServiceInput>) =>
    authorizedRequest<PartnerService>(`/partner-services/${id}`, json("PATCH", data)),

  remove: (id: number) => authorizedRequest<void>(`/partner-services/${id}`, { method: "DELETE" }),

  // L'habitant contacte le partenaire au sujet d'une offre
  contact: (id: number, message: string | null, headers?: Record<string, string>) =>
    authorizedRequest<PartnerServiceRequest>(`/partner-services/${id}/requests`, {
      ...json("POST", { message }),
      headers,
    }),
}

// Tableau de bord du partenaire : demandes reçues sur ses offres
export const partnerRequestRepository = {
  list: () => authorizedRequest<PartnerServiceRequest[]>("/partner-requests"),

  setStatus: (id: number, status: PartnerRequestStatus) =>
    authorizedRequest<PartnerServiceRequest>(`/partner-requests/${id}`, json("PATCH", { status })),
}
