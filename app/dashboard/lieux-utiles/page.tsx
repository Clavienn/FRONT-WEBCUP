import type { Metadata } from "next"
import { EstablishmentsFinder } from "@/components/establishments/establishments-finder"
import { RequirePermission } from "@/components/dashboard/dashboard-shell"

export const metadata: Metadata = {
  title: "Lieux utiles | Terra Nova",
  description: "Hôpitaux, services d’urgence et autres lieux utiles de Terra Nova.",
}

export default function EstablishmentsPage() {
  return (
    <RequirePermission permission="citizen.establishments.view">
      <EstablishmentsFinder />
    </RequirePermission>
  )
}
