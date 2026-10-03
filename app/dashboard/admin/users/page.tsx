import type { Metadata } from "next"
import { UsersAdmin } from "@/components/admin/users-admin"
import { RequirePermission } from "@/components/dashboard/dashboard-shell"

export const metadata: Metadata = {
  title: "Utilisateurs | Terra Nova",
  description: "Comptes, rôles et statut des utilisateurs de Terra Nova.",
}

export default function AdminUsersPage() {
  return (
    <RequirePermission permission="admin.users.manage">
      <UsersAdmin />
    </RequirePermission>
  )
}
