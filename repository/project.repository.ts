import { authorizedRequest } from "@/repository/auth.repository"

export type ProjectStatus = "planned" | "ongoing" | "completed"

export interface ProjectParticipant {
  id: number
  firstName: string
  lastName: string
}

export interface ProjectExternalEntity {
  id: number
  name: string
  type: string | null
}

export interface Project {
  id: number
  title: string
  description: string | null
  imageUrl: string | null
  status: ProjectStatus
  // Pertinent seulement quand status = "ongoing"
  progress: number | null
  author: { id: number; firstName: string; lastName: string } | null
  participants: ProjectParticipant[]
  externalEntities: ProjectExternalEntity[]
  createdAt: string
  updatedAt: string
}

export interface ProjectComment {
  id: number
  content: string
  author: { id: number; firstName: string; lastName: string } | null
  createdAt: string
}

export interface ProjectInput {
  title: string
  description?: string | null
  imageUrl?: string | null
  status?: ProjectStatus
  progress?: number | null
}

export type ProjectUpdate = Partial<ProjectInput>

// Les champs imageUrl stockés sont relatifs ("/uploads/projects/xyz.jpg") : l'API les sert
// hors du préfixe /api, donc on retire ce préfixe pour obtenir l'origine à préfixer.
const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "") ?? ""
const API_ORIGIN = API_URL.replace(/\/api$/, "")

export function resolveProjectImageUrl(imageUrl: string | null): string | null {
  if (!imageUrl) return null
  return imageUrl.startsWith("http") ? imageUrl : `${API_ORIGIN}${imageUrl}`
}

const json = (method: string, data: unknown): RequestInit => ({ method, body: JSON.stringify(data) })

export const projectRepository = {
  list: () => authorizedRequest<Project[]>("/projects"),

  get: (id: number) => authorizedRequest<Project>(`/projects/${id}`),

  create: (data: ProjectInput) => authorizedRequest<Project>("/projects", json("POST", data)),

  update: (id: number, data: ProjectUpdate) => authorizedRequest<Project>(`/projects/${id}`, json("PATCH", data)),

  remove: (id: number) => authorizedRequest<void>(`/projects/${id}`, { method: "DELETE" }),

  addParticipant: (projectId: number, userId: number) =>
    authorizedRequest<Project>(`/projects/${projectId}/participants`, json("POST", { userId })),

  removeParticipant: (projectId: number, userId: number) =>
    authorizedRequest<Project>(`/projects/${projectId}/participants/${userId}`, { method: "DELETE" }),

  // Soit un externalEntityId existant, soit { name, type? } pour un "ajout rapide" créé à la volée
  addExternalEntity: (projectId: number, data: { externalEntityId: number } | { name: string; type?: string | null }) =>
    authorizedRequest<Project>(`/projects/${projectId}/entities`, json("POST", data)),

  removeExternalEntity: (projectId: number, entityId: number) =>
    authorizedRequest<Project>(`/projects/${projectId}/entities/${entityId}`, { method: "DELETE" }),

  listComments: (projectId: number) => authorizedRequest<ProjectComment[]>(`/projects/${projectId}/comments`),

  createComment: (projectId: number, content: string) =>
    authorizedRequest<{ comment: ProjectComment; message: string }>(
      `/projects/${projectId}/comments`,
      json("POST", { content })
    ),

  // Modération : réservée aux administrateurs
  deleteComment: (projectId: number, commentId: number) =>
    authorizedRequest<void>(`/projects/${projectId}/comments/${commentId}`, { method: "DELETE" }),

  async uploadImage(file: File): Promise<{ url: string }> {
    const body = new FormData()
    body.append("image", file)
    return authorizedRequest<{ url: string }>("/uploads/project-image", { method: "POST", body })
  },
}
