import { authorizedRequest } from "@/repository/auth.repository"

// Formulaires protégés contre l'envoi automatique (api/README.md, « Protection anti-robots »)
export type GuardedForm = "register" | "login" | "contact" | "request" | "appointment" | "review" | "comment"

export interface FormTokenResponse {
  token: string
  // Délai minimal entre l'affichage du formulaire et son envoi
  minDelayMs: number
  expiresInMs: number
}

export const formsRepository = {
  token: (form: GuardedForm) => authorizedRequest<FormTokenResponse>(`/forms/token?form=${form}`),
}
