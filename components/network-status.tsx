"use client"

import { useSyncExternalStore } from "react"
import { WifiOff } from "lucide-react"

import { useLanguage } from "@/components/i18n/language-provider"

function subscribe(onChange: () => void) {
  window.addEventListener("online", onChange)
  window.addEventListener("offline", onChange)
  return () => {
    window.removeEventListener("online", onChange)
    window.removeEventListener("offline", onChange)
  }
}

// Bandeau discret quand le navigateur perd sa connexion : l'utilisateur comprend pourquoi une action
// échoue, et sait que ce qu'il voit peut ne pas être à jour. Il disparaît seul au retour du réseau.
export function NetworkStatus() {
  const { t } = useLanguage()
  const online = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true
  )

  if (online) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 bottom-0 z-[60] flex items-center justify-center gap-2 border-t border-amber-500/40 bg-amber-100 px-4 py-2 text-sm font-medium text-amber-950 dark:bg-amber-950 dark:text-amber-100"
    >
      <WifiOff className="size-4 shrink-0" aria-hidden="true" />
      {t("network.offline")}
    </div>
  )
}
