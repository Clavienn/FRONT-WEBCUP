"use client"

import { useEffect, useState, useSyncExternalStore } from "react"
import { useRouter } from "next/navigation"
import { BookOpen, Building2, Clock3, FolderKanban, Landmark, LogOut, Megaphone } from "lucide-react"

import { useAuth } from "@/components/auth/auth-provider"
import { useLanguage } from "@/components/i18n/language-provider"
import { ServiceIcon } from "@/components/services/service-icon"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { getAnnouncements, type Announcement } from "@/lib/services/announcements"
import { getPublicServices, type PublicMunicipalService } from "@/lib/services/municipalServices"
import { getLatestProjects, type Project, type ProjectStatus } from "@/lib/services/projects"
import {
  endVisitorSession,
  getServerVisitorSessionSnapshot,
  getVisitorSessionSnapshot,
  subscribeToVisitorSession,
} from "@/lib/visitor-session"

type LoadState = "loading" | "ready" | "error"

const projectStatusKeys: Record<ProjectStatus, string> = {
  planned: "visitor.projectStatus.planned",
  ongoing: "visitor.projectStatus.ongoing",
  completed: "visitor.projectStatus.completed",
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`
}

export function VisitorDashboard() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const { locale, t } = useLanguage()
  const sessionSnapshot = useSyncExternalStore(
    subscribeToVisitorSession,
    getVisitorSessionSnapshot,
    getServerVisitorSessionSnapshot
  )
  const sessionReady = sessionSnapshot !== "server"
  const parsedExpiry = sessionReady && sessionSnapshot !== "missing" ? Number(sessionSnapshot) : null
  const hasSessionRecord = parsedExpiry !== null && Number.isFinite(parsedExpiry)
  const expiresAt = hasSessionRecord ? parsedExpiry : null
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null)
  const [services, setServices] = useState<PublicMunicipalService[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [servicesState, setServicesState] = useState<LoadState>("loading")
  const [announcementsState, setAnnouncementsState] = useState<LoadState>("loading")
  const [projectsState, setProjectsState] = useState<LoadState>("loading")

  useEffect(() => {
    if (!sessionReady || isLoading) return
    if (user) {
      router.replace("/dashboard")
      return
    }
    if (!hasSessionRecord || parsedExpiry === null || parsedExpiry <= Date.now()) {
      endVisitorSession()
      router.replace("/connexion")
    }
  }, [hasSessionRecord, isLoading, parsedExpiry, router, sessionReady, user])

  useEffect(() => {
    if (expiresAt === null) return

    const updateCountdown = () => {
      const seconds = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000))
      setRemainingSeconds(seconds)
      if (seconds === 0) {
        endVisitorSession()
        router.replace("/connexion")
      }
    }

    const initialUpdate = window.setTimeout(updateCountdown, 0)
    const interval = window.setInterval(updateCountdown, 1000)
    const expiryTimeout = window.setTimeout(() => {
      endVisitorSession()
      router.replace("/connexion")
    }, Math.max(0, expiresAt - Date.now()))

    return () => {
      window.clearTimeout(initialUpdate)
      window.clearInterval(interval)
      window.clearTimeout(expiryTimeout)
    }
  }, [expiresAt, router])

  useEffect(() => {
    if (!sessionReady || isLoading || user || !hasSessionRecord) return
    let mounted = true

    Promise.allSettled([getPublicServices(), getAnnouncements(1, 6), getLatestProjects()]).then(
      ([servicesResult, announcementsResult, projectsResult]) => {
        if (!mounted) return

        if (servicesResult.status === "fulfilled") {
          setServices(servicesResult.value)
          setServicesState("ready")
        } else {
          setServicesState("error")
        }

        if (announcementsResult.status === "fulfilled") {
          setAnnouncements(announcementsResult.value.announcements)
          setAnnouncementsState("ready")
        } else {
          setAnnouncementsState("error")
        }

        if (projectsResult.status === "fulfilled") {
          setProjects(projectsResult.value)
          setProjectsState("ready")
        } else {
          setProjectsState("error")
        }
      }
    )

    return () => {
      mounted = false
    }
  }, [hasSessionRecord, isLoading, sessionReady, user])

  const finishVisit = () => {
    endVisitorSession()
    router.replace("/connexion")
  }

  if (!sessionReady || isLoading || user || !hasSessionRecord || expiresAt === null || remainingSeconds === null) {
    return (
      <main className="grid min-h-screen place-items-center bg-background">
        <Spinner />
      </main>
    )
  }

  const formattedExpiry = new Intl.DateTimeFormat(locale, { timeStyle: "short" }).format(expiresAt)

  return (
    <main className="app-atmosphere min-h-screen px-4 py-6 text-foreground sm:px-8 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-col gap-5 border-b border-border/70 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <Building2 className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase text-primary">{t("visitor.eyebrow")}</p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{t("visitor.title")}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{t("visitor.description")}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:justify-end">
            <Badge variant="outline" className="gap-2 px-3 py-2 text-sm tabular-nums">
              <Clock3 className="size-4" aria-hidden="true" />
              <span role="timer" aria-label={t("visitor.timeRemaining", { time: formatTime(remainingSeconds) })}>
                {formatTime(remainingSeconds)}
              </span>
            </Badge>
            <Button variant="outline" onClick={finishVisit}>
              <LogOut aria-hidden="true" />
              {t("visitor.endVisit")}
            </Button>
          </div>
        </header>

        <p className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm leading-6 text-muted-foreground">
          {t("visitor.expiryNotice", { time: formattedExpiry })}
        </p>

        <nav aria-label={t("visitor.sectionsAriaLabel")} className="flex flex-wrap gap-2">
          <a className="rounded-full border border-border px-4 py-2 text-sm hover:border-primary/50" href="#visitor-services">{t("visitor.servicesTitle")}</a>
          <a className="rounded-full border border-border px-4 py-2 text-sm hover:border-primary/50" href="#visitor-announcements">{t("visitor.announcementsTitle")}</a>
          <a className="rounded-full border border-border px-4 py-2 text-sm hover:border-primary/50" href="#visitor-projects">{t("visitor.projectsTitle")}</a>
        </nav>

        <section id="visitor-services" aria-labelledby="visitor-services-title" className="scroll-mt-6 space-y-4">
          <div className="flex items-center gap-3">
            <Landmark className="size-5 text-primary" aria-hidden="true" />
            <h2 id="visitor-services-title" className="text-xl font-semibold">{t("visitor.servicesTitle")}</h2>
          </div>
          {servicesState === "loading" ? <SectionLoading /> : null}
          {servicesState === "error" ? <SectionMessage>{t("visitor.loadError")}</SectionMessage> : null}
          {servicesState === "ready" && services.length === 0 ? <SectionMessage>{t("visitor.servicesEmpty")}</SectionMessage> : null}
          {servicesState === "ready" && services.length > 0 && (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <li key={service.id} className="h-full rounded-xl border border-border/80 bg-card/75 p-5 shadow-sm">
                  <span className="grid size-10 place-items-center rounded-lg bg-accent text-accent-foreground">
                    <ServiceIcon name={service.icon} className="size-5" />
                  </span>
                  <h3 className="mt-4 font-semibold">{service.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{service.description || t("visitor.noDescription")}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section id="visitor-announcements" aria-labelledby="visitor-announcements-title" className="scroll-mt-6 space-y-4">
          <div className="flex items-center gap-3">
            <Megaphone className="size-5 text-primary" aria-hidden="true" />
            <h2 id="visitor-announcements-title" className="text-xl font-semibold">{t("visitor.announcementsTitle")}</h2>
          </div>
          {announcementsState === "loading" ? <SectionLoading /> : null}
          {announcementsState === "error" ? <SectionMessage>{t("visitor.loadError")}</SectionMessage> : null}
          {announcementsState === "ready" && announcements.length === 0 ? <SectionMessage>{t("visitor.announcementsEmpty")}</SectionMessage> : null}
          {announcementsState === "ready" && announcements.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              {announcements.map((announcement) => (
                <article key={announcement.id} className="rounded-xl border border-border/80 bg-card/75 p-5 shadow-sm">
                  <time className="text-xs font-medium text-primary" dateTime={announcement.date}>
                    {new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(new Date(announcement.date))}
                  </time>
                  <h3 className="mt-2 font-semibold">{announcement.title}</h3>
                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">{announcement.content}</p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section id="visitor-projects" aria-labelledby="visitor-projects-title" className="scroll-mt-6 space-y-4">
          <div className="flex items-center gap-3">
            <FolderKanban className="size-5 text-primary" aria-hidden="true" />
            <h2 id="visitor-projects-title" className="text-xl font-semibold">{t("visitor.projectsTitle")}</h2>
          </div>
          {projectsState === "loading" ? <SectionLoading /> : null}
          {projectsState === "error" ? <SectionMessage>{t("visitor.loadError")}</SectionMessage> : null}
          {projectsState === "ready" && projects.length === 0 ? <SectionMessage>{t("visitor.projectsEmpty")}</SectionMessage> : null}
          {projectsState === "ready" && projects.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <article key={project.id} className="rounded-xl border border-border/80 bg-card/75 p-5 shadow-sm">
                  <Badge variant="outline">{t(projectStatusKeys[project.status])}</Badge>
                  <h3 className="mt-3 font-semibold">{project.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{project.description || t("visitor.noDescription")}</p>
                  {project.progress !== null && (
                    <p className="mt-3 text-xs text-muted-foreground">{t("visitor.projectProgress", { progress: project.progress })}</p>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        <footer className="border-t border-border/70 pt-5 text-sm text-muted-foreground">
          <p className="flex items-start gap-2"><BookOpen className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{t("visitor.readOnlyNotice")}</p>
        </footer>
      </div>
    </main>
  )
}

function SectionLoading() {
  return <div className="h-28 animate-pulse rounded-xl border border-border/70 bg-card/60" aria-hidden="true" />
}

function SectionMessage({ children }: Readonly<{ children: string }>) {
  return <p className="rounded-lg border border-border/70 bg-card/60 px-4 py-3 text-sm text-muted-foreground">{children}</p>
}