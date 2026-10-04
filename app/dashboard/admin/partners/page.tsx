import type { Metadata } from "next"
import { PartnersAdmin } from "@/components/admin/partners-admin"
import { RequirePermission } from "@/components/dashboard/dashboard-shell"

export const metadata: Metadata = {
  title: "Partenaires | Terra Nova",
  description: "Comptes des partenaires extérieurs de Terra Nova.",
}

export default function AdminPartnersPage() {
  return (
    <RequirePermission permission="admin.partners.manage">
      <PartnersAdmin />
    </RequirePermission>
  )
}
