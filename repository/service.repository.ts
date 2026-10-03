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

const json = (method: string, data: unknown): RequestInit => ({ method, body: JSON.stringify(data) })

export const serviceRepository = {
  // all: inclut les services désactivés (réservé aux gestionnaires, ignoré sinon par le serveur)
  list: (all = false) => authorizedRequest<MunicipalService[]>(`/services${all ? "?all=true" : ""}`),

  get: (id: number) => authorizedRequest<MunicipalService>(`/services/${id}`),

  listReviews: (id: number, page = 1, limit = 5) =>
    authorizedRequest<ServiceReviewPage>(`/services/${id}/reviews?page=${page}&limit=${limit}`),

  // Avis déjà déposés par le citoyen connecté (sert à masquer le bouton « Donner mon avis »)
  myReviews: () => authorizedRequest<MyServiceReview[]>("/services/reviews/mine"),

  createReview: (id: number, data: { rating: number; comment: string }) =>
    authorizedRequest<MyServiceReview>(`/services/${id}/reviews`, json("POST", data)),

  create: (data: ServiceCreation) => authorizedRequest<MunicipalService>("/services", json("POST", data)),

  update: (id: number, data: Partial<ServiceInput>) =>
    authorizedRequest<MunicipalService>(`/services/${id}`, json("PATCH", data)),

  remove: (id: number) => authorizedRequest<void>(`/services/${id}`, { method: "DELETE" }),
}
