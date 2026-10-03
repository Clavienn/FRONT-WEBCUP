import type { Metadata } from "next"
import { AuditAdmin } from "@/components/admin/audit-admin"
import { RequirePermission } from "@/components/dashboard/dashboard-shell"

export const metadata: Metadata = {
  title: "Journal d’audit | Terra Nova",
  description: "Actions effectuées par les utilisateurs de la plateforme Terra Nova.",
}

export default function AdminAuditPage() {
  return (
    <RequirePermission permission="admin.users.manage">
      <AuditAdmin />
    </RequirePermission>
  )
}
