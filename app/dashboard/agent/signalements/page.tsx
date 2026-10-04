import type { Metadata } from "next"
import { RequirePermission } from "@/components/dashboard/dashboard-shell"
import { StaffSignalements } from "@/components/signalements/staff-signalements"

export const metadata: Metadata = {
  title: "Signalements | Terra Nova",
  description: "Urgences et incidents signalés par les habitants, triés par ordre d'attention.",
}

export default function AgentSignalementsPage() {
  return (
    <RequirePermission permission="agent.signalements.view">
      <StaffSignalements />
    </RequirePermission>
  )
}
