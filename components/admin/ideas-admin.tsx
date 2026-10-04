"use client"

import { useEffect, useState } from "react"
import { Lightbulb, RefreshCw } from "lucide-react"

import { useLanguage } from "@/components/i18n/language-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ideaRepository, type IdeaList } from "@/repository/idea.repository"

const PAGE_SIZE = 20

// File en lecture seule : les idées sont le reflet d'une parole d'habitant, pas une donnée à éditer
export function IdeasAdmin() {
  const { t, locale } = useLanguage()
  const [page, setPage] = useState(1)
  const [data, setData] = useState<IdeaList | null>(null)
  const [error, setError] = useState("")
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let mounted = true
    ideaRepository
      .listAll(page, PAGE_SIZE)
      .then((result) => mounted && (setData(result), setError("")))
      .catch((cause) => mounted && setError(cause instanceof Error ? cause.message : t("ideasAdmin.loadError")))
    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rechargement au changement de page
  }, [page, reloadKey])

  const formatDate = (value: string) =>
    new Date(value).toLocaleString(locale === "en" ? "en-GB" : "fr-FR", { dateStyle: "medium", timeStyle: "short" })

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-primary">{t("ideasAdmin.eyebrow")}</p>
          <h1 className="mt-1 text-2xl font-medium tracking-tight sm:text-3xl">{t("ideasAdmin.title")}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{t("ideasAdmin.subtitle")}</p>
        </div>
        <Button variant="outline" onClick={() => setReloadKey((key) => key + 1)}>
          <RefreshCw className="size-4" aria-hidden="true" />
          {t("ideasAdmin.refresh")}
        </Button>
      </header>

      {error ? (
        <p role="alert" className="text-sm text-destructive">{error}</p>
      ) : !data ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : data.ideas.length === 0 ? (
        <p className="rounded-xl border border-border/80 bg-card/75 p-8 text-center text-sm text-muted-foreground">
          {t("ideasAdmin.empty")}
        </p>
      ) : (
        <ul className="space-y-3">
          {data.ideas.map((idea) => (
            <li key={idea.id} className="rounded-xl border border-border/80 bg-card/75 p-5 shadow-sm backdrop-blur-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Lightbulb className="size-4 shrink-0 text-primary" aria-hidden="true" />
                <Badge variant="outline" className="font-mono text-xs">{idea.reference}</Badge>
                <span className="text-sm font-medium">{idea.author ? idea.author.name : t("ideasAdmin.anonymous")}</span>
                <time dateTime={idea.createdAt} className="ml-auto text-xs text-muted-foreground">
                  {formatDate(idea.createdAt)}
                </time>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-foreground">{idea.content}</p>
              {idea.mentions.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-1.5 border-t border-border/70 pt-3">
                  {idea.mentions.map((mention) => (
                    <li key={`${mention.type}-${mention.id}`}>
                      <Badge variant="outline" className="gap-1.5 text-xs font-normal">
                        <span className="font-medium text-muted-foreground">
                          {t(`ideaMentions.types.${mention.type}`)}
                        </span>
                        <span className="max-w-64 truncate">{mention.label}</span>
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}

      {data && data.total > PAGE_SIZE && (
        <div className="flex items-center justify-between gap-3 border-t border-border/70 pt-4">
          <p className="text-xs text-muted-foreground tabular-nums">
            {t("ideasAdmin.total", { count: data.total, page, pages: totalPages })}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>
              {t("ideasAdmin.previous")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((current) => current + 1)}
            >
              {t("ideasAdmin.next")}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}