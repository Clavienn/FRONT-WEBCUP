"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, CircleAlert, Pencil, Trash2 } from "lucide-react"

import { useAuth } from "@/components/auth/auth-provider"
import { useLanguage } from "@/components/i18n/language-provider"
import {
  canEditAnnouncement,
  formatPublicationDate,
} from "@/components/announcements/announcement-permissions"
import { AnnouncementFormDialog } from "@/components/announcements/announcement-form-dialog"
import { AnnouncementPriorityBadge } from "@/components/announcements/announcement-priority-badge"
import { StatusBadge } from "@/components/announcements/status-badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/toast"
import { AuthApiError } from "@/repository/auth.repository"
import { announcementRepository, type Announcement } from "@/repository/announcement.repository"

function BackLink() {
  const { t } = useLanguage()
  return (
    <Link
      href="/dashboard/announcements"
      className="inline-flex items-center gap-2 text-sm font-medium text-secondary-foreground transition-colors hover:text-primary"
    >
      <ArrowLeft className="size-4" aria-hidden="true" />
      {t("announcementHub.backLink")}
    </Link>
  )
}

export function AnnouncementDetail() {
  const router = useRouter()
  const { t, locale } = useLanguage()
  const { user } = useAuth()
  const params = useSearchParams()
  const id = Number(params.get("id"))
  const isValidId = Number.isInteger(id) && id > 0
  const canEdit = !!user && canEditAnnouncement(user)

  const [announcement, setAnnouncement] = useState<Announcement | null>(null)
  const [error, setError] = useState("")
  // Id dont la réponse a été reçue : évite d'afficher l'ancienne annonce pendant un changement d'id
  const [loadedId, setLoadedId] = useState<number | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (!isValidId) return
    let mounted = true

    announcementRepository
      .get(id)
      .then((data) => {
        if (!mounted) return
        setAnnouncement(data)
        setError("")
        setLoadedId(id)
      })
      .catch((cause) => {
        if (!mounted) return
        setError(
          cause instanceof AuthApiError && cause.status === 404
            ? t("announcementHub.notFound")
            : cause instanceof Error
              ? cause.message
              : t("announcementHub.loadFailed")
        )
        setLoadedId(id)
      })

    return () => {
      mounted = false
    }
  }, [id, isValidId, t])

  const handleDelete = async () => {
    setIsDeleting(false)
    try {
      await announcementRepository.remove(id)
      toast.add({ title: t("announcementHub.deleted"), type: "success" })
      router.replace("/dashboard/announcements")
    } catch (cause) {
      toast.add({
        title: t("announcementHub.errorTitle"),
        description: cause instanceof Error ? cause.message : t("announcementHub.removeFailed"),
        type: "error",
      })
    }
  }

  if (!isValidId || (loadedId === id && error)) {
    return (
      <div className="space-y-6">
        <BackLink />
        <p role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {isValidId ? error : t("announcementHub.invalidId")}
        </p>
      </div>
    )
  }

  if (!announcement || loadedId !== id) {
    return (
      <div className="space-y-6">
        <BackLink />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    )
  }

  const author = announcement.author
    ? `${announcement.author.firstName} ${announcement.author.lastName}`.trim()
    : null

  return (
    <div className="space-y-6">
      <BackLink />

      <article className="rounded-2xl border border-border/80 bg-card/75 p-6 shadow-sm backdrop-blur-sm sm:p-8">
        <header className="space-y-3 border-b border-border/70 pb-5">
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>
              {t("announcementHub.publishedOn", {
                date: formatPublicationDate(announcement.publishedAt, announcement.createdAt, locale),
              })}
            </span>
            {author && <span>· {author}</span>}
            <AnnouncementPriorityBadge priority={announcement.priority} />
            {announcement.status !== "published" && <StatusBadge status={announcement.status} />}
          </div>
          <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">{announcement.title}</h1>
          {canEdit && (
            <div className="flex flex-wrap gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                <Pencil />
                {t("announcementHub.edit")}
              </Button>
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => setIsDeleting(true)}>
                <Trash2 />
                {t("announcementHub.remove")}
              </Button>
            </div>
          )}
        </header>
        <div className="mt-5 whitespace-pre-line text-sm leading-7 text-foreground/90">{announcement.content}</div>
      </article>

      <AnnouncementFormDialog
        open={isEditing}
        announcement={announcement}
        onClose={() => setIsEditing(false)}
        onSaved={(saved) => {
          setAnnouncement(saved)
          setIsEditing(false)
          toast.add({ title: t("announcementHub.updated"), type: "success" })
        }}
      />

      <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("announcementHub.removeTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("announcementHub.deleteDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("announcementHub.cancel")}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete}>
              {t("announcementHub.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
