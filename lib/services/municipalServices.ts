import { resilientFetch } from "@/lib/network"
import { withStaleFallback } from "@/lib/stale-cache"
import { API_URL } from "@/lib/api-url"

export interface PublicMunicipalService {
  id: number
  code: string
  name: string
  description: string | null
  icon: string | null
}

/**
 * Catalogue des services actifs de la ville. Route publique de l'API : aucune
 * session requise, utilisable depuis la landing page.
 */
export function getPublicServices(): Promise<PublicMunicipalService[]> {
  // Repli sur la dernière réponse connue si l'API est lente ou injoignable
  return withStaleFallback("public-services", fetchPublicServices)
}

async function fetchPublicServices(): Promise<PublicMunicipalService[]> {
  if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL n'est pas configurée.")

  const response = await resilientFetch(`${API_URL}/public/services`)
  if (!response.ok) throw new Error(`Erreur ${response.status}`)

  return response.json()
}
