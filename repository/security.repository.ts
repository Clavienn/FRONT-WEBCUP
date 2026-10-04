import { authorizedRequest } from "@/repository/auth.repository"

// Statistiques de la protection anti-robots (GET /api/security/bots, permission admin.users.manage) :
// signaux détectés, blocages d'adresses, formulaires visés. Lues dans le journal d'audit, par fenêtre d'heures.
export interface BotSignalIp {
  ip: string
  signals: number
  lastAt: string
}

export interface BotRecentEvent {
  action: string
  form: string | null
  ip: string | null
  at: string
}

export interface BotStats {
  mode: string
  hours: number
  totalSignals: number
  blocks: number
  // missing_token, bad_token, honeypot, too_fast, reused_token, velocity, login_failures...
  byReason: Record<string, number>
  byForm: Record<string, number>
  topIps: BotSignalIp[]
  recent: BotRecentEvent[]
  // Depuis le démarrage de l'API
  live?: {
    blockedRequests: number
    blocksIssued: number
    blockedIpsNow: number
    trackedIps: number
  }
}

export const securityRepository = {
  bots: (hours = 24) => authorizedRequest<BotStats>(`/security/bots?hours=${hours}`),
}
