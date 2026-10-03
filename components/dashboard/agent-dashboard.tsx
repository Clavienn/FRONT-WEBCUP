"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Activity,
  Bell,
  Building2,
  Cable,
  CheckCircle2,
  CircleAlert,
  CircleX,
  ClipboardList,
  Clock3,
  KeyRound,
  Megaphone,
  RadioTower,
  RefreshCw,
  ShieldCheck,
} from "lucide-react"

import { useAuth } from "@/components/auth/auth-provider"
import { isStaff } from "@/repository/auth.repository"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { CitizenDashboard } from "@/components/dashboard/citizen-dashboard"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"

const metrics = [
  { label: "En attente", icon: Clock3, tone: "text-amber-700 dark:text-amber-300" },
  { label: "En cours", icon: Activity, tone: "text-sky-700 dark:text-sky-300" },
  { label: "Acceptées", icon: CheckCircle2, tone: "text-emerald-700 dark:text-emerald-300" },
  { label: "Rejetées", icon: CircleX, tone: "text-destructive" },
]

const requestQueues = [
  {
    title: "En attente de traitement",
    status: "À examiner",
    icon: Clock3,
    tone: "text-amber-700 bg-amber-500/10 dark:text-amber-300",
  },
  {
    title: "En cours de traitement",
    status: "En cours",
    icon: Activity,
    tone: "text-sky-700 bg-sky-500/10 dark:text-sky-300",
  },
  {
    title: "Demandes acceptées",
    status: "Acceptée",
    icon: CheckCircle2,
    tone: "text-emerald-700 bg-emerald-500/10 dark:text-emerald-300",
  },
  {
    title: "Demandes rejetées",
    status: "Rejetée",
    icon: CircleX,
    tone: "text-destructive bg-destructive/10",
  },
]

function getInitials(firstName: string | null, lastName: string | null, email: string) {
  const initials = `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.trim()
  return initials ? initials.toUpperCase() : email[0]?.toUpperCase() ?? "A"
}

export function AgentDashboard() {
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

  if (!isStaff(user)) {
    return <CitizenDashboard user={user} />
  }

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email
  const roleLabel = user.roles.includes("admin") ? "Administrateur" : "Agent de service"

  return (
    <DashboardShell user={user}>
        <section className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-primary">Haut Conseil de Terra Nova</p>
            <h1 className="mt-1 text-3xl font-medium tracking-tight sm:text-4xl">
              Bonjour, {user.firstName || "agent"}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Retrouvez les demandes citoyennes et les informations de service au même endroit.
            </p>
          </div>
          <Badge variant="outline" className="w-fit gap-1.5 rounded-full px-3 py-1 text-muted-foreground">
            <ShieldCheck className="size-3.5 text-primary" aria-hidden="true" />
            Session sécurisée
          </Badge>
        </section>

        <section aria-labelledby="metrics-title" className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 id="metrics-title" className="text-lg font-semibold">Activité des demandes</h2>
              <p className="text-sm text-muted-foreground">Les volumes s’afficheront lorsque le flux officiel sera connecté.</p>
            </div>
            <span className="text-xs text-muted-foreground">Données non synchronisées</span>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {metrics.map(({ label, icon: Icon, tone }) => (
              <div key={label} className="rounded-xl border border-border/80 bg-card/75 p-4 shadow-sm backdrop-blur-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <Icon className={`size-4 shrink-0 ${tone}`} aria-hidden="true" />
                </div>
                <p className="mt-3 text-2xl font-semibold tabular-nums text-foreground">—</p>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="api-status-title" className="space-y-4 rounded-2xl border border-border/80 bg-card/65 p-5 shadow-sm backdrop-blur-sm sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <Cable className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h2 id="api-status-title" className="text-lg font-semibold">Intégration API Terra Nova</h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                  État de la liaison entre la console agent et le flux officiel des demandes.
                </p>
              </div>
            </div>
            <Badge variant="outline" className="gap-1.5 rounded-full border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200">
              <CircleAlert className="size-3.5" aria-hidden="true" />
              Maquette · à connecter
            </Badge>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-border/70 bg-background/55 p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <RadioTower className="size-4" aria-hidden="true" />
                <p className="text-xs font-medium">Disponibilité</p>
              </div>
              <p className="mt-3 text-sm font-semibold text-foreground">En attente de configuration</p>
              <p className="mt-1 text-xs text-muted-foreground">Aucune requête de contrôle exécutée</p>
            </div>

            <div className="rounded-xl border border-border/70 bg-background/55 p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <KeyRound className="size-4" aria-hidden="true" />
                <p className="text-xs font-medium">Accès équipe</p>
              </div>
              <p className="mt-3 text-sm font-semibold text-foreground">Clé API requise</p>
              <p className="mt-1 text-xs text-muted-foreground">À configurer côté serveur</p>
            </div>

            <div className="rounded-xl border border-border/70 bg-background/55 p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <RefreshCw className="size-4" aria-hidden="true" />
                <p className="text-xs font-medium">Dernière synchronisation</p>
              </div>
              <p className="mt-3 text-sm font-semibold text-foreground">—</p>
              <p className="mt-1 text-xs text-muted-foreground">En attente du premier échange</p>
            </div>

            <div className="rounded-xl border border-border/70 bg-background/55 p-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock3 className="size-4" aria-hidden="true" />
                <p className="text-xs font-medium">Vagues de demandes</p>
              </div>
              <p className="mt-3 text-sm font-semibold text-foreground">Publication horaire</p>
              <p className="mt-1 text-xs text-muted-foreground">Surveillance à prévoir après connexion</p>
            </div>
          </div>
        </section>

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section aria-labelledby="queues-title" className="space-y-4">
            <div>
              <h2 id="queues-title" className="text-lg font-semibold">Demandes citoyennes</h2>
              <p className="text-sm text-muted-foreground">Suivi par état de traitement</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {requestQueues.map(({ title, status, icon: Icon, tone }) => (
                <section key={status} className="rounded-xl border border-border/80 bg-card/75 p-4 shadow-sm backdrop-blur-sm">
                  <header className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${tone}`}>
                        <Icon className="size-4" aria-hidden="true" />
                      </span>
                      <h3 className="text-sm font-semibold leading-5">{title}</h3>
                    </div>
                    <Badge variant="outline" className="shrink-0">{status}</Badge>
                  </header>
                  <div className="mt-5 flex min-h-24 flex-col items-center justify-center border-t border-border/70 pt-4 text-center">
                    <ClipboardList className="size-5 text-muted-foreground/70" aria-hidden="true" />
                    <p className="mt-2 text-sm font-medium text-muted-foreground">Aucune donnée synchronisée</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground/80">
                      Les demandes apparaîtront ici après connexion au flux officiel.
                    </p>
                  </div>
                </section>
              ))}
            </div>
          </section>

          <aside className="space-y-4">
            <section aria-labelledby="connected-profile-title" className="rounded-xl border border-border/80 bg-card/75 p-5 shadow-sm backdrop-blur-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 id="connected-profile-title" className="text-sm font-semibold">Profil connecté</h2>
                <Link href="/profil" className="text-xs font-medium text-primary underline-offset-4 hover:underline">
                  Gérer le profil
                </Link>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <Avatar className="size-12">
                  <AvatarFallback className="bg-accent text-base font-semibold text-accent-foreground">
                    {getInitials(user.firstName, user.lastName, user.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{fullName}</p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <Badge variant="secondary" className="mt-4">{roleLabel}</Badge>
            </section>

            <section aria-labelledby="announcements-title" className="rounded-xl border border-border/80 bg-card/75 p-5 shadow-sm backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Megaphone className="size-4 text-primary" aria-hidden="true" />
                <h2 id="announcements-title" className="text-sm font-semibold">Communiqués</h2>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Aucun communiqué synchronisé pour le moment.
              </p>
            </section>

            <section aria-labelledby="reports-title" className="rounded-xl border border-border/80 bg-card/75 p-5 shadow-sm backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <CircleAlert className="size-4 text-amber-600 dark:text-amber-300" aria-hidden="true" />
                <h2 id="reports-title" className="text-sm font-semibold">Signalements</h2>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Les signalements seront listés ici dès que leur flux sera disponible.
              </p>
            </section>

            <section aria-labelledby="information-title" className="rounded-xl border border-primary/20 bg-primary/5 p-5">
              <div className="flex items-center gap-2">
                <Bell className="size-4 text-primary" aria-hidden="true" />
                <h2 id="information-title" className="text-sm font-semibold">Information de service</h2>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                De nouvelles vagues de demandes sont publiées chaque heure. Consultez l’API officielle pour suivre les besoins de Terra Nova.
              </p>
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
