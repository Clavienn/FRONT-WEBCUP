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
  // Avis des citoyens (renvoyés par GET /services et /services/:id)
  reviewsCount: number
  averageRating: number | null
  // L'utilisateur connecté a déjà laissé un avis sur ce service
  reviewedByMe: boolean
  // Nombre de demandes reçues : présent seulement quand la liste est triée par `mostUsed`
  requestsCount?: number
  // GET /services/:id seulement : 3 autres services à proposer (dès que le catalogue en compte au moins 4)
  related?: RelatedService[]
}

// Pourquoi ce service est proposé : sollicité par les mêmes habitants, très demandé, ou simple suite du catalogue
export type RelatedReason = "often_together" | "popular" | "catalog"

export interface RelatedService extends Omit<MunicipalService, "related"> {
  reason: RelatedReason
}

export interface ServiceReview {
  id: number
  serviceId: number
  rating: number
  comment: string
  authorName: string
  createdAt: string
}

export interface ServiceReviewPage {
  reviews: ServiceReview[]
  reviewsCount: number
  averageRating: number | null
  page: number
  limit: number
  total: number
}

// Avis du citoyen connecté
export interface MyServiceReview {
  id: number
  serviceId: number
  rating: number
  comment: string
  createdAt: string
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

export interface ServiceQuery {
  // Inclut les services désactivés (réservé aux gestionnaires, ignoré sinon par le serveur)
  all?: boolean
  // "mostUsed" : classe par nombre de demandes reçues, les plus demandés d'abord
  sort?: "mostUsed"
  // Tronque la liste déjà triée (ex. les 3 services les plus utilisés d'un tableau de bord)
  limit?: number
}

const json = (method: string, data: unknown): RequestInit => ({ method, body: JSON.stringify(data) })

function query(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.set(key, String(value))
  }
  const encoded = search.toString()
  return encoded ? `?${encoded}` : ""
}

export const serviceRepository = {
  list: (options: ServiceQuery = {}) =>
    authorizedRequest<MunicipalService[]>(
      `/services${query({ all: options.all, sort: options.sort, limit: options.limit })}`
    ),

  get: (id: number) => authorizedRequest<MunicipalService>(`/services/${id}`),

  listReviews: (id: number, page = 1, limit = 5) =>
    authorizedRequest<ServiceReviewPage>(`/services/${id}/reviews?page=${page}&limit=${limit}`),

  // Avis déjà déposés par le citoyen connecté (sert à masquer le bouton « Donner mon avis »)
  myReviews: () => authorizedRequest<MyServiceReview[]>("/services/reviews/mine"),

  createReview: (id: number, data: { rating: number; comment: string }, headers?: Record<string, string>) =>
    authorizedRequest<MyServiceReview>(`/services/${id}/reviews`, { ...json("POST", data), headers }),

  create: (data: ServiceCreation) => authorizedRequest<MunicipalService>("/services", json("POST", data)),

  update: (id: number, data: Partial<ServiceInput>) =>
    authorizedRequest<MunicipalService>(`/services/${id}`, json("PATCH", data)),

  remove: (id: number) => authorizedRequest<void>(`/services/${id}`, { method: "DELETE" }),
}
