"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Menu, X, Globe } from "lucide-react"

import { BrandLockup } from "@/components/brand/brand-lockup"
import { NAV_LINKS } from "@/config/landing-content"
import { useLanguage } from "@/components/i18n/language-provider"
import { useActiveSection } from "@/hooks/use-active-section"
import { cn } from "@/lib/utils"

const SECTION_IDS = NAV_LINKS.map((link) => link.id)

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { locale, setLocale, t } = useLanguage()
  const activeId = useActiveSection(SECTION_IDS)
  const firstDrawerLinkRef = useRef<HTMLAnchorElement | null>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => {
    if (!drawerOpen) return

    firstDrawerLinkRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawerOpen(false)
    }
    document.addEventListener("keydown", onKeyDown)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = ""
    }
  }, [drawerOpen])

  return (
    <header className="tn-navbar" data-scrolled={scrolled}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-12">
        <Link
          href="#accueil"
          className="inline-flex items-center text-[var(--tn-text)] transition-opacity hover:opacity-80"
        >
          <BrandLockup
            markClassName="w-6"
            wordmarkClassName="tn-display text-sm font-bold tracking-[0.2em]"
          />
        </Link>

        <ul className="hidden items-center gap-8 lg:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.id}>
              <a href={link.href} className="tn-navlink" data-active={activeId === link.id}>
                {t(`nav.${link.id}`)}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setLocale(locale === "fr" ? "en" : "fr")}
            className="inline-flex items-center gap-1.5 rounded-[var(--tn-radius-sm)] border border-[var(--tn-border)] px-2.5 py-1.5 text-xs font-medium tracking-widest text-[var(--tn-text-muted)] transition-colors hover:border-[var(--tn-border-strong)] hover:text-[var(--tn-text)]"
            aria-label={t("langToggle.ariaLabel")}
          >
            <Globe className="size-3.5" aria-hidden="true" />
            {locale.toUpperCase()}
          </button>

          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="inline-flex size-9 items-center justify-center rounded-[var(--tn-radius-sm)] border border-[var(--tn-border)] text-[var(--tn-text)] transition-colors hover:border-[var(--tn-border-strong)]"
            aria-label={t("navbar.openMenu")}
            aria-expanded={drawerOpen}
            aria-controls="tn-nav-drawer"
          >
            <Menu className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div
        id="tn-nav-drawer"
        className="tn-drawer"
        data-open={drawerOpen}
        role="dialog"
        aria-modal="true"
        aria-label={t("navbar.menuLabel")}
        aria-hidden={!drawerOpen}
      >
        <div className="flex h-full flex-col px-6 py-8">
          <div className="flex items-center justify-between">
            <BrandLockup
              markClassName="w-6"
              wordmarkClassName="tn-display text-sm font-bold tracking-[0.2em]"
            />
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="inline-flex size-9 items-center justify-center rounded-[var(--tn-radius-sm)] border border-[var(--tn-border)] text-[var(--tn-text)]"
              aria-label={t("navbar.closeMenu")}
              tabIndex={drawerOpen ? 0 : -1}
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>

          <nav className="mt-16 flex flex-1 flex-col justify-center gap-6">
            {NAV_LINKS.map((link, index) => (
              <a
                key={link.id}
                href={link.href}
                ref={index === 0 ? firstDrawerLinkRef : undefined}
                onClick={() => setDrawerOpen(false)}
                tabIndex={drawerOpen ? 0 : -1}
                className={cn(
                  "tn-display text-3xl font-semibold uppercase tracking-wide text-[var(--tn-text-muted)] transition-colors hover:text-[var(--tn-text)]",
                  activeId === link.id && "text-[var(--tn-text)]"
                )}
              >
                {t(`nav.${link.id}`)}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </header>
  )
}
