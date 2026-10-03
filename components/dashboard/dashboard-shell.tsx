"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Building2,
  Landmark,
  ShieldAlert,
  ClipboardList,
  Home,
  LogOut,
  Megaphone,
  MessageSquare,
  RadioTower,
  Settings2,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react"

import { useAuth } from "@/components/auth/auth-provider"
import { useLanguage } from "@/components/i18n/language-provider"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { Toaster } from "@/components/ui/toast"
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

type DashboardView = "citizen" | "staff"

interface MenuItem {
  label: string
  icon: LucideIcon
  // Permission RBAC requise ; absente = tout utilisateur connecté
  permission?: string
  adminOnly?: boolean
  // Pastille avec le nombre de messages de citoyens non traités
  newMessagesBadge?: boolean
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
      { label: "sidebar.items.monProfil", icon: UserRound, href: "/profil" },
    ],
  },
  {
    label: "sidebar.groups.citizenSpace",
    items: [
      { label: "sidebar.items.mesDemarches", icon: ClipboardList, permission: "citizen.services.view", view: "citizen", href: "/dashboard#recent-requests-title" },
      { label: "sidebar.items.communiques", icon: Megaphone, permission: "citizen.announcements.view", view: "citizen", href: "/dashboard#city-updates-title" },
      { label: "sidebar.items.envoyerMessage", icon: MessageSquare, permission: "citizen.message.send", view: "citizen" },
    ],
  },
  {
    label: "sidebar.groups.agentConsole",
    items: [
      { label: "sidebar.items.demandesCitoyennes", icon: ClipboardList, permission: "agent.requests.view", view: "staff", href: "/dashboard#queues-title" },
      { label: "sidebar.items.integrationApi", icon: RadioTower, permission: "agent.dashboard.access", view: "staff", href: "/dashboard#api-status-title" },
      { label: "sidebar.items.communiques", icon: Megaphone, permission: "citizen.announcements.view", view: "staff", href: "/dashboard#announcements-title" },
    ],
  },
  {
    label: "sidebar.groups.administration",
    items: [
      { label: "sidebar.items.gererServices", icon: Building2, permission: "admin.services.manage", href: "/dashboard/admin/services" },
      { label: "sidebar.items.utilisateursRoles", icon: Users, permission: "admin.users.manage" },
      { label: "sidebar.items.permissions", icon: Settings2, permission: "admin.users.manage" },
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
  const { t } = useLanguage()
  const view: DashboardView = isStaff(user) ? "staff" : "citizen"
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email

  // Messages "nouveaux" de la boîte de réception (admin) : compteur de la pastille du menu
  const [newMessages, setNewMessages] = useState(0)
  const canReadInbox = user.roles.includes("admin") && user.permissions.includes("agent.messages.manage")
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
            <SidebarMenuButton size="lg" render={<Link href="/" />} tooltip="Terra Nova">
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
                <Building2 className="size-4" aria-hidden="true" />
              </span>
              <span className="grid min-w-0 flex-1 text-left leading-tight">
                <span className="truncate text-sm font-semibold tracking-[0.08em]">TERRA NOVA</span>
                <span className="truncate text-xs text-muted-foreground">
                  {view === "staff" ? t("sidebar.brand.staff") : t("sidebar.brand.citizen")}
                </span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {visibleMenu(user, view).map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{t(group.label)}</SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map(({ label, icon: Icon, href, newMessagesBadge }) => (
                <SidebarMenuItem key={label}>
                  {href ? (
                    <SidebarMenuButton
                      render={<Link href={href} />}
                      isActive={!href.includes("#") && pathname === href}
                      tooltip={t(label)}
                    >
                      <Icon aria-hidden="true" />
                      <span>{t(label)}</span>
                    </SidebarMenuButton>
                  ) : (
                    <SidebarMenuButton disabled tooltip={`${t(label)} (${t("sidebar.comingSoon")})`}>
                      <Icon aria-hidden="true" />
                      <span>{t(label)}</span>
                      <Badge variant="outline" className="ml-auto text-[10px]">{t("sidebar.comingSoon")}</Badge>
                    </SidebarMenuButton>
                  )}
                  {newMessagesBadge && newMessages > 0 && (
                    <SidebarMenuBadge aria-label={`${newMessages} nouveaux messages`}>{newMessages}</SidebarMenuBadge>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
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
      <AppSidebar user={user} />
      <SidebarInset className="app-atmosphere min-h-screen bg-transparent text-foreground">
        <div className="px-4 pb-12 pt-4 sm:px-6 lg:px-8">
          <SidebarTrigger aria-label={t("sidebar.toggleAriaLabel")} className="mb-4" />
          <div className="mx-auto max-w-7xl space-y-8 pt-2">{children}</div>
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

  return (
    <Toaster>
      <DashboardShell user={user}>{children}</DashboardShell>
    </Toaster>
  )
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
