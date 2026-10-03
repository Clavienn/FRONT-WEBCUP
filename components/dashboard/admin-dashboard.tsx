import {
  Activity,
  AlertTriangle,
  Bell,
  CheckCircle2,
  CircleAlert,
  CircleX,
  ClipboardList,
  Clock3,
  KeyRound,
  Megaphone,
  RadioTower,
  ShieldCheck,
  Users,
} from "lucide-react"

import type { AuthUser } from "@/repository/auth.repository"
import { Badge } from "@/components/ui/badge"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"

const adminMetrics = [
  { label: "Demandes reçues", icon: ClipboardList, source: "Flux Terra Nova" },
  { label: "Comptes citoyens", icon: Users, source: "Gestion des comptes" },
  { label: "Accès à vérifier", icon: ShieldCheck, source: "Permissions" },
  { label: "Alertes sécurité", icon: AlertTriangle, source: "Journal d’audit" },
]

const requestStatuses = [
  { label: "En attente", icon: Clock3, tone: "text-amber-700 dark:text-amber-300" },
  { label: "En cours", icon: Activity, tone: "text-sky-700 dark:text-sky-300" },
  { label: "Acceptées", icon: CheckCircle2, tone: "text-emerald-700 dark:text-emerald-300" },
  { label: "Rejetées", icon: CircleX, tone: "text-destructive" },
]

const governanceChecks = [
  "Vérifier la configuration de la clé API côté serveur",
  "Suivre l’arrivée des nouvelles vagues de demandes",
  "Contrôler les accès selon les permissions attribuées",
]

export function AdminDashboard({ user }: { user: AuthUser }) {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email

  return (
    <DashboardShell user={user}>
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Haut Conseil de Terra Nova</p>
          <h1 className="mt-1 text-3xl font-medium tracking-tight sm:text-4xl">
            Console d’administration
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Vue globale des services, des accès et des flux de la plateforme.
          </p>
        </div>
        <Badge variant="outline" className="w-fit gap-1.5 rounded-full px-3 py-1 text-muted-foreground">
          <ShieldCheck className="size-3.5 text-primary" aria-hidden="true" />
          Accès administrateur
        </Badge>
      </section>

      <section aria-labelledby="admin-metrics-title" className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 id="admin-metrics-title" className="text-lg font-semibold">Indicateurs de pilotage</h2>
            <p className="text-sm text-muted-foreground">Les compteurs globaux apparaîtront après connexion des sources officielles.</p>
          </div>
          <span className="text-xs text-muted-foreground">Sources non synchronisées</span>
        </div>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {adminMetrics.map(({ label, icon: Icon, source }) => (
            <div key={label} className="rounded-xl border border-border/80 bg-card/75 p-4 shadow-sm backdrop-blur-sm">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">{label}</p>
                <Icon className="size-4 shrink-0 text-primary" aria-hidden="true" />
              </div>
              <p className="mt-3 text-2xl font-semibold tabular-nums">—</p>
              <p className="mt-1 text-xs text-muted-foreground">{source}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-8">
          <section aria-labelledby="admin-requests-title" className="space-y-4">
            <div>
              <h2 id="admin-requests-title" className="text-lg font-semibold">Supervision des demandes</h2>
              <p className="text-sm text-muted-foreground">Vue transversale des statuts transmis par l’API Terra Nova.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {requestStatuses.map(({ label, icon: Icon, tone }) => (
                <section key={label} className="rounded-xl border border-border/80 bg-card/70 p-4 shadow-sm backdrop-blur-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="grid size-9 place-items-center rounded-lg bg-muted">
                        <Icon className={`size-4 ${tone}`} aria-hidden="true" />
                      </span>
                      <h3 className="text-sm font-semibold">{label}</h3>
                    </div>
                    <span className="text-xl font-semibold tabular-nums">—</span>
                  </div>
                  <p className="mt-3 border-t border-border/70 pt-3 text-xs text-muted-foreground">
                    Aucun volume disponible avant synchronisation.
                  </p>
                </section>
              ))}
            </div>
          </section>

          <section aria-labelledby="access-admin-title" className="space-y-4 rounded-2xl border border-border/80 bg-card/65 p-5 shadow-sm backdrop-blur-sm sm:p-6">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <Users className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h2 id="access-admin-title" className="text-lg font-semibold">Accès et gouvernance</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Les rôles déterminent l’accès aux espaces citoyen, agent et administration.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-border/70 bg-background/55 p-4">
                <p className="text-xs font-medium text-muted-foreground">Administrateur connecté</p>
                <p className="mt-2 truncate text-sm font-semibold">{fullName}</p>
                <p className="mt-1 text-xs text-muted-foreground">{user.email}</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/55 p-4">
                <p className="text-xs font-medium text-muted-foreground">Rôles attribués</p>
                <p className="mt-2 text-sm font-semibold">{user.roles.join(", ")}</p>
                <p className="mt-1 text-xs text-muted-foreground">D’après la session authentifiée</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/55 p-4">
                <p className="text-xs font-medium text-muted-foreground">Permissions effectives</p>
                <p className="mt-2 text-2xl font-semibold tabular-nums">{user.permissions.length}</p>
                <p className="mt-1 text-xs text-muted-foreground">Attribuées à votre compte</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-border/70 bg-background/55 p-4">
              <KeyRound className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium">Gestion des autres comptes</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Le répertoire global, les changements de rôle et l’audit des permissions ne sont pas encore reliés à une source de données.
                </p>
              </div>
            </div>
          </section>

          <section aria-labelledby="governance-checks-title" className="rounded-2xl border border-border/80 bg-card/65 p-5 shadow-sm backdrop-blur-sm sm:p-6">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
              <h2 id="governance-checks-title" className="text-base font-semibold">Points de pilotage</h2>
            </div>
            <ul className="mt-4 divide-y divide-border/70">
              {governanceChecks.map((check) => (
                <li key={check} className="flex items-start gap-3 py-3 text-sm leading-6 text-muted-foreground first:pt-0 last:pb-0">
                  <CircleAlert className="mt-1 size-4 shrink-0 text-amber-600 dark:text-amber-300" aria-hidden="true" />
                  {check}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="space-y-4">
          <section aria-labelledby="api-admin-title" className="rounded-2xl border border-border/80 bg-card/70 p-5 shadow-sm backdrop-blur-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <RadioTower className="size-4 text-primary" aria-hidden="true" />
                <h2 id="api-admin-title" className="text-sm font-semibold">API officielle</h2>
              </div>
              <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200">
                À connecter
              </Badge>
            </div>
            <dl className="mt-4 divide-y divide-border/70">
              <div className="flex items-center justify-between gap-3 py-3 text-sm">
                <dt className="text-muted-foreground">Dernier échange</dt>
                <dd className="font-medium">—</dd>
              </div>
              <div className="flex items-center justify-between gap-3 py-3 text-sm">
                <dt className="text-muted-foreground">Clé équipe</dt>
                <dd className="font-medium">Requise côté serveur</dd>
              </div>
              <div className="flex items-center justify-between gap-3 py-3 text-sm">
                <dt className="text-muted-foreground">Prochaine vague</dt>
                <dd className="font-medium">Publication horaire</dd>
              </div>
            </dl>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Aucun secret ni statut de connexion n’est exposé dans cette maquette.
            </p>
          </section>

          <section aria-labelledby="admin-comms-title" className="rounded-xl border border-border/80 bg-card/75 p-5 shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <Megaphone className="size-4 text-primary" aria-hidden="true" />
              <h2 id="admin-comms-title" className="text-sm font-semibold">Communications</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              La publication et la modération des communiqués seront disponibles lorsque leur flux sera intégré.
            </p>
            <Badge variant="outline" className="mt-3">Aucune donnée synchronisée</Badge>
          </section>

          <section aria-labelledby="admin-alerts-title" className="rounded-xl border border-border/80 bg-card/75 p-5 shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <Bell className="size-4 text-primary" aria-hidden="true" />
              <h2 id="admin-alerts-title" className="text-sm font-semibold">Alertes et journal</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Les signalements prioritaires et les événements de sécurité apparaîtront ici après connexion de leurs sources.
            </p>
            <div className="mt-4 flex items-center gap-2 border-t border-border/70 pt-3 text-xs text-muted-foreground">
              <CircleAlert className="size-3.5 shrink-0" aria-hidden="true" />
              <span>Pas de flux d’alertes connecté</span>
            </div>
          </section>
        </aside>
      </div>
    </DashboardShell>
  )
}