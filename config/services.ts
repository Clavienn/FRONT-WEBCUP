export type ServiceIcon =
  | "grid"
  | "news"
  | "message"
  | "alert"
  | "wand"

export interface ServiceCardData {
  id: string
  title: string
  description: string
  icon: ServiceIcon
  href: string
}

/**
 * Source unique des cartes de la section Services : ajouter une entrée ici
 * suffit à faire apparaître une nouvelle carte (branchement API à venir).
 */
export const SERVICES: ServiceCardData[] = [
  {
    id: "services-ville",
    title: "Accéder aux services de la ville",
    description:
      "Démarches, ressources et infrastructures municipales réunies en un seul espace, accessible à tout habitant.",
    icon: "grid",
    href: "#",
  },
  {
    id: "informer",
    title: "S'informer",
    description:
      "Suivez les décisions et annonces officielles du Haut Conseil ainsi que la vie de votre quartier.",
    icon: "news",
    href: "#annonces",
  },
  {
    id: "communiquer",
    title: "Communiquer",
    description:
      "Échangez avec les autres habitants et les services municipaux au sein d'un même réseau civique.",
    icon: "message",
    href: "#",
  },
  {
    id: "signaler",
    title: "Signaler un problème",
    description:
      "Remontez une panne, un incident ou un besoin de votre quartier directement aux équipes compétentes.",
    icon: "alert",
    href: "#",
  },
  {
    id: "simplifier",
    title: "Simplifier le quotidien",
    description:
      "Des outils pensés pour vous faire gagner du temps sur les démarches les plus courantes de la vie à Terra Nova.",
    icon: "wand",
    href: "#",
  },
]
