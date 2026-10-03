export interface Announcement {
  id: string
  date: string
  title: string
  summary: string
}

const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: "quartier-aurora",
    date: "2026-09-18",
    title: "Ouverture du quartier Aurora",
    summary:
      "Le Haut Conseil annonce l'ouverture officielle du quatorzième quartier de Terra Nova, destiné à accueillir 800 nouveaux habitants.",
  },
  {
    id: "reseau-eau",
    date: "2026-09-05",
    title: "Mise à niveau du réseau de distribution d'eau",
    summary:
      "Des interventions de maintenance renforceront la capacité du réseau hydrique commun à l'ensemble des quartiers d'ici la fin de la saison.",
  },
  {
    id: "cartographie-australe",
    date: "2026-08-27",
    title: "Appel à volontaires pour la cartographie australe",
    summary:
      "Le Haut Conseil recherche des volontaires pour cartographier les terres australes en vue d'une future extension de la ville.",
  },
]

/**
 * Point d'intégration unique pour les actualités du Haut Conseil : la mise en œuvre
 * mockée ci-dessous sera remplacée par un appel à l'API officielle de Terra Nova.
 */
export async function getAnnouncements(): Promise<Announcement[]> {
  await new Promise((resolve) => setTimeout(resolve, 650))
  return MOCK_ANNOUNCEMENTS
}
