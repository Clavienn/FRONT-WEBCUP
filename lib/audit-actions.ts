import type { Locale } from "@/lib/i18n/types";

export type Translate = (key: string, vars?: Record<string, string | number>) => string;

// Vocabulaire métier du journal d'audit. Ce fichier ne contient plus aucun texte : il associe chaque
// code d'action et chaque entité à sa clé de dictionnaire, résolue à l'affichage via t(). Une action
// ajoutée dans un contrôleur doit être déclarée ici, sinon l'interface retombe sur le code brut.

// code d'action (écrit par audit() dans les contrôleurs) -> clé de dictionnaire
export const actionKeys: Record<string, string> = {
  // Citoyen
  "user.register": "auditLog.actions.userRegister",
  login: "auditLog.actions.login",
  "login.failed": "auditLog.actions.loginFailed",
  "login.blocked": "auditLog.actions.loginBlocked",
  "bot.blocked": "auditLog.actions.botBlocked",
  "alert.publish": "auditLog.actions.alertPublish",
  "alert.update": "auditLog.actions.alertUpdate",
  "alert.end": "auditLog.actions.alertEnd",
  "signalement.create": "auditLog.actions.signalementCreate",
  "signalement.acknowledge": "auditLog.actions.signalementAcknowledge",
  "signalement.status": "auditLog.actions.signalementStatus",
  "signalement.priority": "auditLog.actions.signalementPriority",
  "signalement.assigned": "auditLog.actions.signalementAssigned",
  "signalement.update": "auditLog.actions.signalementUpdate",
  "signalement.cancel": "auditLog.actions.signalementCancel",
  "bot.attack_probe": "auditLog.actions.botAttackProbe",
  "bot.role_escalation": "auditLog.actions.botRoleEscalation",
  "security.bulk_access": "auditLog.actions.securityBulkAccess",
  "agent.validate": "auditLog.actions.agentValidate",
  "session.revoke": "auditLog.actions.sessionRevoke",
  "bot.missing_token": "auditLog.actions.botMissingToken",
  "bot.bad_token": "auditLog.actions.botBadToken",
  "bot.too_fast": "auditLog.actions.botTooFast",
  "bot.reused_token": "auditLog.actions.botReusedToken",
  "bot.honeypot": "auditLog.actions.botHoneypot",
  "bot.velocity": "auditLog.actions.botVelocity",
  "bot.login_failures": "auditLog.actions.botLoginFailures",
  "rate.limited": "auditLog.actions.rateLimited",
  "logout.all": "auditLog.actions.logoutAll",
  "2fa.enabled": "auditLog.actions.twoFactorEnabled",
  "2fa.disabled": "auditLog.actions.twoFactorDisabled",
  "login.new_device": "auditLog.actions.loginNewDevice",
  "password.change": "auditLog.actions.passwordChange",
  "profile.update": "auditLog.actions.profileUpdate",
  "contact.send": "auditLog.actions.contactSend",
  // Usages agents
  "request.create": "auditLog.actions.requestCreate",
  "request.assign": "auditLog.actions.requestAssign",
  "request.in_progress": "auditLog.actions.requestInProgress",
  "request.resolved": "auditLog.actions.requestResolved",
  "request.rejected": "auditLog.actions.requestRejected",
  "appointment.book": "auditLog.actions.appointmentBook",
  "appointment.cancel": "auditLog.actions.appointmentCancel",
  "appointment.slot.create": "auditLog.actions.appointmentSlotCreate",
  "appointment.slot.delete": "auditLog.actions.appointmentSlotDelete",
  "appointment.slot.reopen": "auditLog.actions.appointmentSlotReopen",
  "announcement.create": "auditLog.actions.announcementCreate",
  "announcement.update": "auditLog.actions.announcementUpdate",
  "announcement.published": "auditLog.actions.announcementPublished",
  "announcement.archived": "auditLog.actions.announcementArchived",
  "announcement.draft": "auditLog.actions.announcementDraft",
  "announcement.delete": "auditLog.actions.announcementDelete",
  "contact.new": "auditLog.actions.contactNew",
  "contact.read": "auditLog.actions.contactRead",
  "contact.processed": "auditLog.actions.contactProcessed",
  // Administration
  "user.activate": "auditLog.actions.userActivate",
  "user.deactivate": "auditLog.actions.userDeactivate",
  "role.assign": "auditLog.actions.roleAssign",
  "role.remove": "auditLog.actions.roleRemove",
  "role.create": "auditLog.actions.roleCreate",
  "role.update": "auditLog.actions.roleUpdate",
  "role.delete": "auditLog.actions.roleDelete",
  "role.permission.grant": "auditLog.actions.rolePermissionGrant",
  "role.permission.revoke": "auditLog.actions.rolePermissionRevoke",
  "role.permission.sync": "auditLog.actions.rolePermissionSync",
  "permission.create": "auditLog.actions.permissionCreate",
  "permission.update": "auditLog.actions.permissionUpdate",
  "permission.delete": "auditLog.actions.permissionDelete",
  "service.create": "auditLog.actions.serviceCreate",
  "service.update": "auditLog.actions.serviceUpdate",
  "service.delete": "auditLog.actions.serviceDelete",
  "establishment.create": "auditLog.actions.establishmentCreate",
  "establishment.update": "auditLog.actions.establishmentUpdate",
  "establishment.delete": "auditLog.actions.establishmentDelete",
  "project.create": "auditLog.actions.projectCreate",
  "project.update": "auditLog.actions.projectUpdate",
  "project.delete": "auditLog.actions.projectDelete",
  "project.participant.add": "auditLog.actions.projectParticipantAdd",
  "project.participant.remove": "auditLog.actions.projectParticipantRemove",
  "project.entity.add": "auditLog.actions.projectEntityAdd",
  "project.entity.remove": "auditLog.actions.projectEntityRemove",
  "project.comment.create": "auditLog.actions.projectCommentCreate",
  "project.comment.delete": "auditLog.actions.projectCommentDelete",
  "external_entity.create": "auditLog.actions.externalEntityCreate",
  "external_entity.delete": "auditLog.actions.externalEntityDelete",
};

// entityType -> clé de dictionnaire. Deux formes coexistent : les audits métier citent la table
// (citizen_requests), le middleware déduit l'entité du segment d'URL (contact-messages).
export const entityKeys: Record<string, string> = {
  users: "auditLog.entities.user",
  roles: "auditLog.entities.role",
  permissions: "auditLog.entities.permission",
  municipal_services: "auditLog.entities.municipalService",
  establishments: "auditLog.entities.establishment",
  projects: "auditLog.entities.project",
  project_comments: "auditLog.entities.projectComment",
  external_entities: "auditLog.entities.externalEntity",
  services: "auditLog.entities.service",
  announcements: "auditLog.entities.announcement",
  contact_messages: "auditLog.entities.contactMessage",
  "contact-messages": "auditLog.entities.contactMessagesRoute",
  citizen_requests: "auditLog.entities.citizenRequest",
  "citizen-accounts": "auditLog.entities.citizenAccount",
  requests: "auditLog.entities.request",
  appointments: "auditLog.entities.appointment",
  notifications: "auditLog.entities.notification",
  audit_logs: "auditLog.entities.auditLogs",
  "audit-logs": "auditLog.entities.auditLogsRoute",
  auth: "auditLog.entities.auth",
  forms: "auditLog.entities.forms",
  signalements: "auditLog.entities.signalement",
};

// Une action non déclarée affiche son code brut : lisible et traçable, donc preferable à une ligne vide
export function actionLabel(action: string, t: Translate): string {
  const key = actionKeys[action];
  return key ? t(key) : action;
}

export function entityLabel(entityType: string, t: Translate): string {
  const key = entityKeys[entityType];
  return key ? t(key) : entityType;
}

// en-GB et non en-US : comme fr-FR, le jour vient en premier, ce qui évite qu'un horodatage
// d'audit se lise 03/10 au lieu de 10/03 selon la locale de l'écran.
const DATE_LOCALES: Record<Locale, string> = { fr: "fr-FR", en: "en-GB" };

export const formatDate = (value: string, locale: Locale) =>
  new Date(value).toLocaleString(DATE_LOCALES[locale], { dateStyle: "short", timeStyle: "medium" });

export const isFailure = (action: string) =>
  action === "login.failed" || action === "login.blocked" || action.startsWith("bot.") || action === "rate.limited" || action === "security.bulk_access"

// Regroupements du filtre : le préfixe du code décide du thème, l'ordre suit le suivi quotidien
export const ACTION_GROUPS: { prefixes: string[]; labelKey: string }[] = [
  { prefixes: ["request."], labelKey: "auditLog.agentPage.groupRequests" },
  { prefixes: ["appointment."], labelKey: "auditLog.agentPage.groupAppointments" },
  { prefixes: ["announcement."], labelKey: "auditLog.agentPage.groupAnnouncements" },
  { prefixes: ["contact."], labelKey: "auditLog.agentPage.groupMessages" },
  { prefixes: ["role.", "permission."], labelKey: "auditLog.agentPage.groupRbac" },
  { prefixes: ["service."], labelKey: "auditLog.agentPage.groupServices" },
  { prefixes: ["establishment."], labelKey: "auditLog.agentPage.groupEstablishments" },
  { prefixes: ["project.", "external_entity."], labelKey: "auditLog.agentPage.groupProjects" },
];

export const DEFAULT_GROUP_KEY = "auditLog.agentPage.groupAccounts";

// Toute action déclarée doit se retrouver dans une liste : le filtre ne perd jamais une opération
export function groupActions(t: Translate): [string, string[]][] {
  const groups = new Map<string, string[]>();
  for (const code of Object.keys(actionKeys)) {
    const labelKey =
      ACTION_GROUPS.find((group) => group.prefixes.some((prefix) => code.startsWith(prefix)))?.labelKey ??
      DEFAULT_GROUP_KEY;
    groups.set(labelKey, [...(groups.get(labelKey) ?? []), code]);
  }
  return [...groups.entries()].map(([labelKey, codes]) => [t(labelKey), codes]);
}