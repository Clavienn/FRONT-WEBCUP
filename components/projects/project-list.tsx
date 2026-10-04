"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Building2, CircleAlert } from "lucide-react"

import { ProjectProgressBar } from "@/components/projects/project-progress-bar"
import { ProjectStatusBadge } from "@/components/projects/project-status-badge"
import { useLanguage } from "@/components/i18n/language-provider"
import { Skeleton } from "@/components/ui/skeleton"
import { projectRepository, resolveProjectImageUrl, type Project } from "@/repository/project.repository"

export function ProjectList() {
  const { t } = useLanguage()
  const [projects, setProjects] = useState<Project[] | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    let mounted = true
    projectRepository
      .list()
      .then((data) => mounted && setProjects(data))
      .catch((cause) => mounted && setError(cause instanceof Error ? cause.message : t("projectsList.loadError")))
    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement unique au montage ; t() n'a pas besoin de redéclencher le fetch
  }, [])

  return (
    <>
      <section>
        <p className="text-sm font-medium text-primary">{t("projectsList.eyebrow")}</p>
        <h1 className="mt-1 text-3xl font-medium tracking-tight sm:text-4xl">{t("projectsList.title")}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{t("projectsList.subtitle")}</p>
      </section>

      {error ? (
        <p role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : !projects ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-64 rounded-xl" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <p className="rounded-2xl border border-border/80 bg-card/70 p-8 text-center text-sm text-muted-foreground">
          {t("projectsList.noResults")}
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <li key={project.id}>
              <Link
                href={`/dashboard/projects/detail?id=${project.id}`}
                className="group block h-full overflow-hidden rounded-xl border border-border/80 bg-card/75 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <div className="relative aspect-[16/9] w-full bg-accent">
                  {project.imageUrl ? (
                    <Image
                      src={resolveProjectImageUrl(project.imageUrl)!}
                      alt=""
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="grid h-full place-items-center text-accent-foreground">
                      <Building2 className="size-8" aria-hidden="true" />
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-base font-semibold">{project.title}</h2>
                    <ProjectStatusBadge status={project.status} />
                  </div>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
                    {project.description || t("projectsList.noDescription")}
                  </p>
                  {project.status === "ongoing" && project.progress !== null && (
                    <div className="mt-3">
                      <ProjectProgressBar progress={project.progress} />
                    </div>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
