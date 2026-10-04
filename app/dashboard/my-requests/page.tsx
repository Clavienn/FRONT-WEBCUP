import type { Metadata } from "next"
import { RequirePermission } from "@/components/dashboard/dashboard-shell"
import { CitizenRequestsPanel } from "@/components/requests/citizen-requests-panel"

export const metadata: Metadata = {
  title: "Mes démarches | Terra Nova",
  description: "Suivi de vos demandes adressées à la ville de Terra Nova.",
}

export default function MyRequestsPage() {
  return (
    <RequirePermission permission="citizen.requests.view">
      <section className="relative overflow-hidden rounded-2xl border border-border/80 bg-card/85 p-6 shadow-sm backdrop-blur-xl sm:p-7">
        <div className="mb-3 flex items-center justify-between border-b border-border/60 pb-2.5 text-[11px] font-mono tracking-wider text-muted-foreground">
          <span className="flex items-center gap-2 font-medium text-primary">
            <span className="size-2 rounded-full bg-cyan-400 animate-pulse" />
            REGISTRE OFFICIEL DES DÉMARCHES CITOYENNES
          </span>
          <span className="hidden sm:inline font-mono text-xs uppercase text-muted-foreground">
            BUREAU DES SERVICES MUNICIPAUX
          </span>
        </div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Espace citoyen // Suivi</p>
        <h1 className="font-display mt-1 text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
          Mes démarches
        </h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Déposez une demande officielle à l'administration de Terra Nova et suivez son évolution en temps réel.
        </p>
      </section>
      <CitizenRequestsPanel hideHeader />
    </RequirePermission>
  )
}
