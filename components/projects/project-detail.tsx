"use client"

import { useEffect, useState, type FormEvent } from "react"
import Image from "next/image"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, Building2, CircleAlert, MessageSquare, Users } from "lucide-react"

import { useAuth } from "@/components/auth/auth-provider"
import { useLanguage } from "@/components/i18n/language-provider"
import { useFormGuard } from "@/components/forms/form-guard"
import { ProjectProgressBar } from "@/components/projects/project-progress-bar"
import { ProjectStatusBadge } from "@/components/projects/project-status-badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { AuthApiError } from "@/repository/auth.repository"
import {
  projectRepository,
  resolveProjectImageUrl,
  type Project,
  type ProjectComment,
} from "@/repository/project.repository"

const formatDate = (value: string) => new Date(value).toLocaleDateString("fr-FR", { dateStyle: "long" })

function authorInitials(author: { firstName: string; lastName: string } | null) {
  if (!author) return "?"
  return `${author.firstName[0] ?? ""}${author.lastName[0] ?? ""}`.toUpperCase() || "?"
}

function CommentForm({ projectId, onPosted }: { projectId: number; onPosted: (comment: ProjectComment) => void }) {
  const { t } = useLanguage()
  const [content, setContent] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState("")
  const guard = useFormGuard("comment")

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!content.trim()) {
      setError(t("projectDetail.commentRequired"))
      return
    }
    setError("")
    setIsSaving(true)
    try {
      const { comment, message } = await guard.run((headers) => projectRepository.createComment(projectId, content.trim(), headers))
      onPosted(comment)
      setContent("")
      toast.add({ title: message, type: "success" })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("projectDetail.commentError"))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {guard.trap}
      <Textarea
        aria-label={t("projectDetail.commentPlaceholder")}
        placeholder={t("projectDetail.commentPlaceholder")}
        rows={3}
        value={content}
        onChange={(event) => setContent(event.target.value)}
        maxLength={2000}
        disabled={isSaving}
      />
      {error && (
        <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
      <div className="flex justify-end">
        <Button type="submit" disabled={isSaving}>
          {isSaving && <Spinner />}
          {t("projectDetail.commentSubmit")}
        </Button>
      </div>
    </form>
  )
}

export function ProjectDetail() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const params = useSearchParams()
  const id = Number(params.get("id"))
  const isValidId = Number.isInteger(id) && id > 0

  const [project, setProject] = useState<Project | null>(null)
  const [comments, setComments] = useState<ProjectComment[] | null>(null)
  const [error, setError] = useState("")
  const [loadedId, setLoadedId] = useState<number | null>(null)

  const backLink = (
    <Link
      href="/dashboard/projects"
      className="inline-flex items-center gap-2 text-sm font-medium text-secondary-foreground transition-colors hover:text-primary"
    >
      <ArrowLeft className="size-4" aria-hidden="true" />
      {t("projectDetail.backLink")}
    </Link>
  )

  useEffect(() => {
    if (!isValidId) return
    let mounted = true

    Promise.all([projectRepository.get(id), projectRepository.listComments(id)])
      .then(([currentProject, currentComments]) => {
        if (!mounted) return
        setProject(currentProject)
        setComments(currentComments)
        setError("")
        setLoadedId(id)
      })
      .catch((cause) => {
        if (!mounted) return
        setError(
          cause instanceof AuthApiError && cause.status === 404
            ? t("projectDetail.notFound")
            : cause instanceof Error
              ? cause.message
              : t("projectDetail.loadError")
        )
        setLoadedId(id)
      })

    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-fetch uniquement sur changement d'id
  }, [id, isValidId])

  if (!isValidId || (loadedId === id && error)) {
    return (
      <div className="space-y-6">
        {backLink}
        <p role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {isValidId ? error : t("projectDetail.invalidId")}
        </p>
      </div>
    )
  }

  if (!project || loadedId !== id || !comments) {
    return (
      <div className="space-y-6">
        {backLink}
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
    )
  }

  const canComment = user?.permissions.includes("citizen.projects.comment") ?? false
  const imageSrc = resolveProjectImageUrl(project.imageUrl)

  return (
    <div className="space-y-8">
      {backLink}

      <header className="overflow-hidden rounded-2xl border border-border/80 bg-card/75 shadow-sm backdrop-blur-sm">
        <div className="relative aspect-[16/7] w-full bg-accent">
          {imageSrc ? (
            <Image src={imageSrc} alt="" fill className="object-cover" unoptimized />
          ) : (
            <div className="grid h-full place-items-center text-accent-foreground">
              <Building2 className="size-10" aria-hidden="true" />
            </div>
          )}
        </div>
        <div className="space-y-3 p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-primary">{t("projectDetail.eyebrow")}</p>
            <ProjectStatusBadge status={project.status} />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-4xl">{project.title}</h1>
          {project.author && (
            <p className="text-sm text-muted-foreground">
              {t("projectDetail.proposedBy", { name: `${project.author.firstName} ${project.author.lastName}`.trim() })}
            </p>
          )}
          {project.status === "ongoing" && project.progress !== null && (
            <div className="max-w-xs">
              <ProjectProgressBar progress={project.progress} />
            </div>
          )}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <section aria-labelledby="project-about" className="rounded-2xl border border-border/80 bg-card/70 p-6 shadow-sm backdrop-blur-sm">
          <h2 id="project-about" className="text-lg font-semibold">{t("projectDetail.aboutHeading")}</h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted-foreground">
            {project.description || t("projectDetail.noDescription")}
          </p>
        </section>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-border/80 bg-card/70 p-5 shadow-sm backdrop-blur-sm">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Users className="size-4 text-primary" aria-hidden="true" />
              {t("projectDetail.participantsHeading")}
            </h2>
            {project.participants.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">{t("projectDetail.noParticipants")}</p>
            ) : (
              <ul className="mt-3 flex flex-wrap gap-2">
                {project.participants.map((participant) => (
                  <li key={participant.id}>
                    <Badge variant="secondary">{`${participant.firstName} ${participant.lastName}`.trim()}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-border/80 bg-card/70 p-5 shadow-sm backdrop-blur-sm">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Building2 className="size-4 text-primary" aria-hidden="true" />
              {t("projectDetail.entitiesHeading")}
            </h2>
            {project.externalEntities.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">{t("projectDetail.noEntities")}</p>
            ) : (
              <ul className="mt-3 flex flex-wrap gap-2">
                {project.externalEntities.map((entity) => (
                  <li key={entity.id}>
                    <Badge variant="outline">{entity.type ? `${entity.name} · ${entity.type}` : entity.name}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>

      <section aria-labelledby="project-comments" className="rounded-2xl border border-border/80 bg-card/70 p-6 shadow-sm backdrop-blur-sm sm:p-8">
        <h2 id="project-comments" className="flex items-center gap-2 text-lg font-semibold">
          <MessageSquare className="size-4 text-primary" aria-hidden="true" />
          {t("projectDetail.commentsHeading", { count: comments.length })}
        </h2>

        {canComment && (
          <div className="mt-5">
            <CommentForm projectId={project.id} onPosted={(comment) => setComments((current) => [...(current ?? []), comment])} />
          </div>
        )}

        <ul className="mt-6 space-y-4">
          {comments.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("projectDetail.commentsEmpty")}</p>
          ) : (
            comments.map((comment) => (
              <li key={comment.id} className="flex gap-3">
                <Avatar className="size-9 shrink-0">
                  <AvatarFallback className="bg-accent text-xs font-semibold text-accent-foreground">
                    {authorInitials(comment.author)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 rounded-xl border border-border/70 bg-background/55 p-3.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="text-sm font-medium">
                      {comment.author ? `${comment.author.firstName} ${comment.author.lastName}`.trim() : t("projectDetail.anonymous")}
                    </p>
                    <time dateTime={comment.createdAt} className="text-xs text-muted-foreground">
                      {formatDate(comment.createdAt)}
                    </time>
                  </div>
                  <p className="mt-1.5 whitespace-pre-line text-sm leading-6 text-foreground">{comment.content}</p>
                </div>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  )
}
