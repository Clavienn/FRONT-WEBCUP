export type UserRole = "USER" | "ADMIN"

export interface AuthUser {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  role: UserRole
  createdAt: string
  updatedAt: string
}

export interface Credentials {
  email: string
  password: string
}

export interface RegistrationData extends Credentials {
  firstName?: string
  lastName?: string
}

export interface ProfileUpdate {
  email?: string
  firstName?: string | null
  lastName?: string | null
}

export interface PasswordChange {
  currentPassword: string
  newPassword: string
}

interface AuthResponse {
  user: AuthUser
  accessToken: string
}

export class AuthApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
    this.name = "AuthApiError"
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "")

let accessToken: string | null = null
let refreshRequest: Promise<AuthResponse> | null = null

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!API_URL) {
    throw new Error("La variable NEXT_PUBLIC_API_URL n'est pas configurée.")
  }

  const headers = new Headers(init.headers)
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`)

  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      credentials: "include",
      cache: "no-store",
      headers,
    })
  } catch {
    throw new Error("Impossible de joindre l’API. Vérifiez que le serveur est démarré.")
  }

  const body = response.status === 204 ? undefined : await response.json().catch(() => null)
  if (!response.ok) {
    throw new AuthApiError(body?.message || `Erreur ${response.status}`, response.status)
  }

  return body as T
}

// Message renvoyé par le middleware authenticate du backend quand l'access token est absent/expiré
const isAccessTokenError = (error: unknown) =>
  error instanceof AuthApiError && error.status === 401 && /token d'accès/i.test(error.message)

// Requête protégée : si l'access token a expiré, on passe une fois par /auth/refresh puis on rejoue
async function authorizedRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  try {
    return await request<T>(path, init)
  } catch (error) {
    if (!isAccessTokenError(error)) throw error
    await authRepository.refresh()
    return request<T>(path, init)
  }
}

async function authenticate(path: string, data: Credentials | RegistrationData): Promise<AuthUser> {
  const session = await request<AuthResponse>(path, {
    method: "POST",
    body: JSON.stringify(data),
  })
  accessToken = session.accessToken
  return session.user
}

export const authRepository = {
  login: (credentials: Credentials) => authenticate("/auth/login", credentials),

  register: (data: RegistrationData) => authenticate("/auth/register", data),

  async refresh(): Promise<AuthUser> {
    if (!refreshRequest) {
      refreshRequest = request<AuthResponse>("/auth/refresh", { method: "POST" })
    }

    try {
      const session = await refreshRequest
      accessToken = session.accessToken
      return session.user
    } catch (error) {
      accessToken = null
      throw error
    } finally {
      refreshRequest = null
    }
  },

  me: () => authorizedRequest<AuthUser>("/auth/me"),

  updateProfile: (data: ProfileUpdate) =>
    authorizedRequest<AuthUser>("/auth/me", { method: "PATCH", body: JSON.stringify(data) }),

  // Le backend révoque les autres sessions et renvoie de nouveaux tokens pour celle-ci
  async changePassword(data: PasswordChange): Promise<AuthUser> {
    const session = await authorizedRequest<AuthResponse>("/auth/me/password", {
      method: "PATCH",
      body: JSON.stringify(data),
    })
    accessToken = session.accessToken
    return session.user
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

  clearAccessToken() {
    accessToken = null
  },
}