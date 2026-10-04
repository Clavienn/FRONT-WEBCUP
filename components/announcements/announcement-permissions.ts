import type { Locale } from "@/lib/i18n/types"
import type { AuthUser } from "@/repository/auth.repository"

const MANAGE = "agent.announcements.manage"

// Agents et admins créent des annonces
export const canCreateAnnouncement = (user: AuthUser) => user.permissions.includes(MANAGE)

// Modifier et supprimer : administrateur uniquement (le rôle agent ne crée que)
export const canEditAnnouncement = (user: AuthUser) =>
  user.permissions.includes(MANAGE) && user.roles.includes("admin")

// La date suit la locale de l'interface, comme le reste de l'application : une date en français
// imposée dans un écran bilingue se lirait comme une faute, et « 3/5/2026 » n'est pas la même
// date que « 5/3/2026 » selon le lecteur.
export const formatPublicationDate = (value: string | null, fallback: string, locale: Locale) =>
  new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "fr-FR", { dateStyle: "long" }).format(
    new Date(value ?? fallback)
  )
