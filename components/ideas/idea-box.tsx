"use client"

import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react"
import { ArrowUp, AtSign, CircleAlert, Plus, X } from "lucide-react"

import { useLanguage } from "@/components/i18n/language-provider"
import { MentionSuggestions } from "@/components/ideas/mention-suggestions"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { ideaRepository, type MentionSuggestion } from "@/repository/idea.repository"

// Mêmes bornes que l'API : le compteur sert à voir la limite, pas à la deviner
const MIN_LENGTH = 10
const MAX_LENGTH = 2000
const MAX_MENTIONS = 5

export function IdeaBox() {
  const { t } = useLanguage()
  const [content, setContent] = useState("")
  // La pastille affiche le libellé de l'objet ; l'API ne reçoit que le couple type/id
  const [mentions, setMentions] = useState<MentionSuggestion[]>([])
  const [suggestions, setSuggestions] = useState<MentionSuggestion[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [error, setError] = useState("")
  const [confirmation, setConfirmation] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  // Mention en cours de frappe : le mot cherché et la position où elle sera insérée
  const [pending, setPending] = useState<{ query: string; start: number } | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const searchKey = useRef(0)

  const isMenuOpen = pending !== null

  const closeMenu = useCallback(() => {
    setPending(null)
    setSuggestions([])
    setActiveIndex(0)
  }, [])

  const handleChange = (value: string, cursor: number) => {
    setContent(value)
    // Le menu se referme si le "@" tapé n'est plus devant le curseur
    if (!pending) return
    if (cursor < pending.start || value.slice(pending.start, cursor).includes("@")) closeMenu()
  }

  // Recherche différée : on évite une requête par lettre tapée
  useEffect(() => {
    if (!pending) return
    const key = ++searchKey.current
    const timer = setTimeout(() => {
      ideaRepository
        .searchMentions(pending.query)
        .then((result) => {
          if (key !== searchKey.current) return
          setSuggestions(result.suggestions)
          setActiveIndex(0)
        })
        .catch(() => key === searchKey.current && setSuggestions([]))
        .finally(() => key === searchKey.current && setIsSearching(false))
    }, 180)
    return () => clearTimeout(timer)
  }, [pending])

  const pick = (suggestion: MentionSuggestion) => {
    const textarea = textareaRef.current
    if (!pending || !textarea) return
    const before = content.slice(0, pending.start)
    const after = content.slice(textarea.selectionStart)
    const inserted = `@${t(`ideaMentions.types.${suggestion.type}`)} : ${suggestion.label} `
    setContent(`${before}${inserted}${after}`)
    setMentions((current) =>
      current.some((m) => m.type === suggestion.type && m.id === suggestion.id)
        ? current
        : [...current, suggestion].slice(0, MAX_MENTIONS)
    )
    closeMenu()
    // Le curseur doit repartir après l'insertion, sinon la frappe suivante écrase la mention
    requestAnimationFrame(() => {
      const position = (before + inserted).length
      textarea.focus()
      textarea.setSelectionRange(position, position)
    })
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (!isMenuOpen) return
    if (event.key === "ArrowDown") {
      event.preventDefault()
      setActiveIndex((index) => (index + 1) % Math.max(suggestions.length, 1))
      return
    }
    if (event.key === "ArrowUp") {
      event.preventDefault()
      setActiveIndex((index) => (index - 1 + Math.max(suggestions.length, 1)) % Math.max(suggestions.length, 1))
      return
    }
    if (event.key === "Escape") {
      event.preventDefault()
      closeMenu()
      return
    }
    if (event.key === "Enter" && suggestions[activeIndex]) {
      event.preventDefault()
      pick(suggestions[activeIndex])
    }
  }

  // Détection du "@" : le mot qui suit le curseur est le filtre du menu
  const handleSelect = (event: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const cursor = event.currentTarget.selectionStart ?? 0
    const before = content.slice(0, cursor)
    const match = /(^|\s)@([\p{L}\p{N} .-]{0,40})$/u.exec(before)
    if (!match) return
    setSuggestions([])
    setIsSearching(true)
    // start pointe sur le "@" lui-même : la mention le remplace, il ne doit pas rester dans le texte
    setPending({ query: match[2], start: cursor - match[2].length - 1 })
  }

  const removeMention = (mention: MentionSuggestion) => {
    setMentions((current) => current.filter((m) => !(m.type === mention.type && m.id === mention.id)))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const idea = content.trim()
    if (idea.length < MIN_LENGTH) {
      setError(t("ideaBox.tooShort", { min: MIN_LENGTH }))
      return
    }
    setError("")
    setConfirmation("")
    closeMenu()
    setIsSaving(true)
    try {
      // La référence renvoyée par l'API est la seule trace visible pour l'habitant :
      // la liste des idées est réservée aux administrateurs.
      const created = await ideaRepository.create(
        idea,
        mentions.map(({ type, id }) => ({ type, id }))
      )
      setConfirmation(created.confirmation)
      setContent("")
      setMentions([])
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("ideaBox.submitError"))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section aria-labelledby="idea-box-title" className="mx-auto w-full max-w-3xl space-y-4 py-6">
      <div className="text-center">
        <h1 id="idea-box-title" className="text-2xl font-medium tracking-tight sm:text-3xl">
          {t("ideaBox.title")}
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{t("ideaBox.subtitle")}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2">
        {/* La pilule est le seul contenant : le composeur ne ressemble pas à une card */}
        <div className="flex items-end gap-2 rounded-[28px] border border-border/70 bg-muted/60 p-2 pl-5 transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30">
          <Plus className="mb-2.5 size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <Textarea
            ref={textareaRef}
            aria-label={t("ideaBox.label")}
            placeholder={t("ideaBox.placeholder")}
            rows={1}
            value={content}
            onChange={(event) => handleChange(event.target.value, event.target.selectionStart ?? 0)}
            onSelect={handleSelect}
            onKeyDown={handleKeyDown}
            onBlur={() => closeMenu()}
            maxLength={MAX_LENGTH}
            disabled={isSaving}
            className="min-h-10 flex-1 resize-none border-0 bg-transparent px-0 shadow-none focus-visible:border-0 focus-visible:ring-0 dark:bg-transparent"
          />
          <Button
            type="submit"
            size="icon-lg"
            className="size-10 rounded-full"
            disabled={isSaving}
            aria-label={t("ideaBox.submitLabel")}
          >
            {isSaving ? <Spinner /> : <ArrowUp className="size-5" aria-hidden="true" />}
          </Button>
        </div>

        {isMenuOpen && (
          <MentionSuggestions
            suggestions={suggestions}
            isLoading={isSearching}
            activeIndex={activeIndex}
            query={pending?.query ?? ""}
            onPick={pick}
            onHover={setActiveIndex}
          />
        )}

        {mentions.length > 0 && (
          <ul className="flex flex-wrap gap-2 px-1">
            {mentions.map((mention) => (
              <li key={`${mention.type}-${mention.id}`}>
                <button
                  type="button"
                  onClick={() => removeMention(mention)}
                  className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-2.5 py-1 text-xs text-primary transition-colors hover:bg-primary/10"
                >
                  <AtSign className="size-3 shrink-0" aria-hidden="true" />
                  <span className="truncate">
                    {t(`ideaMentions.types.${mention.type}`)} · {mention.label}
                  </span>
                  <X className="size-3 shrink-0" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center justify-between gap-3 px-1">
          <p className="text-xs text-muted-foreground">{t("ideaBox.hint")}</p>
          <p className="text-xs text-muted-foreground tabular-nums">
            {t("ideaBox.counter", { count: content.trim().length, max: MAX_LENGTH })}
          </p>
        </div>

        {error && (
          <p role="alert" className="flex items-start justify-center gap-2 text-sm text-destructive">
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}
        {confirmation && (
          <p role="status" className="text-center text-sm font-medium text-emerald-700 dark:text-emerald-300">
            {confirmation}
          </p>
        )}
      </form>
    </section>
  )
}