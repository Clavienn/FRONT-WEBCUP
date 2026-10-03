"use client"

import { useCallback, useEffect, useState } from "react"
import { CircleAlert, Inbox, RefreshCw } from "lucide-react"

import { useAuth } from "@/components/auth/auth-provider"
import { useLanguage } from "@/components/i18n/language-provider"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import {
  REQUEST_STATUS_TRANSITIONS,
  citizenRequestRepository,
  requestStatusKey,
  type AgentRequest,
  type RequestStatus,
} from "@/repository/citizenRequest.repository"

type LoadState = "loading" | "error" | "ready"

const dateFormatter = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" })

const STATUS_STYLES: Record<RequestStatus, string> = {
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200",
  in_progress: "border-sky-500/30 bg-sky-500/10 text-sky-800 dark:text-sky-200",
  resolved: "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
  rejected: "border-destructive/30 bg-destructive/10 text-destructive",
}

const FILTERS: Array<RequestStatus | "all"> = ["all", "pending", "in_progress", "resolved", "rejected"]

// Une clôture sans motif est refusée par le serveur : on l'explique avant l'envoi
const CLOSING: RequestStatus[] = ["resolved", "rejected"]

interface RequestRowProps {
  request: AgentRequest
  currentUserId: number
  onUpdated: () => void
}

function RequestRow({ request, currentUserId, onUpdated }: RequestRowProps) {
  const { t } = useLanguage()
  const statusLabel = (status: RequestStatus) => t(`agentRequests.filter${requestStatusKey(status)}`)

  const [target, setTarget] = useState<RequestStatus | "">("")
  const [note, setNote] = useState("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  const transitions = REQUEST_STATUS_TRANSITIONS[request.status]
  const needsNote = target !== "" && CLOSING.includes(target)
  const mine = request.assignedTo === currentUserId

  const apply = async (input: Parameters<typeof citizenRequestRepository.update>[1]) => {
    setSaving(true)
    setError("")
    try {
      await citizenRequestRepository.update(request.id, input)
      toast.add({ title: t("agentRequests.updated"), type: "success" })
      setTarget("")
      setNote("")
      onUpdated()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("agentRequests.updateError"))
    } finally {
      setSaving(false)
    }
  }

  const handleApply = async () => {
    if (!target || saving) return
    if (needsNote && !note.trim()) return
    await apply({ status: target, note: note.trim() || null })
  }

  return (
    <li className="rounded-xl border border-border/80 bg-background/55 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">{request.subject}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {request.owner
              ? t("agentRequests.byCitizen", {
                  name: [request.owner.firstName, request.owner.lastName].filter(Boolean).join(" "),
                })
              : "—"}
            {" · "}
            {request.service?.name ?? t("agentRequests.noService")}
            {" · "}
            {dateFormatter.format(new Date(request.createdAt))}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <Badge variant="outline" className={STATUS_STYLES[request.status]}>
            {statusLabel(request.status)}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {request.assignee
              ? t("agentRequests.assignedTo", {
                  name: [request.assignee.firstName, request.assignee.lastName]
                    .filter(Boolean)
                    .join(" "),
                })
              : t("agentRequests.unassigned")}
          </span>
        </div>
      </div>

      {request.description && (
        <p className="mt-3 text-sm leading-6 text-muted-foreground">{request.description}</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {mine ? (
          <Button
            variant="outline"
            size="sm"
            disabled={saving}
            onClick={() => apply({ assignedTo: null })}
          >
            {t("agentRequests.releaseLabel")}
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            disabled={saving}
            onClick={() => apply({ assignedTo: currentUserId })}
          >
            {t("agentRequests.claimLabel")}
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          disabled={saving}
          onClick={() => apply({ status: "in_progress" })}
        >
          {statusLabel("in_progress")}
        </Button>
      </div>

      {transitions.length > 0 && (
        <div className="mt-4 space-y-2 border-t border-border/70 pt-4">
          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1.5">
              <label
                htmlFor={`status-${request.id}`}
                className="text-xs font-medium text-muted-foreground"
              >
                {t("agentRequests.statusLabel")}
              </label>
              <NativeSelect
                id={`status-${request.id}`}
                value={target}
                onChange={(event) => setTarget(event.target.value as RequestStatus | "")}
              >
                <NativeSelectOption value="">—</NativeSelectOption>
                {transitions.map((status) => (
                  <NativeSelectOption key={status} value={status}>
                    {statusLabel(status)}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </div>

            <div className="min-w-48 flex-1 space-y-1.5">
              <label
                htmlFor={`note-${request.id}`}
                className="text-xs font-medium text-muted-foreground"
              >
                {t("agentRequests.noteLabel")}
              </label>
              <Textarea
                id={`note-${request.id}`}
                rows={2}
                value={note}
                placeholder={t("agentRequests.notePlaceholder")}
                onChange={(event) => setNote(event.target.value)}
              />
            </div>
          </div>

          {needsNote && !note.trim() && (
            <p className="text-xs text-muted-foreground">{t("agentRequests.noteRequiredHint")}</p>
          )}

          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}

          <Button size="sm" disabled={saving || !target || (needsNote && !note.trim())} onClick={handleApply}>
            {saving && <Spinner />}
            {saving ? t("agentRequests.applyingLabel") : t("agentRequests.applyLabel")}
          </Button>
        </div>
      )}
    </li>
  )
}

interface AgentRequestsPanelProps {
  // Prévient le dashboard qu'il doit recalculer ses compteurs par statut
  onChanged?: () => void
}

/** File des demandes citoyennes : l'agent filtre, prend en charge, fait évoluer l'état. */
export function AgentRequestsPanel({ onChanged }: AgentRequestsPanelProps = {}) {
  const { t } = useLanguage()
  const { user } = useAuth()
  const [state, setState] = useState<LoadState>("loading")
  const [requests, setRequests] = useState<AgentRequest[]>([])
  const [error, setError] = useState("")
  const [status, setStatus] = useState<RequestStatus | "all">("pending")
  const [mineOnly, setMineOnly] = useState(false)

  // Same rationale as the citizen panel: the initial state is already "loading", and a
  // synchronous setState in the effect body triggers a cascading render. Re-fetches
  // triggered by the agent go through refresh().
  const load = useCallback(() => {
    if (!user) return
    citizenRequestRepository
      .listAll({ status, mine: mineOnly || undefined })
      .then((page) => {
        setRequests(page.requests)
        setError("")
        setState("ready")
        onChanged?.()
      })
      .catch((cause) => {
        setError(cause instanceof Error ? cause.message : "")
        setState("error")
      })
  }, [mineOnly, status, user, onChanged])

  useEffect(() => {
    load()
  }, [load])

  const refresh = useCallback(() => {
    setState("loading")
    load()
  }, [load])

  if (!user) return null

  const filterLabel = (value: RequestStatus | "all") =>
    value === "all" ? t("agentRequests.filterAll") : t(`agentRequests.filter${requestStatusKey(value)}`)

  return (
    <section aria-labelledby="agent-requests-title" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="agent-requests-title" className="text-lg font-semibold">
            {t("agentRequests.title")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("agentRequests.subtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <NativeSelect value={status} onChange={(event) => setStatus(event.target.value as RequestStatus | "all")}>
            {FILTERS.map((value) => (
              <NativeSelectOption key={value} value={value}>
                {filterLabel(value)}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          <Button variant={mineOnly ? "default" : "outline"} size="sm" onClick={() => setMineOnly((on) => !on)}>
            {t("agentRequests.mineOnly")}
          </Button>
          <Button variant="ghost" size="icon" onClick={refresh} aria-label={t("agentRequests.refreshLabel")}>
            <RefreshCw aria-hidden="true" />
          </Button>
        </div>
      </div>

      <div aria-live="polite">
        {state === "loading" && (
          <div className="space-y-3" aria-hidden="true">
            <div className="h-32 rounded-xl border border-border/70 bg-card/50" />
            <div className="h-32 rounded-xl border border-border/70 bg-card/50" />
          </div>
        )}

        {state === "error" && (
          <p role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {error || t("agentRequests.errorLoad")}
          </p>
        )}

        {state === "ready" && requests.length === 0 && (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border/80 px-4 py-10 text-center">
            <Inbox className="size-6 text-muted-foreground/70" aria-hidden="true" />
            <p className="text-sm font-medium">{t("agentRequests.emptyTitle")}</p>
            <p className="max-w-md text-sm leading-6 text-muted-foreground">
              {t("agentRequests.emptyDescription")}
            </p>
          </div>
        )}

        {state === "ready" && requests.length > 0 && (
          <ul className="space-y-3">
            {requests.map((request) => (
              <RequestRow key={request.id} request={request} currentUserId={user.id} onUpdated={refresh} />
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}