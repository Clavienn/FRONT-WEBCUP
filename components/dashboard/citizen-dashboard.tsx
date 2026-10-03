import Link from "next/link"
import { Bell, Building2, CheckCircle2, CircleAlert, CircleX, ClipboardList, Clock3, FilePlus2, MapPinned, Megaphone,} from "lucide-react"

import type { AuthUser } from "@/repository/auth.repository"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"

const requestStates = [
  { label: "À traiter", icon: Clock3, tone: "text-amber-700 dark:text-amber-300" },
  { label: "En cours", icon: ClipboardList, tone: "text-sky-700 dark:text-sky-300" },
  { label: "Acceptées", icon: CheckCircle2, tone: "text-emerald-700 dark:text-emerald-300" },
  { label: "Refusées", icon: CircleX, tone: "text-destructive" },
]

const citizenServices = [
  {
    title: "Demandes de service",
    description: "Accédez aux démarches proposées par les services de la ville.",
    icon: FilePlus2,
  },
  {
    title: "Signaler un problème",
    description: "Faites remonter une situation qui nécessite l’attention de la ville.",
    icon: MapPinned,
  },
  {
    title: "Communiqués",
    description: "Retrouvez les informations publiées par le Haut Conseil.",
    icon: Megaphone,
  },
]

function getInitials(user: AuthUser) {
  const initials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.trim()
  return initials.toUpperCase() || user.email[0]?.toUpperCase() || "C"
}

export function CitizenDashboard({ user }: { user: AuthUser }) {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email

  return (
    <DashboardShell user={user}>
        <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-primary">La première ville d’un nouveau monde</p>
            <h1 className="mt-1 text-3xl font-medium tracking-tight sm:text-4xl">
              Bonjour{user.firstName ? `, ${user.firstName}` : ""}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Retrouvez vos démarches et les informations utiles de Terra Nova.
            </p>
          </div>
          <Badge variant="outline" className="w-fit gap-1.5 rounded-full px-3 py-1 text-muted-foreground">
            <Building2 className="size-3.5 text-primary" aria-hidden="true" />
            Espace citoyen
          </Badge>
        </section>

        <section aria-labelledby="citizen-requests-title" className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 id="citizen-requests-title" className="text-lg font-semibold">Mes démarches</h2>
              <p className="text-sm text-muted-foreground">Suivez l’avancement de vos demandes citoyennes.</p>
            </div>
            <span className="text-xs text-muted-foreground">Données disponibles après connexion du flux officiel</span>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {requestStates.map(({ label, icon: Icon, tone }) => (
              <div key={label} className="rounded-xl border border-border/80 bg-card/75 p-4 shadow-sm backdrop-blur-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <Icon className={`size-4 shrink-0 ${tone}`} aria-hidden="true" />
                </div>
                <p className="mt-3 text-2xl font-semibold tabular-nums">—</p>
              </div>
            ))}
          </div>
        </section>

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-8">
            <section aria-labelledby="recent-requests-title" className="rounded-2xl border border-border/80 bg-card/70 p-5 shadow-sm backdrop-blur-sm sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 id="recent-requests-title" className="text-lg font-semibold">Demandes récentes</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Vos dernières démarches et leur état.</p>
                </div>
                <Badge variant="outline">Aucune donnée synchronisée</Badge>
              </div>
              <div className="mt-5 flex min-h-40 flex-col items-center justify-center border-t border-border/70 pt-5 text-center">
                <ClipboardList className="size-6 text-muted-foreground/70" aria-hidden="true" />
                <p className="mt-3 text-sm font-medium">Vos demandes apparaîtront ici</p>
                <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">
                  La liste sera renseignée lorsque les demandes de citoyens seront disponibles depuis l’API Terra Nova.
                </p>
              </div>
            </section>

            <section aria-labelledby="services-title" className="space-y-4">
              <div>
                <h2 id="services-title" className="text-lg font-semibold">Services de la ville</h2>
                <p className="text-sm text-muted-foreground">Les services seront accessibles au fil de leur mise en ligne.</p>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {citizenServices.map(({ title, description, icon: Icon }) => (
                  <article key={title} className="rounded-xl border border-border/80 bg-card/70 p-4 shadow-sm backdrop-blur-sm">
                    <span className="grid size-9 place-items-center rounded-lg bg-accent text-accent-foreground">
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <h3 className="mt-4 text-sm font-semibold">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
                  </article>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <section aria-labelledby="citizen-profile-title" className="rounded-xl border border-border/80 bg-card/75 p-5 shadow-sm backdrop-blur-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 id="citizen-profile-title" className="text-sm font-semibold">Mon profil</h2>
                <Link href="/profil" className="text-xs font-medium text-primary underline-offset-4 hover:underline">
                  Gérer
                </Link>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <Avatar className="size-12">
                  <AvatarFallback className="bg-accent text-base font-semibold text-accent-foreground">
                    {getInitials(user)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{fullName}</p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <Badge variant="secondary" className="mt-4">Citoyen</Badge>
            </section>

            <section aria-labelledby="city-updates-title" className="rounded-xl border border-border/80 bg-card/75 p-5 shadow-sm backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Megaphone className="size-4 text-primary" aria-hidden="true" />
                <h2 id="city-updates-title" className="text-sm font-semibold">Informations de la ville</h2>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Aucun communiqué n’est synchronisé pour le moment.
              </p>
            </section>

            <section aria-labelledby="citizen-notice-title" className="rounded-xl border border-primary/20 bg-primary/5 p-5">
              <div className="flex items-center gap-2">
                <Bell className="size-4 text-primary" aria-hidden="true" />
                <h2 id="citizen-notice-title" className="text-sm font-semibold">À savoir</h2>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                De nouveaux besoins peuvent être publiés chaque heure. Les services numériques évolueront avec les demandes des habitants.
              </p>
              <div className="mt-4 flex items-center gap-2 border-t border-primary/10 pt-3 text-xs text-muted-foreground">
                <CircleAlert className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
                Consultez régulièrement les informations de Terra Nova.
              </div>
            </section>
          </aside>
        </div>

        <footer className="flex items-center gap-2 border-t border-border/70 pt-5 text-xs text-muted-foreground">
          <Building2 className="size-3.5" aria-hidden="true" />
          Plateforme centrale de Terra Nova
        </footer>
    </DashboardShell>
  )
}
