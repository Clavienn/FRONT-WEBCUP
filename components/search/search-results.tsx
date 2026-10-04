"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { FolderKanban, Landmark, Megaphone, MapPin, SearchX, type LucideIcon } from "lucide-react"

import { useAuth } from "@/components/auth/auth-provider"
import { useLanguage } from "@/components/i18n/language-provider"
import { Spinner } from "@/components/ui/spinner"
import { searchAll, SEARCH_CATEGORIES, type SearchCategory, type SearchResult } from "@/lib/search/global-search"

const CATEGORY_ICON: Record<SearchCategory, LucideIcon> = {
  services: Landmark,
  establishments: MapPin,
  projects: FolderKanban,
  announcements: Megaphone,
}

const CATEGORY_LABEL_KEY: Record<SearchCategory, string> = {
  services: "sidebar.items.servicesMunicipaux",
  establishments: "sidebar.items.lieuxUtiles",
  projects: "sidebar.items.projets",
  announcements: "sidebar.items.annonces",
}

function groupByCategory(results: SearchResult[]): Partial<Record<SearchCategory, SearchResult[]>> {
  const groups: Partial<Record<SearchCategory, SearchResult[]>> = {}
  for (const result of results) {
    const group = groups[result.category] ?? (groups[result.category] = [])
    group.push(result)
  }
  return groups
}

export function SearchResults() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const query = (useSearchParams().get("q") ?? "").trim()

  const [results, setResults] = useState<SearchResult[] | null>(null)

  useEffect(() => {
    if (!user || query.length < 2) {
      setResults(null)
      return
    }
    let mounted = true
    setResults(null)
    searchAll(query, user).then((found) => mounted && setResults(found))
    return () => {
      mounted = false
    }
  }, [query, user])

  if (!user) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t("search.resultsTitle", { query })}</h1>
        {results && <p className="mt-1 text-sm text-muted-foreground">{t("search.resultsCount", { count: results.length })}</p>}
      </div>

      {results === null ? (
        <div className="flex items-center gap-2 py-12 text-sm text-muted-foreground">
          <Spinner className="size-4" />
          {t("search.minChars")}
        </div>
      ) : results.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-border/80 bg-card/70 p-12 text-center">
          <SearchX className="size-6 text-muted-foreground" aria-hidden="true" />
          <p className="font-medium">{t("search.resultsEmpty")}</p>
          <p className="text-sm text-muted-foreground">{t("search.resultsEmptyHint")}</p>
        </div>
      ) : (
        <div className="space-y-8">
          {SEARCH_CATEGORIES.map((category) => {
            const items = groupByCategory(results)[category]
            if (!items || items.length === 0) return null
            const Icon = CATEGORY_ICON[category]
            return (
              <section key={category} aria-labelledby={`search-${category}-title`} className="space-y-3">
                <h2 id={`search-${category}-title`} className="flex items-center gap-2 text-sm font-semibold">
                  <Icon className="size-4 text-primary" aria-hidden="true" />
                  {t(CATEGORY_LABEL_KEY[category])}
                </h2>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {items.map((item) => (
                    <Link
                      key={`${item.category}-${item.id}`}
                      href={item.href}
                      className="block rounded-xl border border-border/80 bg-card/70 p-4 shadow-sm transition-colors hover:border-primary/50"
                    >
                      <p className="truncate text-sm font-semibold">{item.title}</p>
                      {item.subtitle && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.subtitle}</p>}
                    </Link>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
