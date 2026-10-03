import type { Metadata } from "next"
import { RequirePermission } from "@/components/dashboard/dashboard-shell"
import { AdminSupportInbox } from "@/components/support/admin-support-inbox"

export const metadata: Metadata = {
  title: "Demandes des citoyens | Terra Nova",
  description: "Messages adressés aux services municipaux par les citoyens de Terra Nova.",
}

export default function AgentRequestsPage() {
  return (
    <RequirePermission permission="agent.messages.manage">
      <AdminSupportInbox
        eyebrow="Console des agents"
        title="Demandes des citoyens"
        description="Consultez les demandes envoyées par les habitants et suivez leur traitement : nouveau, lu ou traité."
      />
    </RequirePermission>
  )
}
