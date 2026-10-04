"use client"

import { useEffect } from "react"

import { useAuth } from "@/components/auth/auth-provider"
import { useLanguage } from "@/components/i18n/language-provider"
import { toast } from "@/components/ui/toast"
import { flushOutbox, pending } from "@/lib/signalement-outbox"

const RETRY_MS = 30_000

// Renvoie les signalements gardés sur l'appareil : au chargement, au retour de la connexion et toutes les 30 s
// tant qu'il en reste. Monté une fois à la racine du site (aucun rendu).
export function SignalementOutbox() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const userId = user?.id

  useEffect(() => {
    if (!userId) return
    const run = async () => {
      if (pending(userId).length === 0) return
      const sent = await flushOutbox(userId)
      if (sent > 0) toast.add({ title: t("signalements.outbox.sent", { count: sent }), type: "success" })
    }
    void run()
    const timer = window.setInterval(() => void run(), RETRY_MS)
    const onOnline = () => void run()
    window.addEventListener("online", onOnline)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener("online", onOnline)
    }
  }, [userId, t])

  return null
}
