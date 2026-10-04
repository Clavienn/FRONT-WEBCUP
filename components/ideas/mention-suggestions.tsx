"use client"

import { useEffect, useRef } from "react"
import { CornerDownLeft, Search } from "lucide-react"

import { useLanguage } from "@/components/i18n/language-provider"
import { Spinner } from "@/components/ui/spinner"
import type { MentionSuggestion } from "@/repository/idea.repository"

export function MentionSuggestions({
  suggestions,
  isLoading,
  activeIndex,
  query,
  onPick,
  onHover,
}: {
  suggestions: MentionSuggestion[]
  isLoading: boolean
  activeIndex: number
  query: string
  onPick: (suggestion: MentionSuggestion) => void
  onHover: (index: number) => void
}) {
  const { t } = useLanguage()
  const listRef = useRef<HTMLUListElement>(null)

  // L'option active doit rester visible quand le clavier descend la liste
  useEffect(() => {
    listRef.current?.children[activeIndex]?.scrollIntoView({ block: "nearest" })
  }, [activeIndex])

  return (
    <div className="rounded-2xl border border-border/70 bg-popover p-1.5 shadow-lg">
      <p className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground">
        {isLoading ? <Spinner className="size-3" /> : <Search className="size-3" aria-hidden="true" />}
        {query.trim() ? t("ideaMentions.results", { query: query.trim() }) : t("ideaMentions.resultsAll")}
      </p>
      {suggestions.length === 0 ? (
        <p className="px-2 py-3 text-center text-sm text-muted-foreground">{t("ideaMentions.empty")}</p>
      ) : (
        <ul ref={listRef} role="listbox" aria-label={t("ideaMentions.menuLabel")} className="max-h-64 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <li key={`${suggestion.type}-${suggestion.id}`} role="option" aria-selected={index === activeIndex}>
              <button
                type="button"
                onMouseEnter={() => onHover(index)}
                onMouseDown={(event) => {
                  // mousedown et non click : le clic ne doit pas voler le focus au textarea
                  event.preventDefault()
                  onPick(suggestion)
                }}
                className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors ${
                  index === activeIndex ? "bg-accent text-accent-foreground" : "hover:bg-accent/60"
                }`}
              >
                <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {t(`ideaMentions.types.${suggestion.type}`)}
                </span>
                <span className="min-w-0 flex-1 truncate">{suggestion.label}</span>
                {index === activeIndex && <CornerDownLeft className="size-3.5 shrink-0 opacity-60" aria-hidden="true" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}