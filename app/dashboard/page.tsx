import type { Metadata } from "next"
import { AgentDashboard } from "@/components/dashboard/agent-dashboard"

export const metadata: Metadata = {
  title: "Tableau de bord | Terra Nova",
  description: "Console des agents du Haut Conseil de Terra Nova.",
}

export default function DashboardPage() {
  return <AgentDashboard />
}