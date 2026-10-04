"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"

import { useAuth } from "@/components/auth/auth-provider"
import { useLanguage } from "@/components/i18n/language-provider"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// Déconnexion automatique après une période sans activité : sur un poste partagé (mairie, cybercafé), la
// session d'une personne qui s'éloigne ne reste pas ouverte. L'usage normal n'est pas gêné : un
// avertissement apparaît 60 s avant, et un clic ou une touche suffit à rester connecté.
const IDLE_MINUTES = Number(process.env.NEXT_PUBLIC_IDLE_MINUTES) || 30
const IDLE_MS = IDLE_MINUTES * 60_000
const WARNING_MS = 60_000

const ACTIVITY_KEY = "terra-nova:last-activity"
// Lu par la page de connexion pour expliquer pourquoi la session s'est fermée
export const SESSION_EXPIRED_KEY = "terra-nova-session-expired"

const ACTIVITY_EVENTS = ["pointerdown", "keydown", "wheel", "touchstart", "scroll"] as const
// Une écriture dans localStorage toutes les 5 s au plus : le défilement ne doit pas la saturer
const WRITE_THROTTLE_MS = 5_000

export function IdleLogout() {
  const { user, signOut } = useAuth()
  const { t } = useLanguage()
  const router = useRouter()
  const lastActivity = useRef(0)
  const lastWrite = useRef(0)
  // Secondes restantes avant la déconnexion ; null = pas d'avertissement affiché
  const [remaining, setRemaining] = useState<number | null>(null)

  const markActivity = useCallback(() => {
    const now = Date.now()
    lastActivity.current = now
    // L'activité dans un autre onglet compte aussi : elle est partagée par localStorage
    if (now - lastWrite.current > WRITE_THROTTLE_MS) {
      lastWrite.current = now
      try {
        window.localStorage.setItem(ACTIVITY_KEY, String(now))
      } catch {
        // stockage indisponible : le minuteur de cet onglet suffit
      }
    }
    setRemaining((current) => (current === null ? current : null))
  }, [])

  useEffect(() => {
    if (!user) return

    lastActivity.current = Date.now()

    const onStorage = (event: StorageEvent) => {
      if (event.key === ACTIVITY_KEY && event.newValue) {
        lastActivity.current = Math.max(lastActivity.current, Number(event.newValue))
      }
    }

    for (const name of ACTIVITY_EVENTS) window.addEventListener(name, markActivity, { passive: true })
    window.addEventListener("storage", onStorage)

    // Calcul à partir de l'heure réelle et non d'un compte à rebours : un ordinateur mis en veille
    // se retrouve déconnecté au réveil, au lieu de repartir pour 30 minutes.
    const timer = window.setInterval(() => {
      const idle = Date.now() - lastActivity.current
      if (idle >= IDLE_MS) {
        window.clearInterval(timer)
        try {
          window.sessionStorage.setItem(SESSION_EXPIRED_KEY, "1")
        } catch {
          // sans sessionStorage, la page de connexion n'affichera simplement pas l'explication
        }
        void signOut().finally(() => router.replace("/connexion"))
      } else if (idle >= IDLE_MS - WARNING_MS) {
        setRemaining(Math.ceil((IDLE_MS - idle) / 1000))
      }
    }, 1000)

    return () => {
      for (const name of ACTIVITY_EVENTS) window.removeEventListener(name, markActivity)
      window.removeEventListener("storage", onStorage)
      window.clearInterval(timer)
    }
  }, [user, markActivity, signOut, router])

  if (!user) return null

  return (
    <AlertDialog open={remaining !== null} onOpenChange={(open) => !open && markActivity()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("idleLogout.title")}</AlertDialogTitle>
          <AlertDialogDescription>{t("idleLogout.description", { seconds: remaining ?? 0 })}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => void signOut().finally(() => router.replace("/connexion"))}>
            {t("idleLogout.signOut")}
          </AlertDialogCancel>
          <AlertDialogAction onClick={markActivity}>{t("idleLogout.stay")}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
