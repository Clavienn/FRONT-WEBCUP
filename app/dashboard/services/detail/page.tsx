import type { Metadata } from "next"
import { Suspense } from "react"
import { RequirePermission } from "@/components/dashboard/dashboard-shell"
import { ServiceDetail } from "@/components/services/service-detail"

export const metadata: Metadata = {
  title: "Détail du service | Terra Nova",
  description: "Informations utiles sur un service municipal de Terra Nova.",
}

export default function ServiceDetailPage() {
  return (
    <RequirePermission permission="citizen.services.view">
      {/* useSearchParams (?id=) impose une limite Suspense */}
      <Suspense>
        <ServiceDetail />
      </Suspense>
    </RequirePermission>
  )
}
