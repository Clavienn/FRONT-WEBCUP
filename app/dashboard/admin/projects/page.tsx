import type { Metadata } from "next"
import { ProjectsAdmin } from "@/components/admin/projects-admin"
import { RequirePermission } from "@/components/dashboard/dashboard-shell"

export const metadata: Metadata = {
  title: "Gérer les projets | Terra Nova",
  description: "Administration des projets de Terra Nova.",
}

export default function AdminProjectsPage() {
  return (
    <RequirePermission permission="admin.projects.manage">
      <ProjectsAdmin />
    </RequirePermission>
  )
}
