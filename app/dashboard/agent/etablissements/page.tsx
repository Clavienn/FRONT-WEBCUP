import type { Metadata } from "next"
import { EstablishmentsAdmin } from "@/components/agent/establishments-admin"
import { RequirePermission } from "@/components/dashboard/dashboard-shell"

export const metadata: Metadata = {
  title: "Gérer les établissements | Terra Nova",
  description: "Adresse et statut des lieux affichés aux habitants.",
}

export default function AgentEstablishmentsPage() {
  return (
    <RequirePermission permission="agent.establishments.manage">
      <EstablishmentsAdmin />
    </RequirePermission>
  )
}
