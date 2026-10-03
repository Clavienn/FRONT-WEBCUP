import "./terra-nova.css"

import { MotionConfig } from "framer-motion"

import { LandingNavbar } from "@/components/landing/landing-navbar"
import { VoyageSection } from "@/components/landing/voyage-section"
import { ServicesSection } from "@/components/landing/services-section"
import { HowItWorksSection } from "@/components/landing/how-it-works-section"
import { AnnouncementsSection } from "@/components/landing/announcements-section"
import { AudiencesSection } from "@/components/landing/audiences-section"
import { CommitmentsSection } from "@/components/landing/commitments-section"
import { CtaSection } from "@/components/landing/cta-section"
import { LandingFooter } from "@/components/landing/landing-footer"
import { ScrollNavDots } from "@/components/landing/scroll-nav-dots"
import { SocialRail } from "@/components/landing/social-rail"

export default function Page() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="terra-landing">
        <a href="#contenu" className="tn-skip-link">
          Aller au contenu
        </a>

        <div className="tn-grid-overlay" aria-hidden="true" />

        <LandingNavbar />
        <ScrollNavDots />
        <SocialRail />

        <main id="contenu">
          <VoyageSection />
          <ServicesSection />
          <HowItWorksSection />
          <AnnouncementsSection />
          <AudiencesSection />
          <CommitmentsSection />
          <CtaSection />
        </main>

        <LandingFooter />
      </div>
    </MotionConfig>
  )
}
