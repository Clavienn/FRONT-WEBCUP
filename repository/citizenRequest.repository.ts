import { authorizedRequest } from "@/repository/auth.repository"

export type RequestStatus = "pending" | "in_progress" | "resolved" | "rejected"

export const REQUEST_STATUSES: RequestStatus[] = ["pending", "in_progress", "resolved", "rejected"]

export type RequestStatusCounts = Record<RequestStatus, number>

// L'agent ne peut proposer que ces transitions ; le serveur reste l'autorité et
// renvoie 409 sur les autres. Cette table ne sert qu'à n'afficher que les boutons possibles.
export const REQUEST_STATUS_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  pending: ["in_progress", "rejected"],
  in_progress: ["resolved", "rejected"],
  resolved: [],
  rejected: ["pending"],
}

// Étiquettes métier : même emplacement que roleLabel() dans auth.repository
export function requestStatusLabel(status: RequestStatus): string {
  if (status === "pending") return "À traiter"
  if (status === "in_progress") return "En cours"
  if (status === "resolved") return "Acceptée"
  return "Refusée"
}

// "in_progress" -> "InProgress" : les statuts contiennent un underscore, une simple
// majuscule sur la première lettre casse la clé de traduction (filterIn_progress
// n'existe pas, seule filterInProgress existe).
export function requestStatusKey(status: RequestStatus): string {
  return status
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join("")
}

export interface RequestService {
  id: number
  code: string
  name: string
}

export interface CitizenRequest {
  id: number
  subject: string
  description: string | null
  status: RequestStatus
  service: RequestService | null
  createdAt: string
  updatedAt: string | null
}

export interface RequestHistoryEntry {
  oldStatus: RequestStatus | null
  newStatus: RequestStatus
  note: string | null
  changedAt: string
  author: { id: number; firstName: string; lastName: string } | null
}

// Détail d'une demande : une demande sans evolution n'est pas une demande suivie
export interface CitizenRequestDetail extends CitizenRequest {
  history: RequestHistoryEntry[]
}

export interface AgentRequest extends CitizenRequest {
  userId: number
  assignedTo: number | null
  owner: { id: number; firstName: string; lastName: string } | null
  assignee: { id: number; firstName: string; lastName: string } | null
}

export type AgentRequestDetail = AgentRequest & { history: RequestHistoryEntry[] }

export interface RequestPage<T> {
  requests: T[]
  limit: number
  offset: number
  total: number
}

export interface NewRequestInput {
  serviceId?: number | null
  subject: string
  description?: string | null
}

export interface RequestUpdateInput {
  status?: RequestStatus
  assignedTo?: number | null
  note?: string | null
}

export interface AgentQuery {
  status?: RequestStatus | "all"
  assignedTo?: number
  mine?: boolean
}

const json = (method: string, data: unknown): RequestInit => ({ method, body: JSON.stringify(data) })

function query(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.set(key, String(value))
  }
  const encoded = search.toString()
  return encoded ? `?${encoded}` : ""
}

/** Demandes du citoyen connecté. Le serveur filtre sur l'utilisateur de la session :
 * aucun identifiant de demande ne permet d'accéder à celle d'autrui. */
function listMine(status?: RequestStatus): Promise<RequestPage<CitizenRequest>> {
  return authorizedRequest<RequestPage<CitizenRequest>>(`/requests/mine${query({ status })}`)
}

function getMine(id: number): Promise<CitizenRequestDetail> {
  return authorizedRequest<CitizenRequestDetail>(`/requests/mine/${id}`)
}

function create(input: NewRequestInput): Promise<CitizenRequest> {
  return authorizedRequest<CitizenRequest>("/requests", json("POST", input))
}

/** File agent : filtres par statut, par agent, ou file personally suivie. */
function listAll(query_: AgentQuery): Promise<RequestPage<AgentRequest>> {
  return authorizedRequest<RequestPage<AgentRequest>>(
    `/requests${query({ status: query_.status, assignedTo: query_.assignedTo, mine: query_.mine })}`
  )
}

function getOne(id: number): Promise<AgentRequestDetail> {
  return authorizedRequest<AgentRequestDetail>(`/requests/${id}`)
}

function update(id: number, input: RequestUpdateInput): Promise<AgentRequestDetail> {
  return authorizedRequest<AgentRequestDetail>(`/requests/${id}`, json("PATCH", input))
}

// Le total de chaque page suffit : pas besoin de charger les lignes pour compter.
async function statsMine(): Promise<RequestStatusCounts> {
  const pages = await Promise.all(REQUEST_STATUSES.map((status) => listMine(status)))
  return REQUEST_STATUSES.reduce((counts, status, index) => {
    counts[status] = pages[index].total
    return counts
  }, {} as RequestStatusCounts)
}

async function statsAll(): Promise<RequestStatusCounts> {
  const pages = await Promise.all(REQUEST_STATUSES.map((status) => listAll({ status })))
  return REQUEST_STATUSES.reduce((counts, status, index) => {
    counts[status] = pages[index].total
    return counts
  }, {} as RequestStatusCounts)
}

export const citizenRequestRepository = {
  listMine,
  getMine,
  create,
  listAll,
  getOne,
  update,
  statsMine,
  statsAll,
}