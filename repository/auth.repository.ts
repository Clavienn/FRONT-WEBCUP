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

  async me(): Promise<AuthUser> {
    return request<AuthUser>("/auth/me")
  },

  async logout(): Promise<void> {
    try {
      await request<void>("/auth/logout", { method: "POST" })
    } finally {
      accessToken = null
    }
  },

  clearAccessToken() {
    accessToken = null
  },
}