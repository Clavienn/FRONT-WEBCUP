"use client"

import { SOCIAL_LINKS } from "@/config/landing-content"
import { useLanguage } from "@/components/i18n/language-provider"

export function SocialRail() {
  const { t } = useLanguage()

  return (
    <nav className="tn-rail tn-rail--links" aria-label={t("socialRail.ariaLabel")}>
      {SOCIAL_LINKS.map((link) => (
        <a
          key={link.id}
          href={link.href}
          className="tn-rail-label"
          {...(link.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {link.label}
        </a>
      ))}
    </nav>
  )
}
