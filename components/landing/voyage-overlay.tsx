"use client"

import Link from "next/link"
import { motion, useReducedMotion, useTransform } from "framer-motion"

import { HERO_CONTENT, PRESENTATION_CONTENT } from "@/config/landing-content"
import { useScrollProgress } from "@/components/landing/scroll-sequence"
import { Counter } from "@/components/landing/counter"

export function VoyageOverlay() {
  const progress = useScrollProgress()
  const reduceMotion = useReducedMotion()
  const [firstLetter, ...restOfTitle] = HERO_CONTENT.title

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
        {HERO_CONTENT.callouts[0]}
      </motion.span>
      <motion.span
        className="tn-callout"
        style={{ top: "62%", left: "66%", opacity: calloutOpacity }}
      >
        {HERO_CONTENT.callouts[1]}
      </motion.span>

      <motion.div
        style={{ opacity: heroOpacity, y: heroY, visibility: heroVisibility }}
        className="mx-auto flex h-full w-full max-w-7xl flex-col justify-center gap-10 px-5 py-24 sm:px-8 lg:px-12"
      >
        <div className="max-w-2xl">
          <p className="tn-kicker">{HERO_CONTENT.kicker}</p>
          <h1 className="tn-title tn-display mt-6">
            <span className="tn-title-accent">{firstLetter}</span>
            {restOfTitle.join("")}
          </h1>
          <p className="tn-lead mt-8">{HERO_CONTENT.tagline}</p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link href={HERO_CONTENT.primaryCta.href} className="tn-btn tn-btn--primary">
              {HERO_CONTENT.primaryCta.label}
            </Link>
            <a href={HERO_CONTENT.secondaryCta.href} className="tn-btn tn-btn--ghost">
              {HERO_CONTENT.secondaryCta.label}
            </a>
          </div>
        </div>

        <div className="tn-glass-panel flex max-w-sm flex-wrap gap-x-6 gap-y-3 px-6 py-5 sm:ml-auto">
          {HERO_CONTENT.glassKeywords.map((keyword) => (
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
        className="absolute inset-0 mx-auto flex h-full w-full max-w-7xl flex-col justify-center px-5 sm:px-8 lg:px-12"
      >
        <h2 className="tn-section-title tn-display max-w-2xl">
          {PRESENTATION_CONTENT.title}
        </h2>

        <div className="mt-10 grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div className="space-y-5">
            {PRESENTATION_CONTENT.paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 24)} className="text-[var(--tn-text-muted)] leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-8">
            {PRESENTATION_CONTENT.stats.map((stat) => (
              <Counter key={stat.id} {...stat} />
            ))}
          </div>
        </div>
      </motion.div>
    </>
  )
}
