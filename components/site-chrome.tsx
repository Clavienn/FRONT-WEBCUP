"use client"

import { usePathname } from "next/navigation"
import type { ReactNode } from "react"

import { AccessibilityToggle } from "@/components/accessibility-toggle"
import { ThemeToggle } from "@/components/theme-toggle"

// La landing affiche déjà son propre switch de langue dans la navbar
const ROUTES_WITHOUT_APP_CHROME = new Set(["/"])

// Ces routes sont rendues dans DashboardFrame, dont le sidebarfooter porte le thème et la langue
const ROUTES_WITH_SIDEBAR_SETTINGS = ["/profil", "/dashboard"]

export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const showAppChrome = !ROUTES_WITHOUT_APP_CHROME.has(pathname)
  const hasSidebarSettings = ROUTES_WITH_SIDEBAR_SETTINGS.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  )

  return (
    <>
      {showAppChrome && !hasSidebarSettings && (
        <>
          <ThemeToggle />
          <AccessibilityToggle />
        </>
      )}
      {children}
    </>
  )
}