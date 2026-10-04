import type { Metadata } from "next"
import { RequirePermission } from "@/components/dashboard/dashboard-shell"
import { PartnerServicesPanel } from "@/components/partners/partner-services-panel"

export const metadata: Metadata = {
  title: "Mes offres | Terra Nova",
  description: "Gestion des offres de services proposées aux habitants.",
}

export default function PartnerServicesPage() {
  return (
    <RequirePermission permission="partner.services.manage">
      <PartnerServicesPanel />
    </RequirePermission>
  )
}
