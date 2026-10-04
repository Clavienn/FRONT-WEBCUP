"use client"

import "./terra-nova.css"

import { MotionConfig } from "framer-motion"

import { useLanguage } from "@/components/i18n/language-provider"
import { AlertBanner } from "@/components/alerts/alert-banner"
import { useLiteMode } from "@/components/lite-mode/lite-mode-provider"
import { LandingNavbar } from "@/components/landing/landing-navbar"
import { VoyageSection } from "@/components/landing/voyage-section"
import { LiteHero } from "@/components/landing/lite-hero"
import { ServicesSection } from "@/components/landing/services-section"
import { HowItWorksSection } from "@/components/landing/how-it-works-section"
import { AnnouncementsSection } from "@/components/landing/announcements-section"
import { ProjectsSection } from "@/components/landing/projects-section"
import { AudiencesSection } from "@/components/landing/audiences-section"
import { CommitmentsSection } from "@/components/landing/commitments-section"
import { CtaSection } from "@/components/landing/cta-section"
import { LandingFooter } from "@/components/landing/landing-footer"
import { ScrollNavDots } from "@/components/landing/scroll-nav-dots"
import { SocialRail } from "@/components/landing/social-rail"

export default function Page() {
  const { t } = useLanguage()
  const { liteMode } = useLiteMode()

  return (
    <MotionConfig reducedMotion={liteMode ? "always" : "user"}>
      <div className="terra-landing">
        <a href="#contenu" className="tn-skip-link">
          {t("skipLink")}
        </a>

        <div className="tn-grid-overlay" aria-hidden="true" />

        <LandingNavbar />
        <AlertBanner variant="floating" />
        <ScrollNavDots />
        <SocialRail />
        {!liteMode && <ScrollNavDots />}
        {!liteMode && <SocialRail />}

        <main id="contenu">
          {liteMode ? <LiteHero /> : <VoyageSection />}
          <ServicesSection />
          <HowItWorksSection />
          <AnnouncementsSection />
          <ProjectsSection />
          <AudiencesSection />
          <CommitmentsSection />
          <CtaSection />
        </main>

        <LandingFooter />
      </div>
    </MotionConfig>
  )
}
