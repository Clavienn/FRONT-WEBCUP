"use client"

import { useCallback, useEffect, useState } from "react"
import { CircleAlert, Clock3, ShieldCheck, Siren } from "lucide-react"

import { useLanguage } from "@/components/i18n/language-provider"
import { ReportForm, ReportQueued, ReportReceipt } from "@/components/signalements/report-form"
import { PriorityBadge, StatusBadge } from "@/components/signalements/signalement-badges"
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/toast"
import { AuthApiError } from "@/repository/auth.repository"
import {
  signalementRepository,
  type Signalement,
  type SignalementDetail,
  type SignalementReceipt,
} from "@/repository/signalement.repository"

const errorMessage = (cause: unknown) => (cause instanceof Error ? cause.message : "")

// Déroulé des états d'un signalement, sans notes internes ni identité complète de l'agent
function Timeline({ id }: { id: number }) {
  const { t, locale } = useLanguage()
  const [detail, setDetail] = useState<SignalementDetail | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    let mounted = true
    signalementRepository
      .getMine(id)
      .then((data) => mounted && setDetail(data))
      .catch((cause) => mounted && setError(errorMessage(cause) || t("signalements.mine.detailError")))
    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement unique par signalement
  }, [id])

  if (error) return <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>
  if (!detail) return <Skeleton className="mt-3 h-14 rounded-lg" />

  const formatter = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "fr-FR", { dateStyle: "medium", timeStyle: "short" })
  return (
    <ol className="mt-4 space-y-3 border-l-2 border-border pl-4">
      {detail.timeline.map((entry, index) => (
        <li key={`${entry.at}-${index}`} className="relative">
          <span className="absolute -left-[21px] top-1.5 size-2.5 rounded-full bg-primary" aria-hidden="true" />
          <p className="text-sm font-medium">{t(`signalements.status.${entry.status}`)}</p>
          <p className="text-xs text-muted-foreground">
            {Number.isFinite(new Date(entry.at).getTime()) ? formatter.format(new Date(entry.at)) : "—"}
          </p>
        </li>
      ))}
    </ol>
  )
}

// Espace citoyen : signaler une urgence, puis suivre sa prise en charge
export function MySignalements() {
  const { t, locale } = useLanguage()
  const [items, setItems] = useState<Signalement[] | null>(null)
  const [error, setError] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [receipt, setReceipt] = useState<SignalementReceipt | null>(null)
  // Envoi sans réseau : le signalement est sur l'appareil et partira au retour de la connexion
  const [queued, setQueued] = useState(false)
  const [openId, setOpenId] = useState<number | null>(null)
  const [cancelling, setCancelling] = useState<Signalement | null>(null)

  const load = useCallback(async () => {
    try {
      setItems(await signalementRepository.listMine("all"))
      setError("")
    } catch (cause) {
      setError(errorMessage(cause) || t("signalements.mine.loadError"))
    }
  }, [t])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- chargement initial depuis l'API
    void load()
  }, [load])

  const confirmCancel = async () => {
    if (!cancelling) return
    const target = cancelling
    setCancelling(null)
    try {
      await signalementRepository.cancelMine(target.id)
      toast.add({ title: t("signalements.mine.cancelled"), type: "success" })
      await load()
    } catch (cause) {
      // 409 signalement_not_cancellable : déjà en cours de traitement
      toast.add({
        title: t("signalements.mine.cancelError"),
        description: cause instanceof AuthApiError ? cause.message : undefined,
        type: "error",
      })
      await load()
    }
  }

  const formatter = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "fr-FR", { dateStyle: "medium", timeStyle: "short" })
  const open = items?.filter((item) => item.status !== "resolved" && item.status !== "cancelled") ?? []
  const closed = items?.filter((item) => item.status === "resolved" || item.status === "cancelled") ?? []

  const renderItem = (item: Signalement) => {
    const expanded = openId === item.id
    const cancellable = item.status === "new" || item.status === "acknowledged"
    return (
      <li key={item.id} className="rounded-xl border border-border/80 bg-card/75 p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold">{item.title || item.label[locale]}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {item.label[locale]} · {item.location}
              {Number.isFinite(new Date(item.createdAt).getTime()) ? ` · ${formatter.format(new Date(item.createdAt))}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <PriorityBadge priority={item.priority} />
            <StatusBadge status={item.status} />
          </div>
        </div>

        <p className="mt-3 flex items-center gap-2 text-sm">
          {item.acknowledged ? (
            <>
              <ShieldCheck className="size-4 text-emerald-600" aria-hidden="true" />
              {item.handledBy ? t("signalements.mine.handledBy", { name: item.handledBy }) : t("signalements.mine.acknowledged")}
            </>
          ) : (
            <>
              <Clock3 className="size-4 text-amber-600" aria-hidden="true" />
              {t("signalements.mine.waiting")}
            </>
          )}
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" aria-expanded={expanded} onClick={() => setOpenId(expanded ? null : item.id)}>
            {expanded ? t("signalements.mine.hideDetail") : t("signalements.mine.showDetail")}
          </Button>
          {cancellable && (
            <Button variant="outline" size="sm" onClick={() => setCancelling(item)}>
              {t("signalements.mine.cancel")}
            </Button>
          )}
        </div>
        {expanded && <Timeline id={item.id} />}
      </li>
    )
  }

  return (
    <>
      <section className="space-y-4">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-primary">{t("signalements.eyebrow")}</p>
            <h1 className="mt-1 text-3xl font-medium tracking-tight sm:text-4xl">{t("signalements.mine.title")}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{t("signalements.mine.subtitle")}</p>
          </div>
          <Button
            size="lg"
            onClick={() => {
              setReceipt(null)
              setQueued(false)
              setFormOpen(true)
            }}
            className="h-12 w-fit rounded-xl bg-red-600 px-5 text-base text-white hover:bg-red-700"
          >
            <Siren aria-hidden="true" />
            {t("signalements.mine.report")}
          </Button>
        </div>

        <p role="note" className="flex items-start gap-2 rounded-lg border border-red-600/30 bg-red-600/5 px-3 py-2.5 text-sm">
          <Siren className="mt-0.5 size-4 shrink-0 text-red-600" aria-hidden="true" />
          {t("signalements.form.callEmergency")}
        </p>
      </section>

      {error ? (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
          <span className="flex items-start gap-2">
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {error}
          </span>
          <Button variant="outline" size="sm" onClick={() => void load()}>{t("signalements.retry")}</Button>
        </div>
      ) : !items ? (
        <div className="space-y-3">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
      ) : items.length === 0 ? (
        <p className="rounded-2xl border border-border/80 bg-card/70 p-8 text-center text-sm text-muted-foreground">
          {t("signalements.mine.empty")}
        </p>
      ) : (
        <>
          {open.length > 0 && (
            <section className="space-y-3" aria-labelledby="sig-open">
              <h2 id="sig-open" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {t("signalements.mine.openTitle", { count: open.length })}
              </h2>
              <ul className="space-y-3">{open.map(renderItem)}</ul>
            </section>
          )}
          {closed.length > 0 && (
            <section className="space-y-3" aria-labelledby="sig-closed">
              <h2 id="sig-closed" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {t("signalements.mine.closedTitle", { count: closed.length })}
              </h2>
              <ul className="space-y-3">{closed.map(renderItem)}</ul>
            </section>
          )}
        </>
      )}

      <Dialog open={formOpen} onOpenChange={(next) => !next && setFormOpen(false)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("signalements.form.title")}</DialogTitle>
            <DialogDescription>{t("signalements.form.description")}</DialogDescription>
          </DialogHeader>
          {receipt ? (
            <ReportReceipt receipt={receipt} onClose={() => setFormOpen(false)} />
          ) : queued ? (
            <ReportQueued onClose={() => setFormOpen(false)} />
          ) : (
            <ReportForm
              onSent={(sent) => {
                setReceipt(sent)
                void load()
              }}
              onQueued={() => setQueued(true)}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={cancelling !== null} onOpenChange={(next) => !next && setCancelling(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("signalements.mine.cancelTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("signalements.mine.cancelDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("signalements.mine.keep")}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => void confirmCancel()}>
              {t("signalements.mine.cancel")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
