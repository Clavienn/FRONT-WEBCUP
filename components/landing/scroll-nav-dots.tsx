"use client"

import { NAV_LINKS } from "@/config/landing-content"
import { useLanguage } from "@/components/i18n/language-provider"
import { useActiveSection } from "@/hooks/use-active-section"

const SECTION_IDS = NAV_LINKS.map((link) => link.id)

export function ScrollNavDots() {
  const { t } = useLanguage()
  const activeId = useActiveSection(SECTION_IDS)

  return (
    <nav className="tn-rail tn-rail--dots" aria-label={t("scrollNav.ariaLabel")}>
      {NAV_LINKS.map((link) => (
        <a key={link.id} href={link.href} aria-label={t(`nav.${link.id}`)} aria-current={activeId === link.id ? "true" : undefined}>
          <span className="tn-dot" data-active={activeId === link.id} />
        </a>
      ))}
    </nav>
  )
}
