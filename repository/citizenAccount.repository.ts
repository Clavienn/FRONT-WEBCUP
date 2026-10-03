import { authorizedRequest } from "@/repository/auth.repository"

export interface CitizenAccount {
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

export interface CitizenAccountPage {
  users: CitizenAccount[]
  page: number
  limit: number
  total: number
}

export interface CitizenAccountUpdate {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string | null
  address?: string | null
}

const json = (method: string, data: unknown): RequestInit => ({ method, body: JSON.stringify(data) })

export const citizenAccountRepository = {
  list(query: { q?: string; page?: number; limit?: number } = {}) {
    const params = new URLSearchParams()
    if (query.q) params.set("q", query.q)
    if (query.page) params.set("page", String(query.page))
    if (query.limit) params.set("limit", String(query.limit))
    const search = params.toString()
    return authorizedRequest<CitizenAccountPage>(`/citizen-accounts${search ? `?${search}` : ""}`)
  },

  update: (id: number, data: CitizenAccountUpdate) =>
    authorizedRequest<CitizenAccount>(`/citizen-accounts/${id}`, json("PATCH", data)),

  setStatus: (id: number, isActive: boolean) =>
    authorizedRequest<CitizenAccount>(`/citizen-accounts/${id}/status`, json("PATCH", { isActive })),
}
