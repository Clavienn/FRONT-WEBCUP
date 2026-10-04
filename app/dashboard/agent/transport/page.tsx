import type { Metadata } from "next"
import { RequirePermission } from "@/components/dashboard/dashboard-shell"
import { StaffTransport } from "@/components/transport/staff-transport"

export const metadata: Metadata = {
  title: "Interruptions de transport | Terra Nova",
  description: "Déclarer, modifier et terminer les interruptions du réseau de transport.",
}

export default function AgentTransportPage() {
  return (
    <RequirePermission permission="agent.transport.manage">
      <StaffTransport />
    </RequirePermission>
  )
}
