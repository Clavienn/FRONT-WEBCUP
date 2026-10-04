"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { FolderKanban, Landmark, Megaphone, MapPin, Search, type LucideIcon } from "lucide-react"

import { useLanguage } from "@/components/i18n/language-provider"
import { Spinner } from "@/components/ui/spinner"
import type { AuthUser } from "@/repository/auth.repository"
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

const RESULTS_PER_CATEGORY = 4

function groupByCategory(results: SearchResult[]): Partial<Record<SearchCategory, SearchResult[]>> {
  const groups: Partial<Record<SearchCategory, SearchResult[]>> = {}
  for (const result of results) {
    const group = groups[result.category] ?? (groups[result.category] = [])
    if (group.length < RESULTS_PER_CATEGORY) group.push(result)
  }
  return groups
}

// Recherche générale accessible depuis la barre du tableau de bord : aperçu en direct pendant la
// frappe (clic = ouvre directement le résultat), Entrée = page de résultats complète.
export function GlobalSearchBar({ user }: { user: AuthUser }) {
  const { t } = useLanguage()
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement | null>(null)

  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [results, setResults] = useState<SearchResult[] | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setResults(null)
      setLoading(false)
      return
    }
    let mounted = true
    setLoading(true)
    searchAll(debouncedQuery, user).then((found) => {
      if (mounted) {
        setResults(found)
        setLoading(false)
      }
    })
    return () => {
      mounted = false
    }
  }, [debouncedQuery, user])

  useEffect(() => {
    if (!open) return
    const onClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", onClickOutside)
    return () => document.removeEventListener("mousedown", onClickOutside)
  }, [open])

  const goToResultsPage = () => {
    const trimmed = query.trim()
    if (!trimmed) return
    setOpen(false)
    router.push(`/dashboard/recherche?q=${encodeURIComponent(trimmed)}`)
  }

  const groups = results ? groupByCategory(results) : {}
  const hasResults = results !== null && results.length > 0
  const showPanel = open && debouncedQuery.length >= 2

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault()
          goToResultsPage()
        }}
      >
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false)
              event.currentTarget.blur()
            }
          }}
          placeholder={t("search.placeholder")}
          aria-label={t("search.ariaLabel")}
          className="h-9 w-full rounded-full border border-border/80 bg-card/75 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </form>

      {showPanel && (
        <div className="absolute top-full z-50 mt-2 w-full overflow-hidden rounded-xl border border-border/80 bg-popover text-popover-foreground shadow-lg">
          {loading ? (
            <div className="flex items-center gap-2 px-4 py-4 text-sm text-muted-foreground">
              <Spinner className="size-4" />
              {t("search.minChars")}
            </div>
          ) : hasResults ? (
            <div className="max-h-96 overflow-y-auto py-1">
              {SEARCH_CATEGORIES.map((category) => {
                const items = groups[category]
                if (!items || items.length === 0) return null
                const Icon = CATEGORY_ICON[category]
                return (
                  <div key={category} className="px-2 py-1.5">
                    <p className="px-2 py-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      {t(CATEGORY_LABEL_KEY[category])}
                    </p>
                    {items.map((item) => (
                      <Link
                        key={`${item.category}-${item.id}`}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="flex items-start gap-2 rounded-lg px-2 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                      >
                        <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{item.title}</span>
                          {item.subtitle && (
                            <span className="block truncate text-xs text-muted-foreground">{item.subtitle}</span>
                          )}
                        </span>
                      </Link>
                    ))}
                  </div>
                )
              })}
              <button
                type="button"
                onClick={goToResultsPage}
                className="block w-full border-t border-border/70 px-4 py-2.5 text-left text-xs font-medium text-primary hover:bg-accent"
              >
                {t("search.seeAllResults")}
              </button>
            </div>
          ) : (
            <p className="px-4 py-4 text-sm text-muted-foreground">{t("search.noResults", { query: debouncedQuery })}</p>
          )}
        </div>
      )}
    </div>
  )
}
