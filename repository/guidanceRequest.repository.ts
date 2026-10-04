import { authorizedRequest } from "./auth.repository"

export interface GuidanceService {
  id: number
  code: string
  name: string
}

export interface GuidanceRequest {
  id: number
  problem: string
  summary: string | null
  steps: string[]
  service: GuidanceService | null
  // null tant que l'habitant n'a pas déposé de demande à partir de cette orientation
  request: { reference: string; subject: string; depositedAt: string } | null
  // true quand l'orientation vient du routage par mots-clés et non du modèle : l'interface
  // l'affiche honnêtement plutôt que de laisser croire à une réponse rédigée
  automatic: boolean
  createdAt: string
}

export interface GuidanceAnswer {
  guidance: GuidanceRequest
}

export interface GuidanceDeposit {
  guidance: GuidanceRequest
  request: { reference: string; subject: string }
}

export const guidanceRepository = {
  // Habitant : décrire son problème et être orienté vers le service compétent
  create: (problem: string) =>
    authorizedRequest<GuidanceAnswer>("/guidance-requests", {
      method: "POST",
      body: JSON.stringify({ problem }),
    }),

  // Habitant : déposer la demande dans le service désigné par l'orientation
  deposit: (id: number) =>
    authorizedRequest<GuidanceDeposit>(`/guidance-requests/${id}/deposit`, { method: "POST" }),
}