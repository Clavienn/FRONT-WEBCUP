"use client"

import { TransportView } from "@/components/transport/transport-view"
import { useLanguage } from "@/components/i18n/language-provider"
import { Breadcrumb } from "@/components/navigation/breadcrumb"

// Page publique des transports : lisible sans compte, partageable par lien (« /transports?tab=journey »)
export function PublicTransportPage() {
  const { t } = useLanguage()
  return (
    <main className="app-atmosphere min-h-screen px-4 py-10">
      <div className="mx-auto max-w-4xl space-y-6">
        <Breadcrumb items={[{ label: t("nav.accueil"), href: "/" }, { label: t("transport.title") }]} />
        <TransportView />
      </div>
    </main>
  )
}
