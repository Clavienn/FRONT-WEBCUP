import { Check } from "lucide-react"

import { AUDIENCES_CONTENT } from "@/config/landing-content"
import { Reveal } from "@/components/landing/reveal"

export function AudiencesSection() {
  return (
    <section id="pour-qui" className="tn-section" aria-labelledby="pour-qui-title">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <Reveal>
          <h2 id="pour-qui-title" className="tn-section-title tn-display max-w-2xl">
            {AUDIENCES_CONTENT.title}
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          {AUDIENCES_CONTENT.groups.map((group, index) => (
            <Reveal key={group.id} delay={index * 120} className="tn-card h-full">
              <h3 className="tn-display text-xl font-semibold text-[var(--tn-text)]">{group.title}</h3>
              <p className="mt-2 text-sm text-[var(--tn-text-muted)]">{group.description}</p>
              <ul className="mt-6 space-y-3">
                {group.benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3 text-sm text-[var(--tn-text-muted)]">
                    <Check className="mt-0.5 size-4 shrink-0 text-[var(--tn-cyan)]" aria-hidden="true" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
