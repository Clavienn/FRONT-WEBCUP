"use client"

import { usePathname } from "next/navigation"

import { useAuth } from "@/components/auth/auth-provider"
import { Breadcrumb, type BreadcrumbItem } from "@/components/navigation/breadcrumb"
import { useLanguage } from "@/components/i18n/language-provider"
import { isStaff } from "@/repository/auth.repository"

export function PageBreadcrumb() {
  const pathname = usePathname()
  const { user } = useAuth()
  const { t } = useLanguage()
  const home: BreadcrumbItem = { label: t("sidebar.items.accueil"), href: "/dashboard" }
  const current = (key: string): BreadcrumbItem => ({ label: t(key) })
  const parent = (key: string, href: string): BreadcrumbItem => ({ label: t(key), href })

  let items: BreadcrumbItem[] = []

  switch (pathname) {
    case "/dashboard":
      items = [current("sidebar.items.accueil")]
      break
    case "/profil":
      items = [home, current("sidebar.items.monProfil")]
      break
    case "/dashboard/services":
      items = [home, current("sidebar.items.servicesMunicipaux")]
      break
    case "/dashboard/services/detail":
      items = [home, parent("sidebar.items.servicesMunicipaux", "/dashboard/services"), current("serviceDetail.breadcrumb")]
      break
    case "/dashboard/announcements":
      items = [home, current("sidebar.items.annonces")]
      break
    case "/dashboard/announcements/detail":
      items = [home, parent("sidebar.items.annonces", "/dashboard/announcements"), current("breadcrumbs.announcementDetail")]
      break
    case "/dashboard/my-requests":
      items = [home, current("sidebar.items.mesDemarches")]
      break
    case "/dashboard/appointments":
      items = [home, current(isStaff(user!) ? "sidebar.items.rendezVousCitoyens" : "sidebar.items.mesRendezVous")]
      break
    case "/dashboard/agent/requests":
      items = [home, current("sidebar.items.demandesCitoyennes")]
      break
    case "/dashboard/agent/citizens":
      items = [home, current("sidebar.items.comptesCitoyens")]
      break
    case "/dashboard/agent/activite":
      items = [home, current("sidebar.items.historiqueOperations")]
      break
    case "/dashboard/admin/services":
      items = [home, current("sidebar.items.gererServices")]
      break
    case "/dashboard/admin/messages":
      items = [home, current("sidebar.items.messagesHabitants")]
      break
    case "/dashboard/admin/users":
      items = [home, current("sidebar.items.utilisateurs")]
      break
    case "/dashboard/admin/roles":
      items = [home, current("sidebar.items.roles")]
      break
    case "/dashboard/admin/permissions":
      items = [home, current("sidebar.items.permissions")]
      break
    case "/dashboard/admin/audit":
      items = [home, current("sidebar.items.journalAudit")]
      break
  }

  return <Breadcrumb items={items} />
}