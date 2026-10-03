export interface NavLink {
  id: string
  href: string
}

export const SITE_NAME = "Terra Nova"

export const NAV_LINKS: NavLink[] = [
  { id: "accueil", href: "#accueil" },
  { id: "presentation", href: "#presentation" },
  { id: "services", href: "#services" },
  { id: "annonces", href: "#annonces" },
  { id: "pour-qui", href: "#pour-qui" },
  { id: "engagements", href: "#engagements" },
]

export interface SocialLink {
  id: string
  label: string
  href: string
  external: boolean
}

export const SOCIAL_LINKS: SocialLink[] = [
  { id: "github", label: "GitHub", href: "#", external: true },
  { id: "webcup", label: "Webcup", href: "#", external: true },
  { id: "contact", label: "Contact", href: "mailto:contact@terra-nova.world", external: false },
]

export const HERO_CONTENT = {
  primaryCta: { href: "/connexion" },
  secondaryCta: { href: "#presentation" },
}

export interface StatItem {
  id: string
  value: number
  suffix?: string
}

export const PRESENTATION_CONTENT = {
  stats: [
    { id: "habitants", value: 12480 },
    { id: "services", value: 86 },
    { id: "quartiers", value: 14 },
    { id: "signalements", value: 3219, suffix: "+" },
  ] satisfies StatItem[],
}

export interface TimelineStep {
  id: string
  number: string
}

export const HOW_IT_WORKS_CONTENT = {
  steps: [
    { id: "acces", number: "01" },
    { id: "explorer", number: "02" },
    { id: "agir", number: "03" },
  ] satisfies TimelineStep[],
}

export interface BenefitGroup {
  id: string
}

export const AUDIENCES_CONTENT = {
  groups: [{ id: "habitants" }, { id: "haut-conseil" }] satisfies BenefitGroup[],
}

export interface CommitmentItem {
  id: string
  icon: "shield" | "accessibility" | "sparkles"
}

export const COMMITMENTS_CONTENT = {
  items: [
    { id: "accessible", icon: "accessibility" },
    { id: "securisee", icon: "shield" },
    { id: "evolutive", icon: "sparkles" },
  ] satisfies CommitmentItem[],
}

export const CTA_CONTENT = {
  href: "/connexion",
}

export const FOOTER_CONTENT = {
  contact: { email: "contact@terra-nova.world" },
  legalLinks: [
    { id: "mentions" },
    { id: "privacy" },
  ],
  webcup: { href: "#" },
}
