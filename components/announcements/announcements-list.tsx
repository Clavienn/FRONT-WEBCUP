"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, CircleAlert, Pencil, Plus, Search, Trash2 } from "lucide-react"

import { useAuth } from "@/components/auth/auth-provider"
import {
  canCreateAnnouncement,
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
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/toast"
import {
  announcementRepository,
  statusLabels,
  type Announcement,
  type AnnouncementPage,
  type AnnouncementQuery,
} from "@/repository/announcement.repository"

const PAGE_SIZE = 9

const errorMessage = (cause: unknown) => (cause instanceof Error ? cause.message : "Une erreur est survenue")

type StatusFilter = NonNullable<AnnouncementQuery["status"]>

interface Result {
  key: string
  data?: AnnouncementPage
  error?: string
}

export function AnnouncementsList() {
  const { user } = useAuth()
  const canCreate = !!user && canCreateAnnouncement(user)
  const canEdit = !!user && canEditAnnouncement(user)
  // Les gestionnaires voient aussi brouillons et archives ; les citoyens uniquement les annonces publiées
  const isManager = canCreate

  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [status, setStatus] = useState<StatusFilter>(isManager ? "all" : "published")
  const [page, setPage] = useState(1)
  const [reloadKey, setReloadKey] = useState(0)
  const [result, setResult] = useState<Result | null>(null)

  // undefined = dialogue fermé ; null = création ; annonce = modification
  const [editing, setEditing] = useState<Announcement | null | undefined>(undefined)
  const [deleting, setDeleting] = useState<Announcement | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const key = `${debouncedSearch}|${status}|${page}|${reloadKey}`
  const isLoading = result?.key !== key

  useEffect(() => {
    let mounted = true
    announcementRepository
      .list({ q: debouncedSearch || undefined, status, page, limit: PAGE_SIZE })
      .then((data) => mounted && setResult({ key, data }))
      .catch((cause) => mounted && setResult({ key, error: errorMessage(cause) }))
    return () => {
      mounted = false
    }
  }, [key, debouncedSearch, status, page])

  const reload = () => setReloadKey((current) => current + 1)

  const confirmDelete = async () => {
    if (!deleting) return
    const target = deleting
    setDeleting(null)
    try {
      await announcementRepository.remove(target.id)
      toast.add({ title: "Annonce supprimée", type: "success" })
      reload()
    } catch (cause) {
      toast.add({ title: "Erreur", description: errorMessage(cause), type: "error" })
    }
  }

  const data = result?.key === key ? result.data : undefined
  const error = result?.key === key ? result.error : undefined
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1

  return (
    <>
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Haut Conseil de Terra Nova</p>
          <h1 className="mt-1 text-3xl font-medium tracking-tight sm:text-4xl">Annonces</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Annonces municipales, informations pratiques et changements de service publiés par la ville.
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setEditing(null)} className="w-fit rounded-xl">
            <Plus aria-hidden="true" />
            Nouvelle annonce
          </Button>
        )}
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            type="search"
            aria-label="Rechercher une annonce"
            placeholder="Rechercher une annonce"
            className="pl-9"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        {isManager && (
          <NativeSelect
            aria-label="Filtrer par statut"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as StatusFilter)
              setPage(1)
            }}
          >
            <NativeSelectOption value="all">Tous les statuts</NativeSelectOption>
            {(Object.keys(statusLabels) as (keyof typeof statusLabels)[]).map((value) => (
              <NativeSelectOption key={value} value={value}>
                {statusLabels[value]}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        )}
      </div>

      {error ? (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
          <span className="flex items-start gap-2">
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {error}
          </span>
          <Button variant="outline" size="sm" onClick={reload}>Réessayer</Button>
        </div>
      ) : isLoading || !data ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : data.announcements.length === 0 ? (
        <p className="rounded-2xl border border-border/80 bg-card/70 p-8 text-center text-sm text-muted-foreground">
          {debouncedSearch ? "Aucune annonce ne correspond à votre recherche." : "Aucune annonce pour le moment."}
        </p>
      ) : (
        <>
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.announcements.map((announcement) => (
              <li key={announcement.id}>
                <article className="group relative flex h-full cursor-pointer flex-col rounded-xl border border-border/80 bg-card/75 p-5 shadow-sm backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">
                      {formatPublicationDate(announcement.publishedAt, announcement.createdAt)}
                    </p>
                    <div className="flex items-center gap-2">
                      <AnnouncementPriorityBadge priority={announcement.priority} />
                      {isManager && <StatusBadge status={announcement.status} />}
                    </div>
                  </div>
                  <h2 className="mt-3 text-base font-semibold leading-snug">
                    {/* Le lien couvre toute la carte (after:inset-0) ; les boutons admin restent au-dessus */}
                    <Link
                      href={`/dashboard/announcements/detail?id=${announcement.id}`}
                      className="cursor-pointer after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-primary"
                    >
                      {announcement.title}
                    </Link>
                  </h2>
                  <p className="mt-2 line-clamp-3 flex-1 whitespace-pre-line text-sm leading-6 text-muted-foreground">
                    {announcement.content}
                  </p>
                  <div className="mt-4 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                      Lire l’annonce
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                    </span>
                    {canEdit && (
                      <div className="relative z-10 flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setEditing(announcement)}
                          aria-label={`Modifier ${announcement.title}`}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setDeleting(announcement)}
                          aria-label={`Supprimer ${announcement.title}`}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    )}
                  </div>
                </article>
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <nav aria-label="Pagination" className="flex items-center justify-center gap-3">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Précédent
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} sur {totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                Suivant
              </Button>
            </nav>
          )}
        </>
      )}

      <AnnouncementFormDialog
        open={editing !== undefined}
        announcement={editing ?? null}
        onClose={() => setEditing(undefined)}
        onSaved={(_saved, created) => {
          setEditing(undefined)
          toast.add({ title: created ? "Annonce créée" : "Annonce modifiée", type: "success" })
          reload()
        }}
      />

      <AlertDialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer « {deleting?.title} » ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est définitive. Pour la retirer de la vue publique en gardant l’historique, passez-la en « Archivée ».
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
