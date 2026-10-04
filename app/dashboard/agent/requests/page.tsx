import type { Metadata } from "next"
import { RequirePermission } from "@/components/dashboard/dashboard-shell"
import { AgentRequestsPageHeader } from "@/components/requests/agent-requests-page-header"
import { AgentRequestsPanel } from "@/components/requests/agent-requests-panel"

export const metadata: Metadata = {
  title: "Demandes citoyennes | Terra Nova",
  description: "Demandes déposées par les citoyens de Terra Nova : prise en charge et traitement.",
}

export default function AgentRequestsPage() {
  return (
    <RequirePermission permission="agent.requests.view">
      <AgentRequestsPageHeader />
      <AgentRequestsPanel initialStatus="all" initialSortByPriority hideHeading />
    </RequirePermission>
  )
}
