import type { AuthUser } from "@/repository/auth.repository"
import { serviceRepository } from "@/repository/service.repository"
import { establishmentRepository } from "@/repository/establishment.repository"
import { projectRepository } from "@/repository/project.repository"
import { announcementRepository } from "@/repository/announcement.repository"

export type SearchCategory = "services" | "establishments" | "projects" | "announcements"

export interface SearchResult {
  category: SearchCategory
  id: number
  title: string
  subtitle: string | null
  href: string
}

export const SEARCH_CATEGORIES: SearchCategory[] = ["services", "establishments", "projects", "announcements"]

// Permission requise pour que la catégorie apparaisse dans la recherche : même garde que le menu
// latéral, pour ne jamais faire remonter un résultat que l'utilisateur ne pourrait pas ouvrir.
const CATEGORY_PERMISSION: Record<SearchCategory, string> = {
  services: "citizen.services.view",
  establishments: "citizen.establishments.view",
  projects: "citizen.projects.view",
  announcements: "citizen.announcements.view",
}

const MIN_QUERY_LENGTH = 2

function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
}

function matches(query: string, ...fields: (string | null | undefined)[]): boolean {
  return fields.some((field) => field && normalize(field).includes(query))
}

// Recherche générale citoyenne : interroge en parallèle les listes déjà exposées par chaque
// ressource (pas de nouvel endpoint backend) et filtre côté client sur titre/description.
// Les annonces ont déjà un paramètre `q` serveur ; on s'en sert plutôt que de tout rapatrier.
export async function searchAll(rawQuery: string, user: AuthUser): Promise<SearchResult[]> {
  const query = rawQuery.trim()
  if (query.length < MIN_QUERY_LENGTH) return []
  const normalizedQuery = normalize(query)

  const tasks: Promise<SearchResult[]>[] = []

  if (user.permissions.includes(CATEGORY_PERMISSION.services)) {
    tasks.push(
      serviceRepository
        .list()
        .then((services) =>
          services
            .filter((service) => matches(normalizedQuery, service.name, service.description))
            .map((service) => ({
              category: "services" as const,
              id: service.id,
              title: service.name,
              subtitle: service.description,
              href: `/dashboard/services/detail?id=${service.id}`,
            }))
        )
        .catch(() => [])
    )
  }

  if (user.permissions.includes(CATEGORY_PERMISSION.establishments)) {
    tasks.push(
      establishmentRepository
        .list()
        .then((establishments) =>
          establishments
            .filter((establishment) =>
              matches(normalizedQuery, establishment.name, establishment.description, establishment.address, establishment.service?.name)
            )
            .map((establishment) => ({
              category: "establishments" as const,
              id: establishment.id,
              title: establishment.name,
              subtitle: establishment.service?.name ?? establishment.address,
              href: "/dashboard/lieux-utiles",
            }))
        )
        .catch(() => [])
    )
  }

  if (user.permissions.includes(CATEGORY_PERMISSION.projects)) {
    tasks.push(
      projectRepository
        .list()
        .then((projects) =>
          projects
            .filter((project) => matches(normalizedQuery, project.title, project.description))
            .map((project) => ({
              category: "projects" as const,
              id: project.id,
              title: project.title,
              subtitle: project.description,
              href: `/dashboard/projects/detail?id=${project.id}`,
            }))
        )
        .catch(() => [])
    )
  }

  if (user.permissions.includes(CATEGORY_PERMISSION.announcements)) {
    tasks.push(
      announcementRepository
        .list({ q: query, limit: 10 })
        .then((page) =>
          page.announcements.map((announcement) => ({
            category: "announcements" as const,
            id: announcement.id,
            title: announcement.title,
            subtitle: announcement.content,
            href: `/dashboard/announcements/detail?id=${announcement.id}`,
          }))
        )
        .catch(() => [])
    )
  }

  const results = await Promise.all(tasks)
  return results.flat()
}
