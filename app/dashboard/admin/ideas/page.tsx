import type { Metadata } from "next"
import { IdeasAdmin } from "@/components/admin/ideas-admin"
import { RequirePermission } from "@/components/dashboard/dashboard-shell"

export const metadata: Metadata = {
  title: "Idées des habitants | Terra Nova",
  description: "Idées proposées par les habitants pour améliorer la ville de Terra Nova.",
}

// Même permission que l'entrée de menu correspondante (dashboard-shell.tsx) : l'écran des idées
// s'ouvre sur un droit, pas sur le rôle. Le rôle seul rendait l'accès dépendant du rôle
// « administrateur » alors que la décision d'afficher le lien était déjà prise sur la permission —
// d'où un lien visible qui refusait l'accès, ou une page atteignable que le menu ne montrait pas.
export default function AdminIdeasPage() {
  return (
    <RequirePermission permission="admin.ideas.manage">
      <IdeasAdmin />
    </RequirePermission>
  )
}