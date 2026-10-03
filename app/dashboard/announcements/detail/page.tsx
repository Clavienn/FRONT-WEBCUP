import type { Metadata } from "next"
import { Suspense } from "react"
import { AnnouncementDetail } from "@/components/announcements/announcement-detail"
import { RequirePermission } from "@/components/dashboard/dashboard-shell"

export const metadata: Metadata = {
  title: "Annonce | Terra Nova",
  description: "Contenu d’une annonce municipale de Terra Nova.",
}

export default function AnnouncementDetailPage() {
  return (
    <RequirePermission permission="citizen.announcements.view">
      {/* useSearchParams (?id=) impose une limite Suspense */}
      <Suspense>
        <AnnouncementDetail />
      </Suspense>
    </RequirePermission>
  )
}
