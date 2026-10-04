import {
  auditRepository,
  permissionRepository,
  roleRepository,
  userAdminRepository,
  type AuditLogPage,
  type Permission,
  type Role,
  type UserPage,
} from "@/repository/admin.repository"
import { citizenAccountRepository, type CitizenAccountPage } from "@/repository/citizenAccount.repository"
import { citizenRequestRepository, type AgentRequest, type RequestStatusCounts } from "@/repository/citizenRequest.repository"
import { contactMessageRepository, type ContactInbox } from "@/repository/contactMessage.repository"
import { ideaRepository, type IdeaList } from "@/repository/idea.repository"
import { projectRepository, type Project } from "@/repository/project.repository"
import { serviceRepository, type MunicipalService } from "@/repository/service.repository"

/**
 * Export PDF de la console d'administration : chargement des sources déjà exposées par l'API.
 * Aucune route n'est ajoutée : chaque source garde son `requirePermission` d'origine et ne
 * renvoie que les views déjà projetées par l'API.
 */

/** Nombre de lignes détaillées par source : au-delà, le PDF renvoie le total et la section de synthèse. */
export const EXPORT_ROW_LIMIT = 40

export const EXPORT_SECTIONS = [
  "synthesis",
  "requests",
  "accounts",
  "rbac",
  "audit",
  "services",
  "projects",
  "ideas",
  "messages",
] as const

export type ExportSection = (typeof EXPORT_SECTIONS)[number]

/** La synthèse est derivative : elle ne charge rien, elle agrège les sources sélectionnées. */
export type ExportDataKey = Exclude<ExportSection, "synthesis">

const DATA_KEYS: ExportDataKey[] = EXPORT_SECTIONS.filter((key) => key !== "synthesis") as ExportDataKey[]

export interface RequestsData {
  counts: RequestStatusCounts
  recent: AgentRequest[]
  total: number
}

export interface AccountsData {
  /** Annuaire complet : `/users` renvoie tous les rôles, pas seulement les comptes staff */
  directory: UserPage
  /** Sous-ensemble citoyen, utilisé pour le total : `/citizen-accounts` filtre sur le rôle */
  citizens: CitizenAccountPage
}

export interface RbacData {
  roles: Role[]
  permissions: Permission[]
}

export interface AuditData {
  page: AuditLogPage
}

export interface ServicesData {
  services: MunicipalService[]
}

export interface ProjectsData {
  projects: Project[]
}

export interface IdeasData {
  list: IdeaList
}

export interface MessagesData {
  inbox: ContactInbox
}

export interface ExportData {
  requests: RequestsData
  accounts: AccountsData
  rbac: RbacData
  audit: AuditData
  services: ServicesData
  projects: ProjectsData
  ideas: IdeasData
  messages: MessagesData
}

/** Une source absente ne fait pas échouer l'export : le PDF la signale dans les points d'attention. */
export type ExportResult = {
  [K in ExportDataKey]: { data: ExportData[K] | null; error: string | null }
}

const LOADERS: { [K in ExportDataKey]: () => Promise<ExportData[K]> } = {
  requests: async () => {
    const [counts, recent] = await Promise.all([
      citizenRequestRepository.statsAll(),
      citizenRequestRepository.listAll({ limit: EXPORT_ROW_LIMIT, page: 1 }),
    ])
    return {
      counts,
      recent: recent.requests,
      total: Object.values(counts).reduce((sum, value) => sum + value, 0),
    }
  },
  accounts: async () => ({
    directory: await userAdminRepository.list({ page: 1, limit: EXPORT_ROW_LIMIT }),
    citizens: await citizenAccountRepository.list({ page: 1, limit: EXPORT_ROW_LIMIT }),
  }),
  rbac: async () => ({
    roles: await roleRepository.list(),
    permissions: await permissionRepository.list(),
  }),
  audit: async () => ({ page: await auditRepository.list({ page: 1, limit: EXPORT_ROW_LIMIT }) }),
  services: async () => ({ services: await serviceRepository.list({ all: true }) }),
  projects: async () => ({ projects: await projectRepository.list() }),
  ideas: async () => ({ list: await ideaRepository.listAll(1, EXPORT_ROW_LIMIT) }),
  messages: async () => ({ inbox: await contactMessageRepository.listInbox({ page: 1, limit: EXPORT_ROW_LIMIT }) }),
}

/**
 * Charge les sources demandées en parallèle. La synthèse impose toutes les sources : sans elle le
 * rapport n'aurait aucun indicateur à présenter.
 */
export async function loadAdminExport(sections: ExportSection[]): Promise<ExportResult> {
  const keys: ExportDataKey[] = sections.includes("synthesis")
    ? DATA_KEYS
    : sections.filter((key): key is ExportDataKey => key !== "synthesis")

  const load = async <K extends ExportDataKey>(
    key: K
  ): Promise<{ data: ExportData[K] | null; error: string | null }> => {
    if (!keys.includes(key)) return { data: null, error: null }
    try {
      return { data: await LOADERS[key](), error: null }
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : String(error) }
    }
  }

  const [requests, accounts, rbac, audit, services, projects, ideas, messages] = await Promise.all([
    load("requests"),
    load("accounts"),
    load("rbac"),
    load("audit"),
    load("services"),
    load("projects"),
    load("ideas"),
    load("messages"),
  ])

  return { requests, accounts, rbac, audit, services, projects, ideas, messages }
}