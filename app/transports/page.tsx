import type { Metadata } from "next"
import { Suspense } from "react"
import { PublicTransportPage } from "@/components/transport/public-transport-page"

export const metadata: Metadata = {
  title: "Transports | Terra Nova",
  description: "État des lignes, prochains passages et trajet de remplacement en cas d'interruption.",
}

export default function TransportsPage() {
  return (
    // useSearchParams (?tab=journey) impose une limite Suspense
    <Suspense>
      <PublicTransportPage />
    </Suspense>
  )
}
