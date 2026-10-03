export type ProjectStatus = "planned" | "ongoing" | "completed"

export interface Project {
  id: number
  title: string
  description: string | null
  imageUrl: string | null
  status: ProjectStatus
  progress: number | null
}

interface PublicProject {
  id: number
  title: string
  description: string | null
  imageUrl: string | null
  status: ProjectStatus
  progress: number | null
  createdAt: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "")
const API_ORIGIN = API_URL?.replace(/\/api$/, "")

export function resolveProjectImageUrl(imageUrl: string | null): string | null {
  if (!imageUrl || !API_ORIGIN) return null
  return imageUrl.startsWith("http") ? imageUrl : `${API_ORIGIN}${imageUrl}`
}

/**
 * Les 3 projets les plus récents de Terra Nova, destinés à la page d'accueil publique.
 * Route publique de l'API : aucune session requise.
 */
export async function getLatestProjects(): Promise<Project[]> {
  if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL n'est pas configurée.")

  const response = await fetch(`${API_URL}/public/projects`, { cache: "no-store" })
  if (!response.ok) throw new Error(`Erreur ${response.status}`)

  const projects: PublicProject[] = await response.json()
  return projects.map(({ id, title, description, imageUrl, status, progress }) => ({
    id,
    title,
    description,
    imageUrl,
    status,
    progress,
  }))
}
