"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"

import { getLatestProjects, resolveProjectImageUrl, type Project } from "@/lib/services/projects"
import { useLanguage } from "@/components/i18n/language-provider"
import { useLiteMode } from "@/components/lite-mode/lite-mode-provider"
import { Reveal } from "@/components/landing/reveal"

type Status = "loading" | "error" | "empty" | "success"

const STATUS_LABEL_KEY: Record<Project["status"], string> = {
  planned: "projectsSection.status.planned",
  ongoing: "projectsSection.status.ongoing",
  completed: "projectsSection.status.completed",
}

// Pas de citoyen connecté ici : la carte renvoie vers l'espace connecté, qui demandera
// une connexion si besoin avant d'afficher le projet et ses commentaires.
function ProjectCard({ project }: { project: Project }) {
  const { t } = useLanguage()
  const { liteMode } = useLiteMode()
  const imageSrc = resolveProjectImageUrl(project.imageUrl)

  return (
    <li className="h-full overflow-hidden rounded-[var(--tn-radius-lg)] border border-[var(--tn-border)] bg-[var(--tn-surface)] transition-[border-color,background-color,transform] duration-250 [transition-timing-function:var(--tn-ease)] hover:-translate-y-1 hover:border-[var(--tn-border-strong)] hover:bg-[var(--tn-surface-strong)]">
      <Link href={`/dashboard/projects/detail?id=${project.id}`} className="block h-full">
        {!liteMode && (
          <div className="relative aspect-[16/9] w-full bg-[var(--tn-surface-strong)]">
            {imageSrc && <Image src={imageSrc} alt="" fill className="object-cover" unoptimized />}
          </div>
        )}
        <div className="p-6">
          <span className="text-xs font-medium tracking-widest text-[var(--tn-accent)] uppercase">
            {t(STATUS_LABEL_KEY[project.status])}
          </span>
          <h3 className="mt-3 text-base font-semibold text-[var(--tn-text)]">{project.title}</h3>
          {project.description && (
            <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-[var(--tn-text-muted)]">{project.description}</p>
          )}
          <span className="mt-4 inline-block text-sm font-medium text-[var(--tn-accent)]">
            {t("projectsSection.seeProject")}
          </span>
        </div>
      </Link>
    </li>
  )
}

export function ProjectsSection() {
  const { t } = useLanguage()
  const [status, setStatus] = useState<Status>("loading")
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    let cancelled = false

    getLatestProjects()
      .then((data) => {
        if (cancelled) return
        setProjects(data)
        setStatus(data.length === 0 ? "empty" : "success")
      })
      .catch(() => {
        if (!cancelled) setStatus("error")
      })

    return () => {
      cancelled = true
    }
  }, [])

  // Rien à montrer : la section ne s'affiche pas plutôt que d'afficher un bloc vide
  if (status === "empty") return null

  return (
    <section id="projets" className="tn-section" aria-labelledby="projets-title">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <Reveal>
          <h2 id="projets-title" className="tn-section-title tn-display max-w-2xl">
            {t("projectsSection.title")}
          </h2>
        </Reveal>

        <div className="mt-10" aria-live="polite">
          {status === "loading" && (
            <ul className="grid gap-4 sm:grid-cols-3">
              {[0, 1, 2].map((index) => (
                <li key={index} className="tn-skeleton h-72" aria-hidden="true" />
              ))}
            </ul>
          )}

          {status === "error" && (
            <p className="tn-card max-w-md text-sm text-[var(--tn-text-muted)]" role="alert">
              {t("projectsSection.error")}
            </p>
          )}

          {status === "success" && (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {projects.map((project, index) => (
                <Reveal key={project.id} delay={index * 60}>
                  <ProjectCard project={project} />
                </Reveal>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
