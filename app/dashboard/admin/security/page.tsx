import type { Metadata } from "next"
import { SecurityAdmin } from "@/components/admin/security-admin"
import { RequirePermission } from "@/components/dashboard/dashboard-shell"

export const metadata: Metadata = {
  title: "Sécurité | Terra Nova",
  description: "Tentatives de connexion inhabituelles, adresses bloquées et formulaires visés.",
}

export default function AdminSecurityPage() {
  return (
    <RequirePermission permission="admin.users.manage">
      <SecurityAdmin />
    </RequirePermission>
  )
}
