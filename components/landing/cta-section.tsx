import Link from "next/link"

import { CTA_CONTENT } from "@/config/landing-content"
import { Reveal } from "@/components/landing/reveal"

export function CtaSection() {
  return (
    <section className="tn-section" aria-labelledby="cta-title">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <Reveal className="tn-cta-band flex flex-col items-center gap-8 px-6 py-16 text-center sm:px-16">
          <h2 id="cta-title" className="tn-display max-w-3xl text-2xl font-bold uppercase tracking-wide sm:text-3xl">
            {CTA_CONTENT.title}
            <br />
            <span className="text-[var(--tn-cyan)]">{CTA_CONTENT.highlight}</span>
          </h2>
          <Link href={CTA_CONTENT.cta.href} className="tn-btn tn-btn--primary">
            {CTA_CONTENT.cta.label}
          </Link>
        </Reveal>
      </div>
    </section>
  )
}
