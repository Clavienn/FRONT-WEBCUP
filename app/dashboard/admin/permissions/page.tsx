import type { Metadata } from "next"
import { PermissionsAdmin } from "@/components/admin/permissions-admin"
import { RequirePermission } from "@/components/dashboard/dashboard-shell"

export const metadata: Metadata = {
  title: "Permissions | Terra Nova",
  description: "Gestion des permissions de la plateforme.",
}

export default function AdminPermissionsPage() {
  return (
    <RequirePermission permission="admin.users.manage">
      <PermissionsAdmin />
    </RequirePermission>
  )
}
