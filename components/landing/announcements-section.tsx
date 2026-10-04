"use client"

import { useEffect, useMemo, useState } from "react"
import { Siren, TriangleAlert } from "lucide-react"

import { getAnnouncements, type Announcement, type AnnouncementPriority } from "@/lib/services/announcements"
import { useLanguage } from "@/components/i18n/language-provider"
import { Reveal } from "@/components/landing/reveal"

type Status = "loading" | "error" | "empty" | "success"

const PAGE_SIZE = 9
// Au-delà, le texte est replié avec un bouton « Lire la suite »
const PREVIEW_LENGTH = 180

// La page publique n'a pas de jeton d'alerte dans sa palette et le thème sombre y est imposé :
// ces tons sont donc explicites, pour rester lisibles sur le fond quasi noir de la page.
const PRIORITY_TONES: Record<Exclude<AnnouncementPriority, "default">, string> = {
  medium: "border-amber-400/40 bg-amber-400/10 text-amber-200",
  max: "border-red-400/50 bg-red-500/15 text-red-200",
}

function AnnouncementCard({ announcement }: { announcement: Announcement }) {
  const { t, locale } = useLanguage()
  const [expanded, setExpanded] = useState(false)
  const isLong = announcement.content.length > PREVIEW_LENGTH
  const text = expanded || !isLong ? announcement.content : `${announcement.content.slice(0, PREVIEW_LENGTH).trimEnd()}…`

  // La date suit la locale du lecteur : « 3 mai 2026 » en français, « 3 May 2026 » en anglais.
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    [locale]
  )

  const PriorityIcon = announcement.priority === "max" ? Siren : TriangleAlert

  return (
    <li className="tn-card h-full">
      <div className="flex flex-wrap items-center gap-2">
        <time
          dateTime={announcement.date}
          className="text-xs font-medium tracking-widest text-[var(--tn-accent)] uppercase"
        >
          {dateFormatter.format(new Date(announcement.date))}
        </time>
        {/* "default" n'affiche rien : sur la page d'accueil, une pastille sur chaque communiqué
            noierait la section pour une information qui n'a rien d'urgent. */}
        {announcement.priority !== "default" && (
          <span
            className={`inline-flex items-center gap-1 rounded-[var(--tn-radius-full)] border px-2 py-0.5 text-[0.6875rem] font-medium ${PRIORITY_TONES[announcement.priority]}`}
          >
            <PriorityIcon className="size-3" aria-hidden="true" />
            {t(`announcementPriorities.${announcement.priority}`)}
          </span>
        )}
      </div>
      <h3 className="mt-3 text-base font-semibold text-[var(--tn-text)]">{announcement.title}</h3>
      <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-[var(--tn-text-muted)]">{text}</p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          className="mt-3 cursor-pointer text-sm font-medium text-[var(--tn-accent)] underline-offset-4 hover:underline"
        >
          {expanded ? t("announcements.readLess") : t("announcements.readMore")}
        </button>
      )}
    </li>
  )
}

export function AnnouncementsSection() {
  const { t } = useLanguage()
  const [status, setStatus] = useState<Status>("loading")
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [moreFailed, setMoreFailed] = useState(false)

  useEffect(() => {
    let cancelled = false

    getAnnouncements(1, PAGE_SIZE)
      .then((data) => {
        if (cancelled) return
        setAnnouncements(data.announcements)
        setTotal(data.total)
        setStatus(data.announcements.length === 0 ? "empty" : "success")
      })
      .catch(() => {
        if (!cancelled) setStatus("error")
      })

    return () => {
      cancelled = true
    }
  }, [])

  const loadMore = async () => {
    setIsLoadingMore(true)
    setMoreFailed(false)
    try {
      const data = await getAnnouncements(page + 1, PAGE_SIZE)
      setAnnouncements((current) => [...current, ...data.announcements])
      setTotal(data.total)
      setPage(page + 1)
    } catch {
      setMoreFailed(true)
    } finally {
      setIsLoadingMore(false)
    }
  }

  return (
    <section id="annonces" className="tn-section" aria-labelledby="annonces-title">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <Reveal>
          <h2 id="annonces-title" className="tn-section-title tn-display max-w-2xl">
            {t("announcements.title")}
          </h2>
        </Reveal>

        <div className="mt-10" aria-live="polite">
          {status === "loading" && (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((index) => (
                <li key={index} className="tn-skeleton h-36" aria-hidden="true" />
              ))}
            </ul>
          )}

          {status === "error" && (
            <p className="tn-card max-w-md text-sm text-[var(--tn-text-muted)]" role="alert">
              {t("announcements.error")}
            </p>
          )}

          {status === "empty" && (
            <p className="tn-card max-w-md text-sm text-[var(--tn-text-muted)]">
              {t("announcements.empty")}
            </p>
          )}

          {status === "success" && (
            <>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {announcements.map((announcement, index) => (
                  <Reveal key={announcement.id} delay={(index % PAGE_SIZE) * 60}>
                    <AnnouncementCard announcement={announcement} />
                  </Reveal>
                ))}
              </ul>

              {announcements.length < total && (
                <div className="mt-8 flex flex-col items-center gap-3">
                  <button
                    type="button"
                    onClick={loadMore}
                    disabled={isLoadingMore}
                    className="cursor-pointer rounded-[var(--tn-radius-sm)] border border-[var(--tn-border)] px-5 py-2.5 text-sm font-medium text-[var(--tn-text)] transition-colors hover:border-[var(--tn-border-strong)] disabled:cursor-wait disabled:opacity-60"
                  >
                    {isLoadingMore ? t("announcements.loading") : t("announcements.seeMore")}
                  </button>
                  {moreFailed && (
                    <p role="alert" className="text-sm text-[var(--tn-text-muted)]">
                      {t("announcements.loadMoreError")}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </section>
  )
}
