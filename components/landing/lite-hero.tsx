"use client"

import Link from "next/link"

import { HERO_CONTENT, PRESENTATION_CONTENT } from "@/config/landing-content"
import { useLanguage } from "@/components/i18n/language-provider"

// Remplace la séquence d'images animée (61 images, ~scrollLengthVh) en mode allégé :
// même message essentiel (titre, accroche, CTA, présentation), sans canvas ni réseau.
export function LiteHero() {
  const { t, tList } = useLanguage()
  const heroTitle = t("hero.title")
  const [firstLetter, ...restOfTitle] = heroTitle
  const presentationParagraphs = tList("presentation.paragraphs")
  const statLabels: Record<string, string> = {
    habitants: t("presentation.stats.habitants"),
    services: t("presentation.stats.services"),
    quartiers: t("presentation.stats.quartiers"),
    signalements: t("presentation.stats.signalements"),
  }

  return (
    <>
      <section id="accueil" className="tn-section" aria-label={t("voyage.ariaLabel")}>
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <h1 className="tn-title tn-display">
            <span className="tn-title-accent">{firstLetter}</span>
            {restOfTitle.join("")}
          </h1>
          <p className="tn-lead mt-4 max-w-2xl text-sm leading-relaxed sm:mt-8 sm:text-base">
            {t("hero.tagline")}
          </p>
          <div className="tn-hero-actions mt-6 flex flex-wrap items-center gap-3 sm:mt-10 sm:gap-4">
            <Link href={HERO_CONTENT.primaryCta.href} className="tn-btn tn-btn--primary">
              {t("hero.primaryCta")}
            </Link>
            <a href={HERO_CONTENT.secondaryCta.href} className="tn-btn tn-btn--ghost">
              {t("hero.secondaryCta")}
            </a>
          </div>
        </div>
      </section>

      <section id="presentation" className="tn-section" aria-labelledby="presentation-title">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <h2 id="presentation-title" className="tn-section-title tn-display max-w-2xl">
            {t("presentation.title")}
          </h2>
          <div className="mt-5 grid gap-6 lg:mt-10 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
            <div className="space-y-3 sm:space-y-5">
              {presentationParagraphs.map((paragraph) => (
                <p key={paragraph.slice(0, 24)} className="leading-relaxed text-[var(--tn-text-muted)]">
                  {paragraph}
                </p>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4 sm:gap-8">
              {PRESENTATION_CONTENT.stats.map((stat) => (
                <div key={stat.id} className="flex flex-col gap-2">
                  <span className="tn-stat-value">
                    {stat.value}
                    {stat.suffix}
                  </span>
                  <span className="tn-stat-label">{statLabels[stat.id]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
