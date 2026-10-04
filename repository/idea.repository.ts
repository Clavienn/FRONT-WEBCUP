import { authorizedRequest } from "@/repository/auth.repository"

export type MentionTarget = "request" | "service" | "appointment" | "establishment" | "project" | "announcement"

export interface Mention {
  type: MentionTarget
  id: number
}

export interface MentionSuggestion extends Mention {
  label: string
}

export interface Idea {
  id: number
  // Référence affichée à l'habitant : la preuve que son idée est bien enregistrée
  reference: string
  content: string
  createdAt: string
}

export interface IdeaAuthor {
  id: number
  name: string
}

// Vue administrateur : l'auteur et les objets liés sont indiqués, pour traiter l'idée en contexte
export interface StaffIdea extends Idea {
  author: IdeaAuthor | null
  mentions: MentionSuggestion[]
}

export interface IdeaList {
  ideas: StaffIdea[]
  page: number
  limit: number
  total: number
}

export interface IdeaCreated {
  idea: Idea
  confirmation: string
}

export const ideaRepository = {
  // Habitant : déposer son idée. Seul point d'entrée côté citoyen, la lecture est réservée à l'admin.
  create: (content: string, mentions: Mention[] = []) =>
    authorizedRequest<IdeaCreated>("/ideas", { method: "POST", body: JSON.stringify({ content, mentions }) }),

  // Habitant : suggestions du menu contextuel après un "@"
  searchMentions: (query: string) =>
    authorizedRequest<{ suggestions: MentionSuggestion[] }>(`/ideas/mentions?q=${encodeURIComponent(query)}`),

  // Administration : file des idées de tous les habitants
  listAll: (page = 1, limit = 20) => authorizedRequest<IdeaList>(`/ideas?page=${page}&limit=${limit}`),
}