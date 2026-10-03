import { DashboardFrame } from "@/components/dashboard/dashboard-shell"

export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <DashboardFrame>{children}</DashboardFrame>
}
