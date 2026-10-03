export type ServiceIcon =
  | "grid"
  | "news"
  | "message"
  | "alert"
  | "wand"

export interface ServiceCardData {
  id: string
  icon: ServiceIcon
  href: string
}

/**
 * Source unique des cartes de la section Services : ajouter une entrée ici
 * suffit à faire apparaître une nouvelle carte (branchement API à venir).
 * Le titre et la description sont traduits dans lib/i18n/dictionary.ts (services.cards.<id>).
 */
export const SERVICES: ServiceCardData[] = [
  { id: "services-ville", icon: "grid", href: "#" },
  { id: "informer", icon: "news", href: "#actualites" },
  { id: "communiquer", icon: "message", href: "#" },
  { id: "signaler", icon: "alert", href: "#" },
  { id: "simplifier", icon: "wand", href: "#" },
]
