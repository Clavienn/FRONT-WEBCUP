"use client"

import { usePathname } from "next/navigation"
import type { ReactNode } from "react"

import { ThemeToggle } from "@/components/theme-toggle"

const ROUTES_WITHOUT_APP_CHROME = new Set(["/"])

export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const showAppChrome = !ROUTES_WITHOUT_APP_CHROME.has(pathname)

  return (
    <>
      {showAppChrome && <ThemeToggle />}
      {children}
    </>
  )
}
