export interface PublicMunicipalService {
  id: number
  code: string
  name: string
  description: string | null
  icon: string | null
}

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "")

/**
 * Catalogue des services actifs de la ville. Route publique de l'API : aucune
 * session requise, utilisable depuis la landing page.
 */
export async function getPublicServices(): Promise<PublicMunicipalService[]> {
  if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL n'est pas configurée.")

  const response = await fetch(`${API_URL}/public/services`, { cache: "no-store" })
  if (!response.ok) throw new Error(`Erreur ${response.status}`)

  return response.json()
}
