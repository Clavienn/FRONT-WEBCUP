import { authorizedRequest } from "@/repository/auth.repository"

export interface ExternalEntity {
  id: number
  name: string
  type: string | null
}

const json = (method: string, data: unknown): RequestInit => ({ method, body: JSON.stringify(data) })

export const externalEntityRepository = {
  list: () => authorizedRequest<ExternalEntity[]>("/external-entities"),

  // Idempotent côté serveur sur le nom : un "ajout rapide" répété réutilise l'entité existante
  create: (data: { name: string; type?: string | null }) =>
    authorizedRequest<ExternalEntity>("/external-entities", json("POST", data)),

  remove: (id: number) => authorizedRequest<void>(`/external-entities/${id}`, { method: "DELETE" }),
}
