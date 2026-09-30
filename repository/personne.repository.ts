export interface Personne {
  id: number
  nom: string
  created_at: string
  updated_at: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.message || `Erreur ${res.status}`)
  }
  return (res.status === 204 ? undefined : await res.json()) as T
}

export const personneRepository = {
  getAll: () => request<Personne[]>("/personnes"),
  create: (nom: string) =>
    request<Personne>("/personnes", { method: "POST", body: JSON.stringify({ nom }) }),
  update: (id: number, nom: string) =>
    request<Personne>(`/personnes/${id}`, { method: "PUT", body: JSON.stringify({ nom }) }),
  remove: (id: number) => request<void>(`/personnes/${id}`, { method: "DELETE" }),
}
