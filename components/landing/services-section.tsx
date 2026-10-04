"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronDown } from "lucide-react"

import { useAuth } from "@/components/auth/auth-provider"
import { getPublicServices, type PublicMunicipalService } from "@/lib/services/municipalServices"
import { ServiceIcon } from "@/components/services/service-icon"
import { useLanguage } from "@/components/i18n/language-provider"
import { Reveal } from "@/components/landing/reveal"

type Status = "loading" | "error" | "empty" | "success"

// Au-delà de ce nombre, les cartes suivantes restent repliées derrière "Voir plus" :
// la page reste lisible en un coup d'œil même si la ville ajoute des services.
const VISIBLE_COUNT = 3

function ServiceCard({ service }: { service: PublicMunicipalService }) {
  const { user, isLoading } = useAuth()
  // Connecté : droit au détail du service. Visiteur : connexion d'abord. Pendant la vérification de la session,
  // on pointe vers le détail : l'espace connecté renvoie lui-même un visiteur vers /connexion.
  const href = user || isLoading ? `/dashboard/services/detail?id=${service.id}` : "/connexion"
  return (
    <Link href={href} className="tn-card group block h-full">
      <span className="tn-icon-badge">
        <ServiceIcon name={service.icon} className="size-5" />
      </span>
      <h3 className="tn-display mt-6 text-lg font-semibold text-[var(--tn-text)]">{service.name}</h3>
      {service.description && (
        <p className="mt-3 text-sm leading-relaxed text-[var(--tn-text-muted)]">{service.description}</p>
      )}
    </Link>
  )
}

export function ServicesSection() {
  const { t } = useLanguage()
  const [status, setStatus] = useState<Status>("loading")
  const [services, setServices] = useState<PublicMunicipalService[]>([])
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    let cancelled = false

    getPublicServices()
      .then((data) => {
        if (cancelled) return
        setServices(data)
        setStatus(data.length === 0 ? "empty" : "success")
      })
      .catch(() => {
        if (!cancelled) setStatus("error")
      })

    return () => {
      cancelled = true
    }
  }, [])

  const primary = services.slice(0, VISIBLE_COUNT)
  const extra = services.slice(VISIBLE_COUNT)

  return (
    <section id="services" className="tn-section" aria-labelledby="services-title">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <Reveal>
          <h2 id="services-title" className="tn-section-title tn-display max-w-2xl">
            {t("servicesSection.title")}
          </h2>
        </Reveal>

        <div className="mt-12" aria-live="polite">
          {status === "loading" && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((index) => (
                <div key={index} className="tn-skeleton h-44" aria-hidden="true" />
              ))}
            </div>
          )}

          {status === "error" && (
            <p className="tn-card max-w-md text-sm text-[var(--tn-text-muted)]" role="alert">
              {t("servicesSection.error")}
            </p>
          )}

          {status === "empty" && (
            <p className="tn-card max-w-md text-sm text-[var(--tn-text-muted)]">{t("servicesSection.empty")}</p>
          )}

          {status === "success" && (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {primary.map((service, index) => (
                  <Reveal key={service.id} delay={index * 80}>
                    <ServiceCard service={service} />
                  </Reveal>
                ))}

                <AnimatePresence>
                  {expanded &&
                    extra.map((service, index) => (
                      <motion.div
                        key={service.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 12 }}
                        transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1], delay: (index * 60) / 1000 }}
                      >
                        <ServiceCard service={service} />
                      </motion.div>
                    ))}
                </AnimatePresence>
              </div>

              {extra.length > 0 && (
                <div className="mt-10 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setExpanded((value) => !value)}
                    aria-expanded={expanded}
                    className="inline-flex items-center gap-2 text-sm font-medium text-[var(--tn-text)] underline-offset-4 hover:underline"
                  >
                    {expanded ? t("servicesSection.showLess") : t("servicesSection.showMore")}
                    <ChevronDown
                      className={`size-4 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
                      aria-hidden="true"
                    />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  )
}
