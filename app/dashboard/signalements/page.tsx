import type { Metadata } from "next"
import { RequirePermission } from "@/components/dashboard/dashboard-shell"
import { MySignalements } from "@/components/signalements/my-signalements"

export const metadata: Metadata = {
  title: "Signaler une urgence | Terra Nova",
  description: "Signalez une urgence ou un incident et suivez sa prise en charge.",
}

export default function SignalementsPage() {
  return (
    <RequirePermission permission="citizen.signalements.view">
      <MySignalements />
    </RequirePermission>
  )
}
