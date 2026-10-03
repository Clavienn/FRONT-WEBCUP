import type { Metadata } from "next"
import { ActivityLog } from "@/components/agent/activity-log"
import { RequirePermission } from "@/components/dashboard/dashboard-shell"

export const metadata: Metadata = {
  title: "Historique des opérations | Terra Nova",
  description: "Opérations effectuées sur la plateforme Terra Nova, consultables et tracées dans le temps.",
}

export default function AgentActivityPage() {
  return (
    <RequirePermission permission="agent.activity.view">
      <ActivityLog />
    </RequirePermission>
  )
}