"use client"

import { ShieldCheck, Accessibility, Sparkles, type LucideIcon } from "lucide-react"

import { COMMITMENTS_CONTENT, type CommitmentItem } from "@/config/landing-content"
import { useLanguage } from "@/components/i18n/language-provider"
import { Reveal } from "@/components/landing/reveal"

const ICONS: Record<CommitmentItem["icon"], LucideIcon> = {
  shield: ShieldCheck,
  accessibility: Accessibility,
  sparkles: Sparkles,
}

export function CommitmentsSection() {
  const { t } = useLanguage()

  return (
    <section id="engagements" className="tn-section" aria-labelledby="engagements-title">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <Reveal>
          <h2 id="engagements-title" className="tn-section-title tn-display max-w-2xl">
            {t("commitments.title")}
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {COMMITMENTS_CONTENT.items.map((item, index) => {
            const Icon = ICONS[item.icon]
            return (
              <Reveal key={item.id} delay={index * 100} className="tn-card h-full">
                <span className="tn-icon-badge">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="tn-display mt-6 text-lg font-semibold text-[var(--tn-text)]">
                  {t(`commitments.items.${item.id}.title`)}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-[var(--tn-text-muted)]">
                  {t(`commitments.items.${item.id}.description`)}
                </p>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
