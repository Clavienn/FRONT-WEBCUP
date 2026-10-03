import type { Metadata } from "next"
import { RequirePermission } from "@/components/dashboard/dashboard-shell"
import { CitizenRequestsPanel } from "@/components/requests/citizen-requests-panel"

export const metadata: Metadata = {
  title: "Mes démarches | Terra Nova",
  description: "Suivi de vos demandes adressées à la ville de Terra Nova.",
}

export default function MyRequestsPage() {
  return (
    <RequirePermission permission="citizen.requests.view">
      <section>
        <p className="text-sm font-medium text-primary">Espace citoyen</p>
        <h1 className="mt-1 text-3xl font-medium tracking-tight sm:text-4xl">Mes démarches</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Déposez une demande à la ville et suivez son évolution étape par étape.
        </p>
      </section>
      <CitizenRequestsPanel />
    </RequirePermission>
  )
}
