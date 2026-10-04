import { authorizedRequest } from "@/repository/auth.repository"

// ── Utilisateurs ─────────────────────────────────────────────
export interface ManagedUser {
  id: number
  email: string
  firstName: string
  lastName: string
  phone: string | null
  address: string | null
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
  roles?: string[]
}

export interface UserPage {
  users: ManagedUser[]
  page: number
  limit: number
  total: number
}

// ── Rôles et permissions ─────────────────────────────────────
export interface Role {
  id: number
  code: string
  label: string
  level: number
  isSystem: boolean
  permissions?: string[]
  usersCount?: number
}

export interface Permission {
  id: number
  code: string
  label: string
  module: string
  roles?: string[]
}

export interface RoleInput {
  label: string
  level: number
}

export interface PermissionInput {
  label: string
  module: string
}

const json = (method: string, data: unknown): RequestInit => ({ method, body: JSON.stringify(data) })

// Agent inscrit seul, pas encore validé par un administrateur
export interface PendingAgent {
  id: number
  email: string
  firstName: string
  lastName: string
  createdAt: string
}

export const userAdminRepository = {
  // Tant qu'un agent n'est pas validé, il ne voit que des coordonnées partielles et ne peut pas modifier de compte citoyen
  pendingAgents: () => authorizedRequest<{ users: PendingAgent[] }>("/users/pending-agents"),

  validateAgent: (id: number) =>
    authorizedRequest<{ validated: boolean }>(`/users/${id}/validate-agent`, { method: "POST" }),

  list(query: { q?: string; page?: number; limit?: number } = {}) {
    const params = new URLSearchParams()
    if (query.q) params.set("q", query.q)
    if (query.page) params.set("page", String(query.page))
    if (query.limit) params.set("limit", String(query.limit))
    const search = params.toString()
    return authorizedRequest<UserPage>(`/users${search ? `?${search}` : ""}`)
  },

  setStatus: (id: number, isActive: boolean) =>
    authorizedRequest<ManagedUser>(`/users/${id}/status`, json("PATCH", { isActive })),

  assignRole: (id: number, role: string) =>
    authorizedRequest<{ roles: string[] }>(`/users/${id}/roles`, json("POST", { role })),

  removeRole: (id: number, role: string) =>
    authorizedRequest<{ roles: string[] }>(`/users/${id}/roles/${encodeURIComponent(role)}`, { method: "DELETE" }),
}

export const roleRepository = {
  list: () => authorizedRequest<Role[]>("/roles"),

  create: (data: RoleInput & { code: string }) => authorizedRequest<Role>("/roles", json("POST", data)),

  update: (id: number, data: Partial<RoleInput>) => authorizedRequest<Role>(`/roles/${id}`, json("PATCH", data)),

  remove: (id: number) => authorizedRequest<void>(`/roles/${id}`, { method: "DELETE" }),

  // Remplace l'ensemble des permissions du rôle par exactement la liste donnée (codes)
  setPermissions: (id: number, permissions: string[]) =>
    authorizedRequest<{ permissions: Permission[] }>(`/roles/${id}/permissions`, json("PUT", { permissions })),
}

export const permissionRepository = {
  list: () => authorizedRequest<Permission[]>("/permissions"),

  // Détail avec les rôles qui possèdent la permission
  get: (id: number) => authorizedRequest<Permission>(`/permissions/${id}`),

  create: (data: PermissionInput & { code: string }) =>
    authorizedRequest<Permission>("/permissions", json("POST", data)),

  update: (id: number, data: Partial<PermissionInput>) =>
    authorizedRequest<Permission>(`/permissions/${id}`, json("PATCH", data)),

  // force: détache d'abord la permission des rôles qui la possèdent
  remove: (id: number, force = false) =>
    authorizedRequest<void>(`/permissions/${id}${force ? "?force=true" : ""}`, { method: "DELETE" }),
}

// ── Journal d'audit ──────────────────────────────────────────
export interface AuditLog {
  id: number
  userId: number | null
  action: string
  entityType: string | null
  entityId: number | null
  ipAddress: string | null
  createdAt: string
  // Auteur de l'action ; null si l'action est anonyme ou le compte supprimé
  user: { id: number; email: string; firstName: string; lastName: string } | null
}

export interface AuditLogPage {
  logs: AuditLog[]
  page: number
  limit: number
  total: number
}

// Reflète exactement la projection platformActivityView : ni ipAddress ni e-mail, l'agent voit
// l'auteur par son identité seule (même contrat que agentRequestView côté API). `technical` est
// classé par le serveur : le front ne recalcule pas ce qu'est une trace de requête.
export interface PlatformActivityLog extends Omit<AuditLog, "ipAddress" | "user"> {
  user: { id: number; firstName: string; lastName: string } | null
  technical: boolean
  // E-mail du compte visé quand l'opération porte sur un utilisateur
  targetEmail: string | null
}

export interface PlatformActivityPage {
  logs: PlatformActivityLog[]
  page: number
  limit: number
  total: number
}

export const auditRepository = {
  list(query: { userId?: number; action?: string; page?: number; limit?: number } = {}) {
    const params = new URLSearchParams()
    if (query.userId) params.set("userId", String(query.userId))
    if (query.action) params.set("action", query.action)
    if (query.page) params.set("page", String(query.page))
    if (query.limit) params.set("limit", String(query.limit))
    const search = params.toString()
    return authorizedRequest<AuditLogPage>(`/audit-logs${search ? `?${search}` : ""}`)
  },

  // Flux d'activité de la console agent : mêmes filtres, mais sans IP ni tri par utilisateur
  platformActivity(query: { action?: string; technical?: boolean; page?: number; limit?: number } = {}) {
    const params = new URLSearchParams()
    if (query.action) params.set("action", query.action)
    if (query.technical) params.set("technical", "include")
    if (query.page) params.set("page", String(query.page))
    if (query.limit) params.set("limit", String(query.limit))
    const search = params.toString()
    return authorizedRequest<PlatformActivityPage>(`/audit-logs/activity${search ? `?${search}` : ""}`)
  },
}
