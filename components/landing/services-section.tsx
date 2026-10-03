import { LayoutGrid, Newspaper, MessageCircle, AlertTriangle, Wand2, type LucideIcon } from "lucide-react"

import { SERVICES, type ServiceIcon } from "@/config/services"
import { SERVICES_CONTENT } from "@/config/landing-content"
import { Reveal } from "@/components/landing/reveal"

const ICONS: Record<ServiceIcon, LucideIcon> = {
  grid: LayoutGrid,
  news: Newspaper,
  message: MessageCircle,
  alert: AlertTriangle,
  wand: Wand2,
}

export function ServicesSection() {
  return (
    <section id="services" className="tn-section" aria-labelledby="services-title">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <Reveal>
          <h2 id="services-title" className="tn-section-title tn-display max-w-2xl">
            {SERVICES_CONTENT.title}
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((service, index) => {
            const Icon = ICONS[service.icon]
            return (
              <Reveal key={service.id} delay={index * 80}>
                <a href={service.href} className="tn-card group block h-full">
                  <span className="tn-icon-badge">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="tn-display mt-6 text-lg font-semibold text-[var(--tn-text)]">
                    {service.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--tn-text-muted)]">
                    {service.description}
                  </p>
                </a>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
