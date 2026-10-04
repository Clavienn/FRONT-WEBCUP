import { authorizedRequest } from "@/repository/auth.repository"

export interface PartnerAccount {
  id: number
  email: string
  firstName: string
  lastName: string
  phone: string | null
  address: string | null
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
}

export interface PartnerAccountPage {
  users: PartnerAccount[]
  page: number
  limit: number
  total: number
}

export interface PartnerAccountInput {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  address?: string
}

const json = (method: string, data: unknown): RequestInit => ({ method, body: JSON.stringify(data) })

// Les comptes partenaires sont créés directement par un administrateur, pas par auto-inscription
export const partnerAccountRepository = {
  list(query: { q?: string; page?: number; limit?: number } = {}) {
    const params = new URLSearchParams()
    if (query.q) params.set("q", query.q)
    if (query.page) params.set("page", String(query.page))
    if (query.limit) params.set("limit", String(query.limit))
    const search = params.toString()
    return authorizedRequest<PartnerAccountPage>(`/partner-accounts${search ? `?${search}` : ""}`)
  },

  create: (data: PartnerAccountInput) => authorizedRequest<PartnerAccount>("/partner-accounts", json("POST", data)),

  setStatus: (id: number, isActive: boolean) =>
    authorizedRequest<PartnerAccount>(`/partner-accounts/${id}/status`, json("PATCH", { isActive })),
}
