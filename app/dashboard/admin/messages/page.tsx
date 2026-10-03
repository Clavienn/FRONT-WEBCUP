import type { Metadata } from "next"
import { AdminSupportInbox } from "@/components/support/admin-support-inbox"
import { RequireAdmin } from "@/components/dashboard/dashboard-shell"

export const metadata: Metadata = {
  title: "Messages de support | Terra Nova",
  description: "Boîte de réception des demandes adressées à l’administration de Terra Nova.",
}

export default function AdminMessagesPage() {
  return (
    <RequireAdmin>
      <AdminSupportInbox />
    </RequireAdmin>
  )
}