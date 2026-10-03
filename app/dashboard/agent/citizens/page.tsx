import type { Metadata } from "next"
import { CitizenAccounts } from "@/components/agent/citizen-accounts"
import { RequirePermission } from "@/components/dashboard/dashboard-shell"

export const metadata: Metadata = {
  title: "Comptes citoyens | Terra Nova",
  description: "Comptes citoyens : coordonnées et statut, pour les agents municipaux.",
}

export default function AgentCitizensPage() {
  return (
    <RequirePermission permission="agent.citizens.manage">
      <CitizenAccounts />
    </RequirePermission>
  )
}
