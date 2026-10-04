"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ShieldAlert, X } from "lucide-react"

import { useAuth } from "@/components/auth/auth-provider"
import { useLanguage } from "@/components/i18n/language-provider"
import { Button } from "@/components/ui/button"
import { authRepository } from "@/repository/auth.repository"

const WINDOW_MS = 24 * 60 * 60 * 1000
const DISMISSED_KEY = "terra-nova:login-notice-dismissed"

/**
 * À l'ouverture de la session : si quelqu'un a essayé de se connecter à CE compte avec un mauvais mot de passe ces
 * dernières 24 h (c'est ainsi que se manifestent des tentatives sur plusieurs comptes), l'habitant en est prévenu
 * avec la marche à suivre. Rien ne s'affiche quand tout va bien ; un clic suffit à l'écarter.
 */
export function LoginSecurityNotice() {
  const { user } = useAuth()
  const { t } = useLanguage()
  // { count, latest } : nombre d'échecs et date du dernier (clé de fermeture : un nouvel échec ré-affiche l'avis)
  const [alert, setAlert] = useState<{ count: number; latest: string } | null>(null)
  const userId = user?.id

  useEffect(() => {
    if (!userId) return
    let mounted = true
    authRepository
      .security()
      .then((overview) => {
        if (!mounted) return
        const since = Date.now() - WINDOW_MS
        const failures = overview.events.filter((event) => event.action === "login.failed" && new Date(event.at).getTime() > since)
        if (failures.length === 0) return
        const latest = failures.reduce((max, event) => (event.at > max ? event.at : max), failures[0].at)
        let dismissed: string | null = null
        try {
          dismissed = window.sessionStorage.getItem(`${DISMISSED_KEY}:${userId}`)
        } catch {
          // sans sessionStorage, l'avis revient à chaque chargement : acceptable
        }
        if (dismissed !== latest) setAlert({ count: failures.length, latest })
      })
      .catch(() => undefined)
    return () => {
      mounted = false
    }
  }, [userId])

  if (!alert || !userId) return null

  const dismiss = () => {
    try {
      window.sessionStorage.setItem(`${DISMISSED_KEY}:${userId}`, alert.latest)
    } catch {
      // sans importance
    }
    setAlert(null)
  }

  return (
    <div role="alert" className="border-b-2 border-amber-500/70 bg-amber-500/10 px-4 py-3 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3">
        <ShieldAlert className="size-5 shrink-0 text-amber-600" aria-hidden="true" />
        <div className="min-w-0 flex-1 text-sm">
          <p className="font-semibold">{t("loginNotice.title", { count: alert.count })}</p>
          <p className="text-muted-foreground">{t("loginNotice.advice")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" nativeButton={false} render={<Link href="/profil" />}>
            {t("loginNotice.action")}
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={dismiss} aria-label={t("loginNotice.dismiss")}>
            <X aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  )
}
