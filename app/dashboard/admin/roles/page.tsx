import type { Metadata } from "next"
import { RolesAdmin } from "@/components/admin/roles-admin"
import { RequirePermission } from "@/components/dashboard/dashboard-shell"

export const metadata: Metadata = {
  title: "Rôles | Terra Nova",
  description: "Gestion des rôles et de leurs permissions.",
}

export default function AdminRolesPage() {
  return (
    <RequirePermission permission="admin.users.manage">
      <RolesAdmin />
    </RequirePermission>
  )
}
