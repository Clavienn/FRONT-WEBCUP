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
        <header className="relative overflow-hidden rounded-2xl border border-border/80 bg-card/85 p-6 shadow-sm backdrop-blur-xl sm:p-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3 text-[11px] font-mono tracking-wider text-muted-foreground">
            <span className="flex items-center gap-2 font-medium text-cyan-500">
              <span className="size-2 rounded-full bg-cyan-400 animate-pulse" />
              TERMINAL OBSERVATEUR // SESSION VISITEUR
            </span>
            <span className="text-xs uppercase tracking-widest text-muted-foreground">
              TERRA NOVA CIVIC ARCHIVE
            </span>
          </div>

          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-xl border border-primary/30 bg-primary/10 text-primary shadow-[0_0_20px_rgba(47,111,219,0.15)]">
                <Building2 className="size-6" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">{t("visitor.eyebrow")}</p>
                <h1 className="font-display mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  {t("visitor.title")}
                </h1>
                <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">{t("visitor.description")}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 sm:justify-end">
              <div className="flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-950/20 px-3.5 py-2 text-sm font-mono font-medium text-cyan-400">
                <Clock3 className="size-4 animate-spin text-cyan-400" style={{ animationDuration: "12s" }} aria-hidden="true" />
                <span role="timer" aria-label={t("visitor.timeRemaining", { time: formatTime(remainingSeconds) })}>
                  {formatTime(remainingSeconds)}
                </span>
              </div>
              <Button variant="outline" onClick={finishVisit} className="hover:border-destructive hover:text-destructive">
                <LogOut aria-hidden="true" className="size-4" />
                {t("visitor.endVisit")}
              </Button>
            </div>
          </div>
        </header>

        <p className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm leading-6 text-muted-foreground">
          {t("visitor.expiryNotice", { time: formattedExpiry })}
        </p>

        <nav aria-label={t("visitor.sectionsAriaLabel")} className="flex flex-wrap gap-2.5">
          <a
            className="rounded-xl border border-border/80 bg-card/60 px-4 py-2 text-sm font-medium transition-all hover:border-primary hover:bg-card hover:text-primary"
            href="#visitor-services"
          >
            {t("visitor.servicesTitle")}
          </a>
          <a
            className="rounded-xl border border-border/80 bg-card/60 px-4 py-2 text-sm font-medium transition-all hover:border-primary hover:bg-card hover:text-primary"
            href="#visitor-announcements"
          >
            {t("visitor.announcementsTitle")}
          </a>
          <a
            className="rounded-xl border border-border/80 bg-card/60 px-4 py-2 text-sm font-medium transition-all hover:border-primary hover:bg-card hover:text-primary"
            href="#visitor-projects"
          >
            {t("visitor.projectsTitle")}
          </a>
        </nav>

        <section id="visitor-services" aria-labelledby="visitor-services-title" className="scroll-mt-6 space-y-4">
          <div className="flex items-center gap-3">
            <Landmark className="size-5 text-primary" aria-hidden="true" />
            <h2 id="visitor-services-title" className="font-display text-xl font-bold tracking-tight">
              {t("visitor.servicesTitle")}
            </h2>
          </div>
          {servicesState === "loading" ? <SectionLoading /> : null}
          {servicesState === "error" ? <SectionMessage>{t("visitor.loadError")}</SectionMessage> : null}
          {servicesState === "ready" && services.length === 0 ? <SectionMessage>{t("visitor.servicesEmpty")}</SectionMessage> : null}
          {servicesState === "ready" && services.length > 0 && (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <li
                  key={service.id}
                  className="group relative flex h-full flex-col justify-between rounded-xl border border-border/80 bg-card/80 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
                >
                  <div>
                    <span className="grid size-10 place-items-center rounded-lg border border-border/60 bg-muted/60 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                      <ServiceIcon name={service.icon} className="size-5" />
                    </span>
                    <h3 className="mt-4 font-semibold text-foreground group-hover:text-primary transition-colors">
                      {service.name}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{service.description || t("visitor.noDescription")}</p>
                  </div>
                  {service.code && (
                    <div className="mt-4 pt-3 border-t border-border/40">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                        {service.code}
                      </span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section id="visitor-announcements" aria-labelledby="visitor-announcements-title" className="scroll-mt-6 space-y-4">
          <div className="flex items-center gap-3">
            <Megaphone className="size-5 text-primary" aria-hidden="true" />
            <h2 id="visitor-announcements-title" className="font-display text-xl font-bold tracking-tight">
              {t("visitor.announcementsTitle")}
            </h2>
          </div>
          {announcementsState === "loading" ? <SectionLoading /> : null}
          {announcementsState === "error" ? <SectionMessage>{t("visitor.loadError")}</SectionMessage> : null}
          {announcementsState === "ready" && announcements.length === 0 ? <SectionMessage>{t("visitor.announcementsEmpty")}</SectionMessage> : null}
          {announcementsState === "ready" && announcements.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              {announcements.map((announcement) => (
                <article
                  key={announcement.id}
                  className="rounded-xl border border-border/80 bg-card/80 p-5 shadow-sm transition-all hover:border-primary/40"
                >
                  <div className="flex items-center justify-between gap-2">
                    <time className="font-mono text-xs font-semibold text-primary" dateTime={announcement.date}>
                      {new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(new Date(announcement.date))}
                    </time>
                    <span className="rounded-md bg-muted/60 px-2 py-0.5 text-[10px] font-mono uppercase text-muted-foreground">
                      COMMUNIQUÉ
                    </span>
                  </div>
                  <h3 className="mt-2.5 font-semibold text-foreground">{announcement.title}</h3>
                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">{announcement.content}</p>
                </article>
              ))}
            </div>
          )}
        </section>

        <section id="visitor-projects" aria-labelledby="visitor-projects-title" className="scroll-mt-6 space-y-4">
          <div className="flex items-center gap-3">
            <FolderKanban className="size-5 text-primary" aria-hidden="true" />
            <h2 id="visitor-projects-title" className="font-display text-xl font-bold tracking-tight">
              {t("visitor.projectsTitle")}
            </h2>
          </div>
          {projectsState === "loading" ? <SectionLoading /> : null}
          {projectsState === "error" ? <SectionMessage>{t("visitor.loadError")}</SectionMessage> : null}
          {projectsState === "ready" && projects.length === 0 ? <SectionMessage>{t("visitor.projectsEmpty")}</SectionMessage> : null}
          {projectsState === "ready" && projects.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <article
                  key={project.id}
                  className="flex flex-col justify-between rounded-xl border border-border/80 bg-card/80 p-5 shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
                >
                  <div>
                    <Badge variant="outline" className="font-mono text-[11px]">
                      {t(projectStatusKeys[project.status])}
                    </Badge>
                    <h3 className="mt-3 font-semibold text-foreground">{project.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{project.description || t("visitor.noDescription")}</p>
                  </div>
                  {project.progress !== null && (
                    <div className="mt-4 space-y-1.5 pt-3 border-t border-border/40">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Progression</span>
                        <span className="font-mono font-medium text-foreground">{project.progress}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary to-cyan-400 transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(0, project.progress))}%` }}
                        />
                      </div>
                    </div>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>

        <footer className="rounded-xl border border-border/70 bg-card/50 p-4 text-sm text-muted-foreground">
          <p className="flex items-start gap-2">
            <BookOpen className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            {t("visitor.readOnlyNotice")}
          </p>
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