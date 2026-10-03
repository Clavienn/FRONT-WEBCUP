"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, CircleAlert, Eye, Inbox, MailOpen, RefreshCw, Search } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import {
  contactMessageRepository,
  contactStatusLabels,
  type ContactInbox,
  type ContactMessage,
  type ContactStatus,
} from "@/repository/contactMessage.repository"

const PAGE_SIZE = 10

const formatDate = (value: string) =>
  new Date(value).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })

const errorMessage = (cause: unknown) => (cause instanceof Error ? cause.message : "Une erreur est survenue")

const statusTones: Record<ContactStatus, string> = {
  new: "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200",
  read: "border-sky-500/30 bg-sky-500/10 text-sky-800 dark:text-sky-200",
  processed: "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
}

const filters: { value: ContactStatus | "all"; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "new", label: "Nouveaux" },
  { value: "read", label: "Lus" },
  { value: "processed", label: "Traités" },
]

// Actions proposées selon le statut courant (tous les passages sont permis par l'API)
const actions: Record<ContactStatus, { status: ContactStatus; label: string; icon: typeof Eye }[]> = {
  new: [
    { status: "read", label: "Marquer comme lu", icon: Eye },
    { status: "processed", label: "Marquer comme traité", icon: CheckCircle2 },
  ],
  read: [
    { status: "processed", label: "Marquer comme traité", icon: CheckCircle2 },
    { status: "new", label: "Remettre en nouveau", icon: MailOpen },
  ],
  processed: [{ status: "new", label: "Rouvrir", icon: MailOpen }],
}

interface Result {
  key: string
  data?: ContactInbox
  error?: string
}

function MessageCard({
  message,
  busy,
  onSetStatus,
}: {
  message: ContactMessage
  busy: boolean
  onSetStatus: (message: ContactMessage, status: ContactStatus) => void
}) {
  const sender = message.sender
  const senderName = sender ? `${sender.firstName} ${sender.lastName}`.trim() : "Compte supprimé"

  return (
    <article className="rounded-xl border border-border/80 bg-card/75 p-5 shadow-sm backdrop-blur-sm">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate font-semibold">{message.subject}</h2>
          <p className="mt-1 truncate text-sm text-muted-foreground">
            {senderName}
            {sender && ` · ${sender.email}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={statusTones[message.status]}>
            {contactStatusLabels[message.status]}
          </Badge>
          <time className="text-xs text-muted-foreground">{formatDate(message.sentAt)}</time>
        </div>
      </header>

      <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-foreground">{message.message}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/70 pt-4">
        <span className="mr-auto text-xs text-muted-foreground">Référence #{message.id}</span>
        {actions[message.status].map(({ status, label, icon: Icon }) => (
          <Button key={status} size="sm" variant="outline" disabled={busy} onClick={() => onSetStatus(message, status)}>
            {busy ? <Spinner /> : <Icon aria-hidden="true" />}
            {label}
          </Button>
        ))}
      </div>
    </article>
  )
}

export function AdminSupportInbox() {
  const [status, setStatus] = useState<ContactStatus | "all">("all")
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [page, setPage] = useState(1)
  const [reloadKey, setReloadKey] = useState(0)
  const [result, setResult] = useState<Result | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const key = `${status}|${debouncedSearch}|${page}|${reloadKey}`
  const current = result?.key === key ? result : null

  useEffect(() => {
    let mounted = true
    contactMessageRepository
      .listInbox({ status, q: debouncedSearch || undefined, page, limit: PAGE_SIZE })
      .then((data) => mounted && setResult({ key, data }))
      .catch((cause) => mounted && setResult({ key, error: errorMessage(cause) }))
    return () => {
      mounted = false
    }
  }, [key, status, debouncedSearch, page])

  const reload = () => setReloadKey((value) => value + 1)

  const handleSetStatus = async (message: ContactMessage, next: ContactStatus) => {
    setBusyId(message.id)
    try {
      await contactMessageRepository.setStatus(message.id, next)
      reload()
    } catch (cause) {
      toast.add({ title: "Erreur", description: errorMessage(cause), type: "error" })
    } finally {
      setBusyId(null)
    }
  }

  const data = current?.data
  const counts = data?.counts
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">Administration</p>
          <h1 className="mt-1 text-3xl font-medium tracking-tight sm:text-4xl">Messages des habitants</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Consultez les messages envoyés aux services municipaux et suivez leur traitement.
          </p>
        </div>
        <Button variant="outline" onClick={reload} disabled={!current}>
          {current ? <RefreshCw aria-hidden="true" /> : <Spinner />}
          Actualiser
        </Button>
      </section>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div role="group" aria-label="Filtrer par statut" className="flex flex-wrap gap-2">
          {filters.map(({ value, label }) => {
            const count = counts ? (value === "all" ? counts.new + counts.read + counts.processed : counts[value]) : null
            return (
              <Button
                key={value}
                size="sm"
                variant={status === value ? "default" : "outline"}
                aria-pressed={status === value}
                onClick={() => {
                  setStatus(value)
                  setPage(1)
                }}
              >
                {label}
                {count !== null && <span className="tabular-nums opacity-80">({count})</span>}
              </Button>
            )
          })}
        </div>
        <div className="relative w-full lg:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            type="search"
            aria-label="Rechercher un message"
            placeholder="Rechercher un message"
            className="pl-9"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </div>

      {current?.error ? (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          <span className="flex items-start gap-2">
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {current.error}
          </span>
          <Button variant="outline" size="sm" onClick={reload}>Réessayer</Button>
        </div>
      ) : !data ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : data.messages.length === 0 ? (
        <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-border/70 bg-card/60 p-8 text-center">
          <Inbox className="size-6 text-muted-foreground" aria-hidden="true" />
          <h2 className="mt-3 font-semibold">Aucun message</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {debouncedSearch || status !== "all"
              ? "Aucun message ne correspond à ce filtre."
              : "Les messages envoyés par les habitants apparaîtront ici."}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {data.messages.map((message) => (
              <MessageCard key={message.id} message={message} busy={busyId === message.id} onSetStatus={handleSetStatus} />
            ))}
          </div>

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
    </div>
  )
}
