"use client"

import { NAV_LINKS } from "@/config/landing-content"
import { useActiveSection } from "@/hooks/use-active-section"

const SECTION_IDS = NAV_LINKS.map((link) => link.id)

export function ScrollNavDots() {
  const activeId = useActiveSection(SECTION_IDS)

  return (
    <nav className="tn-rail tn-rail--dots" aria-label="Pagination des sections">
      {NAV_LINKS.map((link) => (
        <a key={link.id} href={link.href} aria-label={link.label} aria-current={activeId === link.id ? "true" : undefined}>
          <span className="tn-dot" data-active={activeId === link.id} />
        </a>
      ))}
    </nav>
  )
}
