"use client"

import { HOW_IT_WORKS_CONTENT } from "@/config/landing-content"
import { useLanguage } from "@/components/i18n/language-provider"
import { Reveal } from "@/components/landing/reveal"
import { TimelineStepItem } from "@/components/landing/timeline-step"

export function HowItWorksSection() {
  const { t } = useLanguage()

  return (
    <section id="parcours" className="tn-section" aria-labelledby="parcours-title">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <Reveal>
          <h2 id="parcours-title" className="tn-section-title tn-display max-w-2xl">
            {t("howItWorks.title")}
          </h2>
        </Reveal>

        <ol className="tn-timeline mt-14">
          {HOW_IT_WORKS_CONTENT.steps.map((step, index) => (
            <TimelineStepItem key={step.id} step={step} delay={index * 120} />
          ))}
        </ol>
      </div>
    </section>
  )
}
