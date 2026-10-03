import type { Metadata } from "next"
import { AppointmentsView } from "@/components/appointments/appointments-view"

export const metadata: Metadata = {
  title: "Rendez-vous | Terra Nova",
  description: "Prise de rendez-vous avec un agent de Terra Nova.",
}

export default function AppointmentsPage() {
  return <AppointmentsView />
}
