"use client"

import Link from "next/link"
import { Mail } from "lucide-react"

import { FOOTER_CONTENT, NAV_LINKS, SITE_NAME } from "@/config/landing-content"
import { useLanguage } from "@/components/i18n/language-provider"

export function LandingFooter() {
  const { t } = useLanguage()

  return (
    <footer className="tn-footer" aria-label="Pied de page">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-12">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <span className="tn-display text-sm font-bold tracking-[0.2em] text-[var(--tn-text)]">
              {SITE_NAME.toUpperCase()}
            </span>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-[var(--tn-text-muted)]">
              {t("footer.description")}
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold tracking-widest text-[var(--tn-text)] uppercase">
              {t("footer.navigationHeading")}
            </h3>
            <ul className="mt-4 space-y-2">
              {NAV_LINKS.map((link) => (
                <li key={link.id}>
                  <a href={link.href} className="text-sm text-[var(--tn-text-muted)] hover:text-[var(--tn-text)]">
                    {t(`nav.${link.id}`)}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold tracking-widest text-[var(--tn-text)] uppercase">
              {t("footer.contactHeading")}
            </h3>
            <ul className="mt-4 space-y-2">
              <li>
                <a
                  href={`mailto:${FOOTER_CONTENT.contact.email}`}
                  className="inline-flex items-center gap-2 text-sm text-[var(--tn-text-muted)] hover:text-[var(--tn-text)]"
                >
                  <Mail className="size-4" aria-hidden="true" />
                  {t("footer.contactLabel")}
                </a>
              </li>
              {FOOTER_CONTENT.legalLinks.map((link) => (
                <li key={link.id}>
                  <a href={link.href} className="text-sm text-[var(--tn-text-muted)] hover:text-[var(--tn-text)]">
                    {t(`footer.legal.${link.id}`)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-[var(--tn-border)] pt-8 text-xs text-[var(--tn-text-faint)] sm:flex-row sm:items-center sm:justify-between">
          <p>
            {t("footer.credits.team")} — {t("footer.credits.event")}
          </p>
          <Link
            href={FOOTER_CONTENT.webcup.href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--tn-text-muted)] hover:text-[var(--tn-text)]"
          >
            {t("footer.webcupLabel")} ↗
          </Link>
        </div>
      </div>
    </footer>
  )
}
