"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  ALargeSmall,
  Building2,
  CalendarClock,
  FolderKanban,
  Globe,
  Landmark,
  Lightbulb,
  MapPin,
  ShieldAlert,
  Siren,
  BellRing,
  Bus,
  TramFront,
  ClipboardList,
  Home,
  LogOut,
  Megaphone,
  MessageSquare,
  Moon,
  Sun,
  KeyRound,
  ScrollText,
  Settings,
  ShieldCheck,
  Users,
  Zap,
  ZapOff,
  type LucideIcon,
} from "lucide-react"

import { BrandMark } from "@/components/brand/brand-mark"
import { BRAND_NAME } from "@/config/brand"
import { useAuth } from "@/components/auth/auth-provider"
import { AgentApprovalNotice } from "@/components/agent/agent-approval"
import { AnnouncementAlertBanner } from "@/components/announcements/announcement-alert-banner"
import { useLanguage } from "@/components/i18n/language-provider"
import { useLiteMode } from "@/components/lite-mode/lite-mode-provider"
import { useAccessibility } from "@/hooks/use-accessibility"
import { useTheme } from "@/hooks/use-theme"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { GlobalSearchBar } from "@/components/search/global-search-bar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Spinner } from "@/components/ui/spinner"
import { WelcomeModal } from "@/components/dashboard/welcome-modal"
import { PageBreadcrumb } from "@/components/navigation/page-breadcrumb"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { isStaff, roleLabel, type AuthUser } from "@/repository/auth.repository"
import { contactMessageRepository } from "@/repository/contactMessage.repository"
import { signalementRepository, type SignalementEvent } from "@/repository/signalement.repository"
import { useStaffChannel } from "@/components/signalements/use-staff-channel"
import { toast } from "@/components/ui/toast"
import { AlertBanner } from "@/components/alerts/alert-banner"
import { LoginSecurityNotice } from "@/components/auth/login-security-notice"

type DashboardView = "citizen" | "staff"

interface MenuItem {
  label: string
  icon: LucideIcon
  // Permission RBAC requise ; absente = tout utilisateur connecté
  permission?: string
  adminOnly?: boolean
  // Masqué pour les admins (qui ont la version complète dans le groupe Administration)
  agentOnly?: boolean
  // Pastille avec le nombre de messages de citoyens non traités
  newMessagesBadge?: boolean
  // Pastille rouge : signalements urgents ou en retard
  signalementsBadge?: boolean
  // Entrée mise en avant (urgence) : icône rouge
  emphasis?: boolean
  // Vue du dashboard où la cible existe (les ancres n'existent que dans leur vue)
  view?: DashboardView
  // Sans href, l'entrée est affichée désactivée (page pas encore disponible)
  href?: string
}

interface MenuGroup {
  label: string
  items: MenuItem[]
}

const menu: MenuGroup[] = [
  {
    label: "sidebar.groups.navigation",
    items: [
      { label: "sidebar.items.accueil", icon: Home, permission: "citizen.home.view", href: "/dashboard" },
      { label: "sidebar.items.servicesMunicipaux", icon: Landmark, permission: "citizen.services.view", href: "/dashboard/services" },
      { label: "sidebar.items.lieuxUtiles", icon: MapPin, permission: "citizen.establishments.view", href: "/dashboard/lieux-utiles" },
      { label: "sidebar.items.projets", icon: FolderKanban, permission: "citizen.projects.view", href: "/dashboard/projects" },
      { label: "sidebar.items.transports", icon: Bus, href: "/dashboard/transports" },
      { label: "sidebar.items.annonces", icon: Megaphone, permission: "citizen.announcements.view", href: "/dashboard/announcements" },
    ],
  },
  {
    label: "sidebar.groups.citizenSpace",
    items: [
      { label: "sidebar.items.signalements", icon: Siren, permission: "citizen.signalements.create", view: "citizen", href: "/dashboard/signalements", emphasis: true },
      { label: "sidebar.items.mesDemarches", icon: ClipboardList, permission: "citizen.requests.view", view: "citizen", href: "/dashboard/my-requests" },
      { label: "sidebar.items.mesRendezVous", icon: CalendarClock, permission: "citizen.appointments.view", view: "citizen", href: "/dashboard/appointments" },
    ],
  },
  // Agents et administrateurs : trois sections après « Navigation », du plus urgent au plus rare
  {
    // 1. Ce qui demande une réaction rapide : urgences, alertes, demandes, rendez-vous
    label: "sidebar.groups.operations",
    items: [
      { label: "sidebar.items.signalementsStaff", icon: Siren, permission: "agent.signalements.view", view: "staff", href: "/dashboard/agent/signalements", signalementsBadge: true, emphasis: true },
      { label: "sidebar.items.alertesPopulation", icon: BellRing, permission: "agent.alerts.manage", view: "staff", href: "/dashboard/agent/alerts", emphasis: true },
      { label: "sidebar.items.interruptionsTransport", icon: TramFront, permission: "agent.transport.manage", view: "staff", href: "/dashboard/agent/transport" },
      { label: "sidebar.items.demandesCitoyennes", icon: ClipboardList, permission: "agent.requests.view", view: "staff", href: "/dashboard/agent/requests" },
      { label: "sidebar.items.rendezVousCitoyens", icon: CalendarClock, permission: "agent.appointments.view", view: "staff", href: "/dashboard/appointments" },
      { label: "sidebar.items.historiqueOperations", icon: ScrollText, permission: "agent.activity.view", view: "staff", agentOnly: true, href: "/dashboard/agent/activite" },
      { label: "sidebar.items.gererEtablissements", icon: MapPin, permission: "agent.establishments.manage", view: "staff", href: "/dashboard/agent/etablissements" },
    ],
  },
  {
    // 2. Ce qu'on publie et ceux qu'on accompagne : contenus, services, comptes et messages des habitants
    label: "sidebar.groups.management",
    items: [
      { label: "sidebar.items.comptesCitoyens", icon: Users, permission: "agent.citizens.manage", view: "staff", href: "/dashboard/agent/citizens" },
      { label: "sidebar.items.messagesHabitants", icon: MessageSquare, adminOnly: true, newMessagesBadge: true, href: "/dashboard/admin/messages" },
      { label: "sidebar.items.gererEtablissements", icon: MapPin, permission: "agent.establishments.manage", view: "staff", href: "/dashboard/agent/etablissements" },
      { label: "sidebar.items.gererServices", icon: Building2, permission: "admin.services.manage", href: "/dashboard/admin/services" },
      { label: "sidebar.items.gererProjets", icon: FolderKanban, permission: "admin.projects.manage", href: "/dashboard/admin/projects" },
      { label: "sidebar.items.ideesHabitants", icon: Lightbulb, permission: "admin.ideas.manage", href: "/dashboard/admin/ideas" },
    ],
  },
  {
    // 3. Accès, droits et traçabilité : réservé à l'administration (l'agent n'y voit que son propre journal)
    label: "sidebar.groups.administration",
    items: [
      { label: "sidebar.items.utilisateurs", icon: Users, permission: "admin.users.manage", href: "/dashboard/admin/users" },
      { label: "sidebar.items.roles", icon: ShieldCheck, permission: "admin.users.manage", href: "/dashboard/admin/roles" },
      { label: "sidebar.items.permissions", icon: KeyRound, permission: "admin.users.manage", href: "/dashboard/admin/permissions" },
      { label: "sidebar.items.securite", icon: ShieldAlert, permission: "admin.users.manage", href: "/dashboard/admin/security" },
      { label: "sidebar.items.journalAudit", icon: ScrollText, permission: "admin.users.manage", href: "/dashboard/admin/audit" },
      { label: "sidebar.items.historiqueOperations", icon: ScrollText, permission: "agent.activity.view", view: "staff", agentOnly: true, href: "/dashboard/agent/activite" },
    ],
  },
]

// Le menu dépend des permissions réelles de l'utilisateur ; le serveur les re-vérifie à chaque requête
function visibleMenu(user: AuthUser, view: DashboardView): MenuGroup[] {
  return menu
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          (!item.view || item.view === view) &&
          (!item.adminOnly || user.roles.includes("admin")) &&
          (!item.agentOnly || !user.roles.includes("admin")) &&
          (!item.permission || user.permissions.includes(item.permission))
      ),
    }))
    .filter((group) => group.items.length > 0)
}

function initials(user: AuthUser) {
  const letters = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`
  return (letters || user.email[0] || "?").toUpperCase()
}

function AppSidebar({ user }: { user: AuthUser }) {
  const pathname = usePathname()
  const router = useRouter()
  const { signOut } = useAuth()
  const { t, locale, setLocale } = useLanguage()
  const { theme, toggleTheme } = useTheme()
  const { textSize, cycleTextSize } = useAccessibility()
  const { liteMode, toggleLiteMode } = useLiteMode()
  const view: DashboardView = isStaff(user) ? "staff" : "citizen"
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email

  // Réglages du footer : libellés décrivant l'état courant, le clic bascule
  const themeLabel = t(theme === "dark" ? "sidebar.items.darkMode" : "sidebar.items.lightMode")
  const localeLabel = t(locale === "fr" ? "sidebar.items.french" : "sidebar.items.english")
  const textSizeLabel = t(`sidebar.items.textSize.${textSize}`)
  const liteModeLabel = t(liteMode ? "sidebar.items.liteModeOn" : "sidebar.items.liteModeOff")
  const ThemeIcon = theme === "dark" ? Moon : Sun
  const LiteModeIcon = liteMode ? Zap : ZapOff
  const switchLocale = () => setLocale(locale === "fr" ? "en" : "fr")

  // Messages "nouveaux" de la boîte de réception (admin) : compteur de la pastille du menu
  const [newMessages, setNewMessages] = useState(0)

  // Signalements d'urgence : pastille (urgents + en retard) et alerte en direct pour le personnel,
  // où que se trouve l'agent dans la console
  const canWatchSignalements = user.permissions.includes("agent.signalements.view")
  const [signalementAlerts, setSignalementAlerts] = useState(0)
  const refreshSignalements = useCallback(() => {
    signalementRepository
      .summary()
      .then((summary) => setSignalementAlerts(summary.urgentOpen + summary.overdue))
      .catch(() => undefined)
  }, [])
  useEffect(() => {
    if (canWatchSignalements) refreshSignalements()
  }, [canWatchSignalements, pathname, refreshSignalements])
  useStaffChannel(
    useCallback(
      (kind: "new" | "updated", event: SignalementEvent) => {
        if (kind === "new") {
          toast.add({
            title: t("signalements.staff.liveNew", { priority: t(`signalements.priority.${event.priority}`) }),
            description: `${event.title} — ${event.location}`,
            type: event.priority === "urgent" ? "urgent" : "caution",
            priority: "high",
            actionProps: { children: t("signalements.staff.liveOpen"), onClick: () => router.push("/dashboard/agent/signalements") },
          })
        }
        refreshSignalements()
      },
      [refreshSignalements, router, t]
    ),
    canWatchSignalements
  )
  const canReadInbox = user.permissions.includes("agent.messages.manage")
  useEffect(() => {
    if (!canReadInbox) return
    let mounted = true
    contactMessageRepository
      .listInbox({ status: "new", limit: 1 })
      .then((inbox) => mounted && setNewMessages(inbox.counts.new))
      .catch(() => undefined)
    return () => {
      mounted = false
    }
    // Recomptage à chaque navigation (ex. après avoir traité un message)
  }, [canReadInbox, pathname])

  const handleSignOut = async () => {
    await signOut().catch(() => undefined)
    router.replace("/connexion")
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/" />} tooltip={BRAND_NAME}>
              <BrandMark className="w-6 text-foreground" />
              <span className="grid min-w-0 flex-1 text-left leading-tight">
                <span className="truncate text-sm font-semibold tracking-[0.08em] uppercase">
                  {BRAND_NAME}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {view === "staff" ? t("sidebar.brand.staff") : t("sidebar.brand.citizen")}
                </span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="gap-1">
        {visibleMenu(user, view).map((group) => (
          <SidebarGroup key={group.label} className="px-2 py-2.5">
            <SidebarGroupLabel className="mb-1 h-8">{t(group.label)}</SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map(({ label, icon: Icon, href, newMessagesBadge, signalementsBadge, emphasis }) => (
                <SidebarMenuItem key={label}>
                  {href ? (
                    <SidebarMenuButton
                      render={<Link href={href} />}
                      isActive={!href.includes("#") && pathname === href}
                      tooltip={t(label)}
                      className="h-9"
                    >
                      <Icon aria-hidden="true" className={emphasis ? "text-red-600" : undefined} />
                      <span>{t(label)}</span>
                    </SidebarMenuButton>
                  ) : (
                    <SidebarMenuButton disabled tooltip={`${t(label)} (${t("sidebar.comingSoon")})`}>
                      <Icon aria-hidden="true" />
                      <span>{t(label)}</span>
                      <Badge variant="outline" className="ml-auto text-[10px]">{t("sidebar.comingSoon")}</Badge>
                    </SidebarMenuButton>
                  )}
                  {signalementsBadge && signalementAlerts > 0 && (
                    <SidebarMenuBadge
                      aria-label={t("signalements.staff.badgeAria", { count: signalementAlerts })}
                      className="bg-red-600 text-white"
                    >
                      {signalementAlerts}
                    </SidebarMenuBadge>
                  )}
                  {newMessagesBadge && newMessages > 0 && (
                    <SidebarMenuBadge aria-label={t("sidebar.newMessagesAriaLabel", { count: newMessages })}>
                      {newMessages}
                    </SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarGroup className="group-data-[collapsible=icon]:p-0">
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger render={<SidebarMenuButton />}>
                  <Settings aria-hidden="true" />
                  <span>{t("sidebar.groups.settings")}</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" side="top">
                  <DropdownMenuItem onClick={toggleTheme}>
                    <ThemeIcon aria-hidden="true" />
                    {themeLabel}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={switchLocale}>
                    <Globe aria-hidden="true" />
                    {localeLabel}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={cycleTextSize}>
                    <ALargeSmall aria-hidden="true" />
                    {textSizeLabel}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={toggleLiteMode}>
                    <LiteModeIcon aria-hidden="true" />
                    {liteModeLabel}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/profil" />} tooltip={fullName}>
              <Avatar className="size-8">
                <AvatarFallback className="bg-accent text-xs font-semibold text-accent-foreground">
                  {initials(user)}
                </AvatarFallback>
              </Avatar>
              <span className="grid min-w-0 flex-1 text-left leading-tight">
                <span className="truncate text-sm font-medium">{fullName}</span>
                <span className="truncate text-xs text-muted-foreground">{t(`roles.${roleLabel(user)}`)}</span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut} tooltip={t("sidebar.signOut")}>
              <LogOut aria-hidden="true" />
              <span>{t("sidebar.signOut")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

function DashboardShell({ user, children }: Readonly<{ user: AuthUser; children: React.ReactNode }>) {
  const { t } = useLanguage()

  return (
    <SidebarProvider>
      <WelcomeModal key={user.id} user={user} />
      <AppSidebar user={user} />
      <SidebarInset className="app-atmosphere min-h-screen bg-transparent text-foreground">
        {/* Alertes à la population : visibles sur toutes les pages, collées en haut pendant le défilement */}
        <AlertBanner variant="inline" />
        {/* Tentatives de connexion échouées sur ce compte ces dernières 24 h : prévenu à l'ouverture de session */}
        <LoginSecurityNotice />
        <div className="px-4 pb-12 pt-4 sm:px-6 lg:px-8">
          <div className="mb-4 flex items-center justify-between">
            <SidebarTrigger aria-label={t("sidebar.toggleAriaLabel")} />
            {user.permissions.includes("citizen.notifications.view") && <NotificationBell />}
          </div>
          <div className="mx-auto max-w-7xl space-y-8 pt-2">
            <PageBreadcrumb />
            {/* Rappel durable d'une annonce prioritaire : l'alerte temps réel ne couvre que
                l'instant de la publication, ce bandeau couvre l'habitant qui revient plus tard. */}
            <AnnouncementAlertBanner userId={user.id} />
            {/* Visible sur tout l'espace de travail d'un agent en attente de validation, plutôt
                qu'auprès d'un échec : la restriction s'annonce au lieu de se découvrir. */}
            {isStaff(user) && <AgentApprovalNotice />}
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

// Layout de toutes les pages /dashboard : exige une session, puis affiche sidebar + contenu
export function DashboardFrame({ children }: Readonly<{ children: React.ReactNode }>) {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && !user) router.replace("/connexion")
  }, [isLoading, router, user])

  if (isLoading || !user) {
    return (
      <main className="app-atmosphere grid min-h-screen place-items-center">
        <Spinner />
      </main>
    )
  }

  // Le Toaster est monté à la racine du site (app/layout.tsx) : un second provider afficherait
  // chaque toast en double.
  return <DashboardShell user={user}>{children}</DashboardShell>
}

// Protège une page par permission (le serveur refuse de toute façon les appels sans droit)
export function RequirePermission({ permission, children }: Readonly<{ permission: string; children: React.ReactNode }>) {
  const { user } = useAuth()
  const { t } = useLanguage()
  if (user?.permissions.includes(permission)) return <>{children}</>

  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-2 rounded-2xl border border-border/80 bg-card/70 p-8 text-center">
      <ShieldAlert className="size-6 text-muted-foreground" aria-hidden="true" />
      <p className="font-medium">{t("requirePermission.title")}</p>
      <p className="text-sm text-muted-foreground">{t("requirePermission.description")}</p>
    </div>
  )
}

export function RequireAdmin({ children }: Readonly<{ children: React.ReactNode }>) {
  const { user } = useAuth()
  const { t } = useLanguage()
  if (user?.roles.includes("admin")) return <>{children}</>

  return (
    <div className="flex min-h-64 flex-col items-center justify-center gap-2 rounded-2xl border border-border/80 bg-card/70 p-8 text-center">
      <ShieldAlert className="size-6 text-muted-foreground" aria-hidden="true" />
      <p className="font-medium">{t("requireAdmin.title")}</p>
      <p className="text-sm text-muted-foreground">{t("requireAdmin.description")}</p>
    </div>
  )
}
