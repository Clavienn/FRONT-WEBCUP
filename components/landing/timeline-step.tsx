"use client"

import { motion } from "framer-motion"

import type { TimelineStep } from "@/config/landing-content"
import { useLanguage } from "@/components/i18n/language-provider"

export function TimelineStepItem({ step, delay }: { step: TimelineStep; delay: number }) {
  const { t } = useLanguage()

  return (
    <motion.li
      className="tn-timeline-step"
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.7, ease: [0.19, 1, 0.22, 1], delay: delay / 1000 }}
    >
      <span className="tn-timeline-number tn-display">{step.number}</span>
      <h3 className="mt-3 text-lg font-semibold text-[var(--tn-text)]">{t(`howItWorks.steps.${step.id}.title`)}</h3>
      <p className="mt-3 max-w-xs text-sm leading-relaxed text-[var(--tn-text-muted)]">
        {t(`howItWorks.steps.${step.id}.description`)}
      </p>
    </motion.li>
  )
}
