import type { Metadata } from "next"
import { RequirePermission } from "@/components/dashboard/dashboard-shell"
import { PartnerRequestsPanel } from "@/components/partners/partner-requests-panel"

export const metadata: Metadata = {
  title: "Demandes des habitants | Terra Nova",
  description: "Demandes reçues sur les offres de services partenaires.",
}

export default function PartnerRequestsPage() {
  return (
    <RequirePermission permission="partner.requests.view">
      <PartnerRequestsPanel />
    </RequirePermission>
  )
}
