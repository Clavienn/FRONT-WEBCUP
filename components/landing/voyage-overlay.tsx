"use client"

import Link from "next/link"
import { motion, useReducedMotion, useTransform } from "framer-motion"

import { HERO_CONTENT, PRESENTATION_CONTENT } from "@/config/landing-content"
import { useLanguage } from "@/components/i18n/language-provider"
import { useScrollProgress } from "@/components/landing/scroll-sequence"
import { Counter } from "@/components/landing/counter"

export function VoyageOverlay() {
  const progress = useScrollProgress()
  const reduceMotion = useReducedMotion()
  const { t, tList } = useLanguage()
  const heroTitle = t("hero.title")
  const [firstLetter, ...restOfTitle] = heroTitle
  const heroKeywords = tList("hero.keywords")
  const heroCallouts = tList("hero.callouts")
  const presentationParagraphs = tList("presentation.paragraphs")
  const statLabels: Record<string, string> = {
    habitants: t("presentation.stats.habitants"),
    services: t("presentation.stats.services"),
    quartiers: t("presentation.stats.quartiers"),
    signalements: t("presentation.stats.signalements"),
  }

  const heroOpacity = useTransform(progress, [0, 0.15, 0.22], [1, 1, 0])
  const heroY = useTransform(progress, [0, 0.22], [0, reduceMotion ? 0 : -40])
  // Faded-out chapters must stop intercepting clicks and tab stops, not just look invisible.
  const heroVisibility = useTransform(heroOpacity, (value) => (value < 0.05 ? "hidden" : "visible"))
  const calloutOpacity = useTransform(progress, [0.22, 0.32, 0.55, 0.62], [0, 1, 1, 0])
  const histoireOpacity = useTransform(progress, [0.62, 0.8], [0, 1])
  const histoireY = useTransform(progress, [0.62, 0.8], [reduceMotion ? 0 : 32, 0])
  const histoireVisibility = useTransform(histoireOpacity, (value) =>
    value < 0.05 ? "hidden" : "visible"
  )

  return (
    <>
      {/* Chapitre 1 — Terra Nova, la ville */}
      <motion.span
        className="tn-callout"
        style={{ top: "18%", left: "58%", opacity: calloutOpacity }}
      >
        {heroCallouts[0]}
      </motion.span>
      <motion.span
        className="tn-callout"
        style={{ top: "62%", left: "66%", opacity: calloutOpacity }}
      >
        {heroCallouts[1]}
      </motion.span>

      <motion.div
        style={{ opacity: heroOpacity, y: heroY, visibility: heroVisibility }}
        className="tn-scrollseq__chapter tn-scrollseq__chapter--hero mx-auto flex h-full w-full max-w-7xl flex-col justify-center gap-5 overflow-y-auto px-5 py-5 sm:gap-8 sm:px-8 sm:py-12 lg:gap-10 lg:px-12 lg:py-24"
      >
        <div className="max-w-2xl">
          <h1 className="tn-title tn-display">
            <span className="tn-title-accent">{firstLetter}</span>
            {restOfTitle.join("")}
          </h1>
          <p className="tn-lead mt-4 text-sm leading-relaxed sm:mt-8 sm:text-base">{t("hero.tagline")}</p>

          <div className="tn-hero-actions mt-6 flex flex-wrap items-center gap-3 sm:mt-10 sm:gap-4">
            <Link href={HERO_CONTENT.primaryCta.href} className="tn-btn tn-btn--primary">
              {t("hero.primaryCta")}
            </Link>
            <a href={HERO_CONTENT.secondaryCta.href} className="tn-btn tn-btn--ghost">
              {t("hero.secondaryCta")}
            </a>
          </div>
        </div>

        <div className="tn-glass-panel flex max-w-sm flex-wrap gap-x-4 gap-y-2 px-4 py-3 sm:ml-auto sm:gap-x-6 sm:gap-y-3 sm:px-6 sm:py-5">
          {heroKeywords.map((keyword) => (
            <span
              key={keyword}
              className="text-xs font-medium tracking-[0.18em] text-[var(--tn-text-muted)] uppercase"
            >
              {keyword}
            </span>
          ))}
        </div>
      </motion.div>

      {/* Chapitre 2 — Notre histoire */}
      <motion.div
        style={{ opacity: histoireOpacity, y: histoireY, visibility: histoireVisibility }}
        className="tn-scrollseq__chapter tn-scrollseq__chapter--story absolute inset-0 mx-auto flex h-full w-full max-w-7xl flex-col justify-center overflow-y-auto px-5 py-6 sm:px-8 sm:py-10 lg:px-12"
      >
        <h2 className="tn-section-title tn-display max-w-2xl">
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
              <Counter key={stat.id} value={stat.value} suffix={stat.suffix} label={statLabels[stat.id]} />
            ))}
          </div>
        </div>
      </motion.div>
    </>
  )
}
