import type { Metadata } from "next"
import { ServicesAdmin } from "@/components/admin/services-admin"
import { RequirePermission } from "@/components/dashboard/dashboard-shell"

export const metadata: Metadata = {
  title: "Gérer les services | Terra Nova",
  description: "Administration des services municipaux de Terra Nova.",
}

export default function AdminServicesPage() {
  return (
    <RequirePermission permission="admin.services.manage">
      <ServicesAdmin />
    </RequirePermission>
  )
}
