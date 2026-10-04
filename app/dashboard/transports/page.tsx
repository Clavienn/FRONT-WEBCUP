import type { Metadata } from "next"
import { Suspense } from "react"
import { TransportView } from "@/components/transport/transport-view"

export const metadata: Metadata = {
  title: "Transports | Terra Nova",
  description: "État des lignes, prochains passages et trajet de remplacement en cas d'interruption.",
}

export default function DashboardTransportsPage() {
  return (
    <Suspense>
      <TransportView />
    </Suspense>
  )
}
