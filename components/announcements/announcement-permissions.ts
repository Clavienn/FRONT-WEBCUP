import type { AuthUser } from "@/repository/auth.repository"

const MANAGE = "agent.announcements.manage"

// Agents et admins créent des annonces
export const canCreateAnnouncement = (user: AuthUser) => user.permissions.includes(MANAGE)

// Modifier et supprimer : administrateur uniquement (le rôle agent ne crée que)
export const canEditAnnouncement = (user: AuthUser) =>
  user.permissions.includes(MANAGE) && user.roles.includes("admin")

export const formatPublicationDate = (value: string | null, fallback: string) =>
  new Date(value ?? fallback).toLocaleDateString("fr-FR", { dateStyle: "long" })
