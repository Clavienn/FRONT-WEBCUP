import type { Metadata } from "next"
import { RequirePermission } from "@/components/dashboard/dashboard-shell"
import { ServicesList } from "@/components/services/services-list"

export const metadata: Metadata = {
  title: "Services municipaux | Terra Nova",
  description: "Liste des services municipaux de Terra Nova.",
}

export default function ServicesPage() {
  return (
    <RequirePermission permission="citizen.services.view">
      <ServicesList />
    </RequirePermission>
  )
}
