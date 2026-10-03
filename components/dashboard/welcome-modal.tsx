"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ClipboardPlus, Inbox, Landmark, UserRoundCog, type LucideIcon } from "lucide-react"

import { useLanguage } from "@/components/i18n/language-provider"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { authRepository, isStaff, type AuthUser } from "@/repository/auth.repository"

// Une clé par utilisateur : deux comptes sur le même navigateur voient chacun la modale une fois.
// C'est un garde-fou en plus du serveur, qui ne compte que les sessions ouvertes (voir WelcomeModal).
const storageKey = (userId: number) => `terra-nova-welcome-seen:${userId}`

// localStorage peut lever (navigation privée, stockage bloqué) : dans ce cas on n'affiche rien
// plutôt que de rouvrir la modale à chaque page.
function alreadySeen(userId: number): boolean {
  try {
    return window.localStorage.getItem(storageKey(userId)) === "1"
  } catch {
    return true
  }
}

function markSeen(userId: number) {
  try {
    window.localStorage.setItem(storageKey(userId), "1")
  } catch {
    // Non bloquant : au pire la modale ne sera pas mémorisée
  }
}

interface WelcomeAction {
  key: "profile" | "services" | "request" | "queue"
  icon: LucideIcon
  href: string
  // Permission requise ; absente = toujours proposée
  permission?: string
  // Vue du dashboard où la cible existe ; absente = les deux. L'ancre "Mes démarches" n'existe que
  // dans la vue citoyenne : proposer la même cible à un agent l'enverrait sur une page sans effet.
  view?: "citizen" | "staff"
}

const ACTIONS: WelcomeAction[] = [
  { key: "profile", icon: UserRoundCog, href: "/profil" },
  { key: "services", icon: Landmark, href: "/dashboard/services", permission: "citizen.services.view" },
  { key: "request", icon: ClipboardPlus, href: "/dashboard#recent-requests-title", permission: "citizen.requests.create", view: "citizen" },
  { key: "queue", icon: Inbox, href: "/dashboard/agent/requests", permission: "agent.requests.view", view: "staff" },
]

/**
 * Accueil du dashboard, affiché une seule fois par utilisateur : trois premiers pas. Les citoyens,
 * les agents et les administrateurs le voient ; seule la 3e action change (déposer une demande
 * pour un citoyen, ouvrir la file des demandes pour le personnel).
 *
 * Deux conditions, toutes deux nécessaires :
 *  1. le serveur répond showWelcome (moins de 2 sessions ouvertes pour ce compte) ;
 *  2. cet utilisateur ne l'a pas déjà vue sur ce navigateur. Sans cela, se déconnecter puis se
 *     reconnecter repasse le compte à 1 session et la modale reviendrait à chaque connexion.
 * Il est marqué comme vu dès son affichage, pas à sa fermeture : recharger la page ou le
 * fermer avec Échap ne le fait pas réapparaître. Si le serveur ne répond pas, rien n'est affiché.
 */
export function WelcomeModal({ user }: Readonly<{ user: AuthUser }>) {
  const { t } = useLanguage()
  const staff = isStaff(user)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (alreadySeen(user.id)) return
    let cancelled = false
    authRepository
      .welcomeStatus()
      .then(({ showWelcome }) => {
        if (cancelled || !showWelcome) return
        markSeen(user.id)
        setOpen(true)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [user.id])

  const name = user.firstName?.trim() || ""
  const actions = ACTIONS.filter(
    (action) =>
      (!action.view || action.view === (staff ? "staff" : "citizen")) &&
      (!action.permission || user.permissions.includes(action.permission))
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {name ? t("welcomeModal.titleNamed", { name }) : t("welcomeModal.title")}
          </DialogTitle>
          <DialogDescription>
            {t(staff ? "welcomeModal.descriptionStaff" : "welcomeModal.description")}
          </DialogDescription>
        </DialogHeader>

        <ul className="grid gap-3">
          {actions.map(({ key, icon: Icon, href }) => (
            <li key={key}>
              <Button
                nativeButton={false}
                render={<Link href={href} />}
                variant={key === "profile" ? "default" : "outline"}
                className="h-auto w-full justify-start gap-3 whitespace-normal px-4 py-3 text-left"
                onClick={() => setOpen(false)}
              >
                <Icon className="size-5 shrink-0" aria-hidden="true" />
                <span className="grid gap-0.5">
                  <span className="text-sm font-semibold">{t(`welcomeModal.${key}.title`)}</span>
                  <span className="text-xs font-normal opacity-80">{t(`welcomeModal.${key}.description`)}</span>
                </span>
              </Button>
            </li>
          ))}
        </ul>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            {t("welcomeModal.later")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
