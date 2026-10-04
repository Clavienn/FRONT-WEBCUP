import type { Metadata } from "next"
import { RequirePermission } from "@/components/dashboard/dashboard-shell"
import { AgentRequestsPanel } from "@/components/requests/agent-requests-panel"

export const metadata: Metadata = {
  title: "Demandes citoyennes | Terra Nova",
  description: "Demandes déposées par les citoyens de Terra Nova : prise en charge et traitement.",
}

export default function AgentRequestsPage() {
  return (
    <RequirePermission permission="agent.requests.view">
      <section>
        <p className="text-sm font-medium text-primary">Console des agents</p>
        <h1 className="mt-1 text-3xl font-medium tracking-tight sm:text-4xl">Demandes citoyennes</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Toutes les demandes déposées par les citoyens. Prenez-en une en charge, faites évoluer son état et laissez une
          note : le citoyen suit l’avancement depuis son espace.
        </p>
      </section>
      <AgentRequestsPanel initialStatus="all" initialSortByPriority hideHeading />
    </RequirePermission>
  )
}
