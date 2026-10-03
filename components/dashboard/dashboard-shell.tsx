"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Building2,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { isStaff, type AuthUser } from "@/repository/auth.repository"

type DashboardView = "citizen" | "staff"

interface MenuItem {
  label: string
  icon: LucideIcon
  // Permission RBAC requise ; absente = tout utilisateur connecté
  permission?: string
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
    label: "Navigation",
    items: [
      { label: "Accueil", icon: Home, permission: "citizen.home.view", href: "/dashboard" },
      { label: "Mon profil", icon: UserRound, href: "/profil" },
    ],
  },
  {
    label: "Espace citoyen",
    items: [
      { label: "Services de la ville", icon: Building2, permission: "citizen.services.view", view: "citizen", href: "/dashboard#services-title" },
      { label: "Mes démarches", icon: ClipboardList, permission: "citizen.services.view", view: "citizen", href: "/dashboard#recent-requests-title" },
      { label: "Communiqués", icon: Megaphone, permission: "citizen.announcements.view", view: "citizen", href: "/dashboard#city-updates-title" },
      { label: "Envoyer un message", icon: MessageSquare, permission: "citizen.message.send", view: "citizen" },
    ],
  },
  {
    label: "Console des agents",
    items: [
      { label: "Demandes citoyennes", icon: ClipboardList, permission: "agent.requests.view", view: "staff", href: "/dashboard#queues-title" },
      { label: "Intégration API", icon: RadioTower, permission: "agent.dashboard.access", view: "staff", href: "/dashboard#api-status-title" },
      { label: "Communiqués", icon: Megaphone, permission: "citizen.announcements.view", view: "staff", href: "/dashboard#announcements-title" },
    ],
  },
  {
    label: "Administration",
    items: [
      { label: "Utilisateurs et rôles", icon: Users, permission: "admin.users.manage" },
      { label: "Permissions", icon: Settings2, permission: "admin.users.manage" },
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
          (!item.permission || user.permissions.includes(item.permission))
      ),
    }))
    .filter((group) => group.items.length > 0)
}

export function roleLabel(user: AuthUser) {
  if (user.roles.includes("admin")) return "Administrateur"
  if (user.roles.includes("agent")) return "Agent de service"
  return "Citoyen"
}

function initials(user: AuthUser) {
  const letters = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`
  return (letters || user.email[0] || "?").toUpperCase()
}

function AppSidebar({ user }: { user: AuthUser }) {
  const pathname = usePathname()
  const router = useRouter()
  const { signOut } = useAuth()
  const view: DashboardView = isStaff(user) ? "staff" : "citizen"
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email

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
                  {view === "staff" ? "Console des agents" : "Espace citoyen"}
                </span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {visibleMenu(user, view).map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarMenu>
              {group.items.map(({ label, icon: Icon, href }) => (
                <SidebarMenuItem key={label}>
                  {href ? (
                    <SidebarMenuButton
                      render={<Link href={href} />}
                      isActive={!href.includes("#") && pathname === href}
                      tooltip={label}
                    >
                      <Icon aria-hidden="true" />
                      <span>{label}</span>
                    </SidebarMenuButton>
                  ) : (
                    <SidebarMenuButton disabled tooltip={`${label} (bientôt)`}>
                      <Icon aria-hidden="true" />
                      <span>{label}</span>
                      <Badge variant="outline" className="ml-auto text-[10px]">Bientôt</Badge>
                    </SidebarMenuButton>
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
                <span className="truncate text-xs text-muted-foreground">{roleLabel(user)}</span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut} tooltip="Se déconnecter">
              <LogOut aria-hidden="true" />
              <span>Se déconnecter</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

export function DashboardShell({ user, children }: Readonly<{ user: AuthUser; children: React.ReactNode }>) {
  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset className="app-atmosphere min-h-screen bg-transparent text-foreground">
        <div className="px-4 pb-12 pt-4 sm:px-6 lg:px-8">
          <SidebarTrigger aria-label="Afficher ou masquer le menu" className="mb-4" />
          <div className="mx-auto max-w-7xl space-y-8 pt-2">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
