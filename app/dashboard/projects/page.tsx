import type { Metadata } from "next"
import { ProjectList } from "@/components/projects/project-list"
import { RequirePermission } from "@/components/dashboard/dashboard-shell"

export const metadata: Metadata = {
  title: "Projets de la ville | Terra Nova",
  description: "Les projets en cours à Terra Nova.",
}

export default function ProjectsPage() {
  return (
    <RequirePermission permission="citizen.projects.view">
      <ProjectList />
    </RequirePermission>
  )
}
