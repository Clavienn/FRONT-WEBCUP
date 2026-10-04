import type { Metadata } from "next"
import { RequirePermission } from "@/components/dashboard/dashboard-shell"
import { PartnerCatalog } from "@/components/partners/partner-catalog"

export const metadata: Metadata = {
  title: "Partenaires | Terra Nova",
  description: "Offres des partenaires extérieurs de la ville de Terra Nova.",
}

export default function PartnersPage() {
  return (
    <RequirePermission permission="citizen.partners.view">
      <PartnerCatalog />
    </RequirePermission>
  )
}
