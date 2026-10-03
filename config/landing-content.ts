export interface NavLink {
  id: string
  label: string
  href: string
}

export const SITE_NAME = "Terra Nova"

export const NAV_LINKS: NavLink[] = [
  { id: "accueil", label: "Accueil", href: "#accueil" },
  { id: "presentation", label: "Présentation", href: "#presentation" },
  { id: "services", label: "Services", href: "#services" },
  { id: "parcours", label: "Parcours", href: "#parcours" },
  { id: "actualites", label: "Actualités", href: "#actualites" },
  { id: "pour-qui", label: "Pour qui ?", href: "#pour-qui" },
  { id: "engagements", label: "Engagements", href: "#engagements" },
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
  kicker: "Terra Nova",
  title: "La première ville",
  tagline:
    "Après des générations de voyage, l'humanité a posé ses fondations sur un nouveau monde. Terra Nova est le cœur numérique de cette ville naissante : un point d'accès unique à ses services, à sa vie collective et à son avenir.",
  primaryCta: { label: "Entrer dans la ville", href: "/connexion" },
  secondaryCta: { label: "Découvrir", href: "#presentation" },
  glassKeywords: ["Services", "Communication", "Évolution"],
  callouts: [
    "Atmosphère stabilisée",
    "Réseau civique actif",
  ],
}

export interface StatItem {
  id: string
  value: number
  suffix?: string
  label: string
}

export const PRESENTATION_CONTENT = {
  title: "Une humanité qui recommence, une ville qui s'invente",
  paragraphs: [
    "Terra Nova est née de l'arrivée des premiers colons sur ce monde encore vierge. En quelques saisons, les abris provisoires sont devenus des quartiers, et les quartiers une véritable cité.",
    "Une société nouvelle s'organise : elle a besoin de se coordonner, de s'informer et de se faire entendre. C'est pour répondre à ces besoins que la plateforme Terra Nova a été conçue, à la demande du Haut Conseil.",
  ],
  stats: [
    { id: "habitants", value: 12480, label: "Habitants recensés" },
    { id: "services", value: 86, label: "Services actifs" },
    { id: "quartiers", value: 14, label: "Quartiers fondés" },
    { id: "signalements", value: 3219, suffix: "+", label: "Signalements traités" },
  ] satisfies StatItem[],
}

export const SERVICES_CONTENT = {
  title: "Tout ce dont vous avez besoin, en un seul endroit",
}

export interface TimelineStep {
  id: string
  number: string
  title: string
  description: string
}

export const HOW_IT_WORKS_CONTENT = {
  title: "Comment ça marche",
  steps: [
    {
      id: "acces",
      number: "01",
      title: "Créer son accès",
      description:
        "Déclarez-vous auprès de Terra Nova et obtenez votre identité numérique de citoyen, valable dans tous les services de la ville.",
    },
    {
      id: "explorer",
      number: "02",
      title: "Explorer les services",
      description:
        "Parcourez les services municipaux, les actualités du Haut Conseil et les initiatives de votre quartier, le tout depuis un espace unique.",
    },
    {
      id: "agir",
      number: "03",
      title: "Agir",
      description:
        "Signalez un problème, prenez part aux décisions collectives et contribuez concrètement à la construction de la ville.",
    },
  ] satisfies TimelineStep[],
}

export const ANNOUNCEMENTS_CONTENT = {
  title: "Les annonces du Haut Conseil",
  errorMessage:
    "Les annonces du Haut Conseil sont momentanément indisponibles. Merci de réessayer plus tard.",
  emptyMessage: "Aucune annonce du Haut Conseil pour le moment. Revenez bientôt.",
}

export interface BenefitGroup {
  id: string
  title: string
  description: string
  benefits: string[]
}

export const AUDIENCES_CONTENT = {
  title: "Une plateforme pensée pour chacun",
  groups: [
    {
      id: "habitants",
      title: "Habitants",
      description: "Votre quotidien sur Terra Nova, simplifié.",
      benefits: [
        "Un accès unique à tous les services municipaux",
        "Des actualités fiables, directement du Haut Conseil",
        "Un canal direct pour signaler et faire remonter les problèmes",
      ],
    },
    {
      id: "haut-conseil",
      title: "Haut Conseil",
      description: "Piloter la ville avec des données fiables et à jour.",
      benefits: [
        "Une diffusion rapide et maîtrisée des annonces officielles",
        "Une vision claire des signalements et des besoins des quartiers",
        "Un lien de confiance renforcé avec les habitants",
      ],
    },
  ] satisfies BenefitGroup[],
}

export interface CommitmentItem {
  id: string
  icon: "shield" | "accessibility" | "sparkles"
  title: string
  description: string
}

export const COMMITMENTS_CONTENT = {
  title: "Les fondations de Terra Nova",
  items: [
    {
      id: "accessible",
      icon: "accessibility",
      title: "Accessible",
      description:
        "Conçue pour tous les habitants, quel que soit leur équipement ou leurs besoins, avec une navigation claire et au clavier.",
    },
    {
      id: "securisee",
      icon: "shield",
      title: "Sécurisée",
      description:
        "Les données des citoyens et les échanges avec le Haut Conseil sont protégés à chaque étape de leur parcours.",
    },
    {
      id: "evolutive",
      icon: "sparkles",
      title: "Évolutive",
      description:
        "Terra Nova grandit avec la ville : de nouveaux services et quartiers s'ajoutent à mesure que la colonie se développe.",
    },
  ] satisfies CommitmentItem[],
}

export const CTA_CONTENT = {
  title: "Terra Nova est en train d'écrire son histoire.",
  highlight: "À vous d'en construire le cœur numérique.",
  cta: { label: "Entrer dans la ville", href: "/connexion" },
}

export const FOOTER_CONTENT = {
  description:
    "Terra Nova — la plateforme numérique centrale de la première ville humaine d'un nouveau monde.",
  contact: {
    label: "Nous écrire",
    email: "contact@terra-nova.world",
  },
  legalLinks: [
    { label: "Mentions légales", href: "#" },
    { label: "Confidentialité", href: "#" },
  ],
  credits: {
    team: "Conçu par l'équipe DevAtoandro",
    event: "Hackathon 24h by Webcup 2026",
  },
  webcup: { label: "Webcup", href: "#" },
}
