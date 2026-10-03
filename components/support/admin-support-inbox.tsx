"use client"

import { useCallback, useEffect, useState, type FormEvent } from "react"
import { CheckCircle2, Clock3, Inbox, RefreshCw, Send } from "lucide-react"

import { supportRepository, type SupportConversation } from "@/repository/support.repository"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"

const formatDate = (value: string) =>
  new Date(value).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })

function SupportTicketCard({
  conversation,
  onReplied,
}: {
  conversation: SupportConversation
  onReplied: (conversation: SupportConversation) => void
}) {
  const [reply, setReply] = useState("")
  const [replyOpen, setReplyOpen] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState("")

  const handleReply = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!reply.trim() || isSending) return

    setError("")
    setIsSending(true)
    try {
      onReplied(await supportRepository.reply(conversation.id, reply.trim()))
      setReply("")
      setReplyOpen(false)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Impossible d’envoyer la réponse.")
    } finally {
      setIsSending(false)
    }
  }

  return (
    <article className="rounded-xl border border-border/80 bg-card/75 p-5 shadow-sm backdrop-blur-sm">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate font-semibold">{conversation.subject}</h2>
          <p className="mt-1 truncate text-sm text-muted-foreground">
            {conversation.senderName || "Habitant"} · {conversation.senderEmail}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={conversation.status === "answered" ? "secondary" : "outline"} className="gap-1.5">
            {conversation.status === "answered" ? (
              <CheckCircle2 className="size-3.5" aria-hidden="true" />
            ) : (
              <Clock3 className="size-3.5" aria-hidden="true" />
            )}
            {conversation.status === "answered" ? "Répondu" : conversation.status === "closed" ? "Clôturé" : "En attente"}
          </Badge>
          <time className="text-xs text-muted-foreground">{formatDate(conversation.createdAt)}</time>
        </div>
      </header>

      <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-foreground">{conversation.latestMessage}</p>
      <p className="mt-2 text-xs text-muted-foreground">
        Dernier message : {conversation.latestSenderRole === "admin" ? "administration" : "habitant"}
      </p>

      {!replyOpen ? (
        <div className="mt-4 border-t border-border/70 pt-4">
          <Button size="sm" variant="outline" onClick={() => setReplyOpen(true)}>
            <Send aria-hidden="true" />
            {conversation.status === "answered" ? "Répondre à nouveau" : "Répondre"}
          </Button>
        </div>
      ) : (
        <form onSubmit={handleReply} className="mt-4 grid gap-3 border-t border-border/70 pt-4">
          <Textarea
            aria-label={`Réponse à ${conversation.subject}`}
            value={reply}
            onChange={(event) => setReply(event.target.value)}
            placeholder="Rédigez votre réponse..."
            rows={4}
            maxLength={3000}
            minLength={2}
            required
            autoFocus
          />
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setReplyOpen(false)} disabled={isSending}>
              Annuler
            </Button>
            <Button type="submit" size="sm" disabled={isSending || !reply.trim()}>
              {isSending ? <Spinner /> : <Send aria-hidden="true" />}
              Envoyer la réponse
            </Button>
          </div>
        </form>
      )}
    </article>
  )
}

export function AdminSupportInbox() {
  const [conversations, setConversations] = useState<SupportConversation[] | null>(null)
  const [error, setError] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)

  const load = useCallback(async () => {
    setIsRefreshing(true)
    try {
      setConversations(await supportRepository.listAdmin())
      setError("")
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Impossible de charger les demandes.")
    } finally {
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const updateConversation = (updated: SupportConversation) => {
    setConversations((current) => current?.map((conversation) => conversation.id === updated.id ? updated : conversation) ?? null)
  }

  const pendingCount = conversations?.filter((conversation) => conversation.status === "open").length ?? 0

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">Administration</p>
          <h1 className="mt-1 text-3xl font-medium tracking-tight sm:text-4xl">Messages de support</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Consultez les demandes des habitants et répondez depuis la console.
          </p>
        </div>
        <Button variant="outline" onClick={load} disabled={isRefreshing}>
          {isRefreshing ? <Spinner /> : <RefreshCw aria-hidden="true" />}
          Actualiser
        </Button>
      </section>

      {conversations && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
          <Inbox className="size-4" aria-hidden="true" />
          <span>{conversations.length} demande{conversations.length > 1 ? "s" : ""}</span>
          <span aria-hidden="true">·</span>
          <span>{pendingCount} en attente</span>
        </div>
      )}

      {error ? (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={load}>Réessayer</Button>
        </div>
      ) : conversations === null ? (
        <div className="grid min-h-48 place-items-center rounded-xl border border-border/70 bg-card/60">
          <Spinner />
        </div>
      ) : conversations.length === 0 ? (
        <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-border/70 bg-card/60 p-8 text-center">
          <Inbox className="size-6 text-muted-foreground" aria-hidden="true" />
          <h2 className="mt-3 font-semibold">Aucune demande pour le moment</h2>
          <p className="mt-1 text-sm text-muted-foreground">Les messages envoyés par les habitants apparaîtront ici.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {conversations.map((conversation) => (
            <SupportTicketCard key={conversation.id} conversation={conversation} onReplied={updateConversation} />
          ))}
        </div>
      )}
    </div>
  )
}