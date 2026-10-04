import type { Metadata } from "next"
import { PublicAlertsPage } from "@/components/alerts/public-alerts-page"

export const metadata: Metadata = {
  title: "Alertes à la population | Terra Nova",
  description: "Alertes en cours dans les quartiers de Terra Nova : ce qui se passe et ce qu'il faut faire.",
}

export default function AlertesPage() {
  return <PublicAlertsPage />
}
