"use client"

import { useEffect, useState } from "react"

import { getAnnouncements, type Announcement } from "@/lib/services/announcements"
import { ANNOUNCEMENTS_CONTENT } from "@/config/landing-content"
import { Reveal } from "@/components/landing/reveal"

type Status = "loading" | "error" | "empty" | "success"

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
})

export function AnnouncementsSection() {
  const [status, setStatus] = useState<Status>("loading")
  const [announcements, setAnnouncements] = useState<Announcement[]>([])

  useEffect(() => {
    let cancelled = false

    getAnnouncements()
      .then((data) => {
        if (cancelled) return
        setAnnouncements(data)
        setStatus(data.length === 0 ? "empty" : "success")
      })
      .catch(() => {
        if (!cancelled) setStatus("error")
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section id="actualites" className="tn-section" aria-labelledby="actualites-title">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <Reveal>
          <h2 id="actualites-title" className="tn-section-title tn-display max-w-2xl">
            {ANNOUNCEMENTS_CONTENT.title}
          </h2>
        </Reveal>

        <div className="mt-10" aria-live="polite">
          {status === "loading" && (
            <ul className="grid gap-4 sm:grid-cols-3">
              {[0, 1, 2].map((index) => (
                <li key={index} className="tn-skeleton h-36" aria-hidden="true" />
              ))}
            </ul>
          )}

          {status === "error" && (
            <p className="tn-card max-w-md text-sm text-[var(--tn-text-muted)]" role="alert">
              {ANNOUNCEMENTS_CONTENT.errorMessage}
            </p>
          )}

          {status === "empty" && (
            <p className="tn-card max-w-md text-sm text-[var(--tn-text-muted)]">
              {ANNOUNCEMENTS_CONTENT.emptyMessage}
            </p>
          )}

          {status === "success" && (
            <ul className="grid gap-4 sm:grid-cols-3">
              {announcements.map((announcement, index) => (
                <Reveal key={announcement.id} delay={index * 100}>
                  <li className="tn-card h-full">
                    <time
                      dateTime={announcement.date}
                      className="text-xs font-medium tracking-widest text-[var(--tn-accent)] uppercase"
                    >
                      {dateFormatter.format(new Date(announcement.date))}
                    </time>
                    <h3 className="mt-3 text-base font-semibold text-[var(--tn-text)]">
                      {announcement.title}
                    </h3>
                    <p className="mt-3 text-sm leading-relaxed text-[var(--tn-text-muted)]">
                      {announcement.summary}
                    </p>
                  </li>
                </Reveal>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
