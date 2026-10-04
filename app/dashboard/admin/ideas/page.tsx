import type { Metadata } from "next"
import { IdeasAdmin } from "@/components/admin/ideas-admin"
import { RequireAdmin } from "@/components/dashboard/dashboard-shell"

export const metadata: Metadata = {
  title: "Idées des habitants | Terra Nova",
  description: "Idées proposées par les habitants pour améliorer la ville de Terra Nova.",
}

export default function AdminIdeasPage() {
  return (
    <RequireAdmin>
      <IdeasAdmin />
    </RequireAdmin>
  )
}