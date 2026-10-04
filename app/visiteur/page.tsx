import type { Metadata } from "next"

import { VisitorDashboard } from "@/components/visitor/visitor-dashboard"

export const metadata: Metadata = {
  title: "Espace visiteur | Terra Nova",
  description: "Découverte en lecture seule des services, annonces et projets publics de Terra Nova.",
}

export default function VisitorPage() {
  return <VisitorDashboard />
}