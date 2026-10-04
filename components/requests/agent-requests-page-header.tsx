"use client"

import { useLanguage } from "@/components/i18n/language-provider"

export function AgentRequestsPageHeader() {
  const { t } = useLanguage()

  return (
    <section>
      <p className="text-sm font-medium text-primary">{t("agentRequestsPage.eyebrow")}</p>
      <h1 className="mt-1 text-3xl font-medium tracking-tight sm:text-4xl">{t("agentRequestsPage.title")}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{t("agentRequestsPage.description")}</p>
    </section>
  )
}
