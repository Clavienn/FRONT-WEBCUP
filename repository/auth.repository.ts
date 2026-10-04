import { getAppLocale } from "@/lib/i18n/types"
import { resilientFetch } from "@/lib/network"

export type UserRole = "citizen" | "agent" | "admin"

// Rôles que l'utilisateur peut choisir à l'inscription (admin est attribué côté serveur)
export type SignupRole = Exclude<UserRole, "admin">

export interface AuthUser {
  id: number
  email: string
  firstName: string | null
  lastName: string | null
  phone: string | null
  address: string | null
  roles: UserRole[]
  permissions: string[]
  createdAt: string
  updatedAt: string
}

// Agents et admins accèdent à la console ; les citoyens à l'espace citoyen
export const isStaff = (user: AuthUser) => user.roles.some((role) => role === "agent" || role === "admin")

export interface Credentials {
  email: string
  password: string
}

export interface RegistrationData extends Credentials {
  firstName: string
  lastName: string
  role: SignupRole
}

export interface ProfileUpdate {
  email?: string
  firstName?: string | null
  lastName?: string | null
  // Champ vide -> null : le backend efface la valeur
  phone?: string | null
  address?: string | null
}

// Réponse de GET /auth/me/welcome : le serveur décide si l'accueil est proposé (moins de 2 sessions ouvertes)
export interface WelcomeStatus {
  showWelcome: boolean
  sessionCount: number
}

export interface PasswordChange {
  currentPassword: string
  newPassword: string
}

interface AuthResponse {
  user: unknown
  accessToken: string
}

function normalizeRole(value: unknown): UserRole | null {
  const rawCode =
    typeof value === "string"
      ? value
      : value && typeof value === "object"
        ? (value as { code?: unknown; role?: unknown; name?: unknown }).code ??
          (value as { role?: unknown }).role ??
          (value as { name?: unknown }).name
        : null

  if (typeof rawCode !== "string") return null

  const code = rawCode.toLowerCase().trim().replace(/[\s_-]+/g, "")
  if (["citizen", "resident", "user"].includes(code)) return "citizen"
  if (["agent", "municipalagent", "staff"].includes(code)) return "agent"
  if (["admin", "administrator"].includes(code)) return "admin"
  return null
}

function nullableString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null
}

export function normalizeAuthUser(value: unknown): AuthUser {
  if (!value || typeof value !== "object") {
    throw new Error("La réponse d’authentification ne contient pas de profil valide.")
  }

  const data = value as Record<string, unknown>
  const rawRoles = Array.isArray(data.roles)
    ? data.roles
    : data.roles !== undefined
      ? [data.roles]
      : data.role !== undefined
        ? [data.role]
        : []
  const roles = [...new Set(rawRoles.map(normalizeRole).filter((role): role is UserRole => role !== null))]

  if (roles.length === 0) {
    throw new Error("Le serveur n’a renvoyé aucun rôle reconnu pour ce compte.")
  }

  const id = Number(data.id)
  if (!Number.isSafeInteger(id) || id < 1) {
    throw new Error("Le serveur a renvoyé un identifiant de compte invalide.")
  }

  const rawPermissions = Array.isArray(data.permissions) ? data.permissions : []

  return {
    id,
    email: typeof data.email === "string" ? data.email : "",
    firstName: nullableString(data.firstName ?? data.first_name),
    lastName: nullableString(data.lastName ?? data.last_name),
    phone: nullableString(data.phone),
    address: nullableString(data.address),
    roles,
    permissions: rawPermissions
      .map((permission) => {
        if (typeof permission === "string") return permission
        if (permission && typeof permission === "object") {
          const code = (permission as { code?: unknown }).code
          return typeof code === "string" ? code : null
        }
        return null
      })
      .filter((permission): permission is string => permission !== null),
    createdAt: String(data.createdAt ?? data.created_at ?? ""),
    updatedAt: String(data.updatedAt ?? data.updated_at ?? ""),
  }
}

// Retourne le code de rôle ("admin" | "agent" | "citizen") ; traduire via t(`roles.${roleLabel(user)}`)
export function roleLabel(user: AuthUser) {
  if (user.roles.includes("admin")) return "admin"
  if (user.roles.includes("agent")) return "agent"
  return "citizen"
}

// Sécurité du compte (GET /auth/me/security)
export interface SecuritySession {
  id: string | number
  // Navigateur et système, ex. « Chrome sur Windows »
  device: string
  // Adresse masquée par le serveur (203.0.113.x)
  ip: string
  createdAt: string
  lastUsedAt: string
  expiresAt: string
  current: boolean
}

export interface SecurityEvent {
  action: string
  at: string
  ip: string | null
}

// Consultation d'une de MES données par un membre du personnel (jamais son e-mail)
export interface SecurityDataAccess {
  at: string
  by: string
  role: "agent" | "admin"
  resource: "request" | "message" | "account" | "report"
}

export interface SecurityOverview {
  sessions: SecuritySession[]
  events: SecurityEvent[]
  dataAccess: SecurityDataAccess[]
}

export class AuthApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    // Code métier de l'API (ex. form_too_fast, bot_blocked) et délai avant un nouvel essai, quand fournis
    readonly code?: string,
    readonly retryAfterMs?: number,
    // Corps complet de la réponse d'erreur : certains refus portent des données utiles (ex. suggestions d'arrêts)
    readonly body?: unknown
  ) {
    super(message)
    this.name = "AuthApiError"
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "")

let accessToken: string | null = null
let refreshRequest: Promise<AuthResponse> | null = null

// L'API n'emploie pas un seul format de délai avant réessai : `retryAfterMs` pour un jeton de
// formulaire soumis trop vite, `retryAfterSeconds` pour les 429/503 (blocage anti-robot, surcharge
// du serveur, plafond de consultations de dossiers), et l'en-tête Retry-After en secours. Tout est
// normalisé en millisecondes : ne lire que `retryAfterMs` faisait perdre le délai annoncé par le
// serveur, et l'interface ne pouvait ni afficher un compte à rebours ni expliquer l'attente.
function retryDelayMs(response: Response, body: unknown): number | undefined {
  const data = (body ?? {}) as { retryAfterMs?: unknown; retryAfterSeconds?: unknown }
  if (typeof data.retryAfterMs === "number" && data.retryAfterMs > 0) return data.retryAfterMs
  if (typeof data.retryAfterSeconds === "number" && data.retryAfterSeconds > 0) {
    return data.retryAfterSeconds * 1000
  }
  const header = Number(response.headers.get("Retry-After"))
  return Number.isFinite(header) && header > 0 ? header * 1000 : undefined
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!API_URL) {
    throw new Error("La variable NEXT_PUBLIC_API_URL n'est pas configurée.")
  }

  const headers = new Headers(init.headers)
  // FormData (upload de fichier) : laisser fetch poser son propre Content-Type avec la boundary
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`)
  // L'API génère notamment les rappels de rendez-vous : la locale du header décide de la
  // langue du texte écrit en base. Le fetch navigateur envoie un Accept-Language issu des
  // préférences système, pas de notre choix, donc on l'écrase avec la locale de l'app.
  if (!headers.has("Accept-Language")) {
    headers.set("Accept-Language", getAppLocale().toUpperCase())
  }

  // Délai maximal, et nouvelles tentatives sur les lectures si le serveur est surchargé (429/502/503/504)
  // ou injoignable : voir lib/network.ts. Les écritures ne sont jamais rejouées.
  const response = await resilientFetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    cache: "no-store",
    headers,
  })

  const body = response.status === 204 ? undefined : await response.json().catch(() => null)
  if (!response.ok) {
    throw new AuthApiError(
      body?.message || `Erreur ${response.status}`,
      response.status,
      typeof body?.code === "string" ? body.code : undefined,
      retryDelayMs(response, body),
      body ?? undefined
    )
  }

  return body as T
}

// Message renvoyé par le middleware authenticate du backend quand l'access token est absent/expiré
const isAccessTokenError = (error: unknown) =>
  error instanceof AuthApiError && error.status === 401 && /token d'accès/i.test(error.message)

// Requête protégée : si l'access token a expiré, on passe une fois par /auth/refresh puis on rejoue
export async function authorizedRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  try {
    return await request<T>(path, init)
  } catch (error) {
    if (!isAccessTokenError(error)) throw error
    await authRepository.refresh()
    return request<T>(path, init)
  }
}

async function authenticate(
  path: string,
  data: Credentials | RegistrationData,
  headers?: Record<string, string>
): Promise<AuthUser> {
  const session = await request<AuthResponse>(path, {
    method: "POST",
    body: JSON.stringify(data),
    headers,
  })
  const user = normalizeAuthUser(session.user)
  accessToken = session.accessToken
  return user
}

export const authRepository = {
  // Jeton d'accès courant, pour authentifier la connexion temps réel (socket.io) du personnel
  getAccessToken: () => accessToken,

  security: () => authorizedRequest<SecurityOverview>("/auth/me/security"),

  // Ferme une session (un autre appareil) ; 404 si inconnue ou pas la sienne
  revokeSession: (id: string | number) => authorizedRequest<void>(`/auth/me/sessions/${id}`, { method: "DELETE" }),

  // headers : protection anti-robots (voir components/forms/form-guard.tsx)
  login: (credentials: Credentials, headers?: Record<string, string>) => authenticate("/auth/login", credentials, headers),

  register: (data: RegistrationData, headers?: Record<string, string>) => authenticate("/auth/register", data, headers),

  async refresh(): Promise<AuthUser> {
    if (!refreshRequest) {
      refreshRequest = request<AuthResponse>("/auth/refresh", { method: "POST" })
    }

    try {
      const session = await refreshRequest
      const user = normalizeAuthUser(session.user)
      accessToken = session.accessToken
      return user
    } catch (error) {
      accessToken = null
      throw error
    } finally {
      refreshRequest = null
    }
  },

  async me() {
    return normalizeAuthUser(await authorizedRequest<unknown>("/auth/me"))
  },

  welcomeStatus: () => authorizedRequest<WelcomeStatus>("/auth/me/welcome"),

  async updateProfile(data: ProfileUpdate) {
    return normalizeAuthUser(
      await authorizedRequest<unknown>("/auth/me", { method: "PATCH", body: JSON.stringify(data) })
    )
  },

  // Le backend révoque les autres sessions et renvoie de nouveaux tokens pour celle-ci
  async changePassword(data: PasswordChange): Promise<AuthUser> {
    const session = await authorizedRequest<AuthResponse>("/auth/me/password", {
      method: "PATCH",
      body: JSON.stringify(data),
    })
    const user = normalizeAuthUser(session.user)
    accessToken = session.accessToken
    return user
  },

  async logout(): Promise<void> {
    try {
      await request<void>("/auth/logout", { method: "POST" })
    } finally {
      accessToken = null
    }
  },

  async logoutAll(): Promise<void> {
    try {
      await authorizedRequest<void>("/auth/logout-all", { method: "POST" })
    } finally {
      accessToken = null
    }
  },

  // Suppression définitive du compte. Le token n'est lâché qu'en cas de succès : sur un refus
  // (mot de passe erroné) la session est toujours valide et doit rester utilisable pour
  // que l'utilisateur puisse réessayer.
  async deleteAccount(password: string): Promise<void> {
    await authorizedRequest<void>("/auth/me", {
      method: "DELETE",
      body: JSON.stringify({ password }),
    })
    accessToken = null
  },

  clearAccessToken() {
    accessToken = null
  },
}