import type { Metadata } from "next"
import { AnnouncementsList } from "@/components/announcements/announcements-list"
import { RequirePermission } from "@/components/dashboard/dashboard-shell"

export const metadata: Metadata = {
  title: "Annonces | Terra Nova",
  description: "Annonces municipales et informations pratiques de Terra Nova.",
}

export default function AnnouncementsPage() {
  return (
    <RequirePermission permission="citizen.announcements.view">
      <AnnouncementsList />
    </RequirePermission>
  )
}
