"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ClipboardPlus, Landmark, UserRoundCog, type LucideIcon } from "lucide-react"

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
import { isStaff, type AuthUser } from "@/repository/auth.repository"

// Une clé par utilisateur : deux comptes sur le même navigateur voient chacun la modale une fois.
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
  key: "profile" | "services" | "request"
  icon: LucideIcon
  href: string
  // Permission requise ; absente = toujours proposée
  permission?: string
}

const ACTIONS: WelcomeAction[] = [
  { key: "profile", icon: UserRoundCog, href: "/profil" },
  { key: "services", icon: Landmark, href: "/dashboard/services", permission: "citizen.services.view" },
  { key: "request", icon: ClipboardPlus, href: "/dashboard#recent-requests-title", permission: "citizen.requests.create" },
]

/**
 * Accueil de l'espace citoyen, affiché une seule fois par utilisateur : trois premiers pas.
 * Il est marqué comme vu dès son affichage, pas à sa fermeture : recharger la page ou le
 * fermer avec Échap ne le fait pas réapparaître. Réservé aux citoyens (les agents et
 * administrateurs ont une console, pas ces trois démarches).
 */
export function WelcomeModal({ user }: Readonly<{ user: AuthUser }>) {
  const { t } = useLanguage()
  const eligible = !isStaff(user)
  // Calculé à la création : ce composant n'est monté qu'une fois l'utilisateur connu (le cadre du
  // dashboard affiche un spinner avant), donc jamais rendu côté serveur et sans écart d'hydratation.
  const [open, setOpen] = useState(() => eligible && !alreadySeen(user.id))

  // Marqué comme vu dès l'affichage : fermer, recharger ou naviguer ne le fait pas revenir.
  // L'effet ne fait qu'écrire dans le stockage du navigateur (système externe), aucun setState.
  useEffect(() => {
    if (open) markSeen(user.id)
  }, [open, user.id])

  if (!eligible) return null

  const name = user.firstName?.trim() || ""
  const actions = ACTIONS.filter((action) => !action.permission || user.permissions.includes(action.permission))

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {name ? t("welcomeModal.titleNamed", { name }) : t("welcomeModal.title")}
          </DialogTitle>
          <DialogDescription>{t("welcomeModal.description")}</DialogDescription>
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
