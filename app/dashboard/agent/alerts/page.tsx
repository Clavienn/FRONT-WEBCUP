import type { Metadata } from "next"
import { Suspense } from "react"
import { RequirePermission } from "@/components/dashboard/dashboard-shell"
import { StaffAlerts } from "@/components/alerts/staff-alerts"

export const metadata: Metadata = {
  title: "Alertes à la population | Terra Nova",
  description: "Publier, mettre à jour et terminer les alertes envoyées aux habitants.",
}

export default function AgentAlertsPage() {
  return (
    <RequirePermission permission="agent.alerts.manage">
      {/* useSearchParams (formulaire pré-rempli depuis un point chaud) impose une limite Suspense */}
      <Suspense>
        <StaffAlerts />
      </Suspense>
    </RequirePermission>
  )
}
