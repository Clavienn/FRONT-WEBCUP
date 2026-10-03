import type { Metadata } from "next"
import { Suspense } from "react"
import { RequirePermission } from "@/components/dashboard/dashboard-shell"
import { ProjectDetail } from "@/components/projects/project-detail"

export const metadata: Metadata = {
  title: "Projet | Terra Nova",
  description: "Détail d’un projet de Terra Nova et avis des habitants.",
}

export default function ProjectDetailPage() {
  return (
    <RequirePermission permission="citizen.projects.view">
      {/* useSearchParams (?id=) impose une limite Suspense */}
      <Suspense>
        <ProjectDetail />
      </Suspense>
    </RequirePermission>
  )
}
