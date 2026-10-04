"use client"

import { useState, type FormEvent } from "react"
import { CircleAlert } from "lucide-react"

import { useAuth } from "@/components/auth/auth-provider"
import { useLanguage } from "@/components/i18n/language-provider"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import {
  announcementRepository,
  statusLabels,
  type Announcement,
  type AnnouncementPriority,
  type AnnouncementStatus,
} from "@/repository/announcement.repository"

// Priorités proposées dans l'ordre : la plus basse d'abord, pour que "par défaut" reste le choix évident
const PRIORITIES: AnnouncementPriority[] = ["default", "medium", "max"]

// Formulaire monté à chaque ouverture du dialogue : son état repart donc toujours de zéro
function AnnouncementForm({
  announcement,
  onClose,
  onSaved,
}: {
  announcement: Announcement | null
  onClose: () => void
  onSaved: (announcement: Announcement, created: boolean) => void
}) {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [title, setTitle] = useState(announcement?.title ?? "")
  const [content, setContent] = useState(announcement?.content ?? "")
  const [status, setStatus] = useState<AnnouncementStatus>(announcement?.status ?? "draft")
  const [priority, setPriority] = useState<AnnouncementPriority>(announcement?.priority ?? "default")
  const [error, setError] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const isEditing = announcement !== null

  // Le Haut Conseil seul peut publier en priorité max : le serveur le refuse, on ne propose donc
  // pas l'option à un agent pour éviter un envoi qui échouerait.
  const canPublishUrgent = user?.permissions.includes("admin.announcements.urgent") ?? false
  const availablePriorities = canPublishUrgent ? PRIORITIES : PRIORITIES.filter((value) => value !== "max")

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setIsSaving(true)

    const data = { title: title.trim(), content: content.trim(), status, priority }
    try {
      const saved = isEditing
        ? await announcementRepository.update(announcement.id, data)
        : await announcementRepository.create(data)
      onSaved(saved, !isEditing)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Une erreur est survenue")
      setIsSaving(false)
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEditing ? "Modifier l’annonce" : "Nouvelle annonce"}</DialogTitle>
        <DialogDescription>
          Annonce municipale, information pratique ou changement de service. Seules les annonces publiées sont visibles des habitants.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="announcement-title">Titre</Label>
          <Input
            id="announcement-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            maxLength={255}
            placeholder="Ex. Coupure d’eau dans le secteur B"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="announcement-content">Contenu</Label>
          <Textarea
            id="announcement-content"
            rows={7}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            required
            maxLength={65000}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="announcement-status">Statut</Label>
          <NativeSelect
            id="announcement-status"
            className="w-full"
            value={status}
            onChange={(event) => setStatus(event.target.value as AnnouncementStatus)}
          >
            {(Object.keys(statusLabels) as AnnouncementStatus[]).map((value) => (
              <NativeSelectOption key={value} value={value}>
                {statusLabels[value]}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </div>

        <div className="space-y-2">
          <Label htmlFor="announcement-priority">{t("announcementPriorities.label")}</Label>
          <NativeSelect
            id="announcement-priority"
            className="w-full"
            value={priority}
            onChange={(event) => setPriority(event.target.value as AnnouncementPriority)}
          >
            {availablePriorities.map((value) => (
              <NativeSelectOption key={value} value={value}>
                {t(`announcementPriorities.${value}`)}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <p className="text-xs text-muted-foreground">{t(`announcementPriorities.hint.${priority}`)}</p>
        </div>

        {error && (
          <p role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </p>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Annuler
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving && <Spinner />}
            {isEditing ? "Enregistrer" : "Créer l’annonce"}
          </Button>
        </DialogFooter>
      </form>
    </>
  )
}

export function AnnouncementFormDialog({
  open,
  announcement,
  onClose,
  onSaved,
}: {
  open: boolean
  announcement: Announcement | null
  onClose: () => void
  onSaved: (announcement: Announcement, created: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <AnnouncementForm announcement={announcement} onClose={onClose} onSaved={onSaved} />
      </DialogContent>
    </Dialog>
  )
}
