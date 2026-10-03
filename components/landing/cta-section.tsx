"use client"

import Link from "next/link"

import { CTA_CONTENT } from "@/config/landing-content"
import { useLanguage } from "@/components/i18n/language-provider"
import { Reveal } from "@/components/landing/reveal"

export function CtaSection() {
  const { t } = useLanguage()

  return (
    <section className="tn-section" aria-labelledby="cta-title">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <Reveal className="tn-cta-band flex flex-col items-center gap-8 px-6 py-16 text-center sm:px-16">
          <h2 id="cta-title" className="tn-display max-w-3xl text-3xl font-bold uppercase tracking-wide">
            {t("cta.title")}
            <br />
            <span className="text-[var(--tn-cyan)]">{t("cta.highlight")}</span>
          </h2>
          <Link href={CTA_CONTENT.href} className="tn-btn tn-btn--primary">
            {t("cta.ctaLabel")}
          </Link>
        </Reveal>
      </div>
    </section>
  )
}
