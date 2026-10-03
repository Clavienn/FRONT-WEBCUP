"use client"

import { useAuth } from "@/components/auth/auth-provider"
import { AgentAppointmentsPanel } from "@/components/appointments/agent-appointments-panel"
import { CitizenAppointments } from "@/components/appointments/citizen-appointments"
import { RequirePermission } from "@/components/dashboard/dashboard-shell"
import { isStaff } from "@/repository/auth.repository"

// Une seule route : le citoyen réserve, l'agent gère ses créneaux — comme /dashboard
// qui bascule déjà entre CitizenDashboard et AgentDashboard selon le rôle connecté.
export function AppointmentsView() {
  const { user } = useAuth()
  if (!user) return null

  if (isStaff(user)) {
    return (
      <RequirePermission permission="agent.appointments.view">
        <AgentAppointmentsPanel />
      </RequirePermission>
    )
  }

  return (
    <RequirePermission permission="citizen.appointments.view">
      <CitizenAppointments />
    </RequirePermission>
  )
}
