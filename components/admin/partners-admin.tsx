"use client"

import { useEffect, useState, type FormEvent } from "react"
import { CircleAlert, Copy, Plus, RefreshCw, Search } from "lucide-react"

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
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/toast"
import { partnerAccountRepository, type PartnerAccount } from "@/repository/partnerAccount.repository"

const PAGE_SIZE = 10

interface Result {
  key: string
  data?: { users: PartnerAccount[]; page: number; limit: number; total: number }
  error?: string
}

interface CreateFormState {
  email: string
  password: string
  firstName: string
  lastName: string
  phone: string
  address: string
}

const emptyCreateForm: CreateFormState = { email: "", password: "", firstName: "", lastName: "", phone: "", address: "" }

// Pas de 0/O/1/I/l : un mot de passe qu'un administrateur doit parfois relire ou dicter au téléphone.
const PASSWORD_CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*"

function generatePassword(length = 16) {
  const values = new Uint32Array(length)
  crypto.getRandomValues(values)
  return Array.from(values, (value) => PASSWORD_CHARSET[value % PASSWORD_CHARSET.length]).join("")
}

function CreatePartnerDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: (account: PartnerAccount) => void
}) {
  const { t } = useLanguage()
  const [form, setForm] = useState<CreateFormState>(emptyCreateForm)
  const [error, setError] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const set = <K extends keyof CreateFormState>(key: K, value: CreateFormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }))

  const handleGeneratePassword = () => set("password", generatePassword())

  const handleCopyPassword = async () => {
    if (!form.password) return
    try {
      await navigator.clipboard.writeText(form.password)
      toast.add({ title: t("partnersAdmin.passwordCopied"), type: "success" })
    } catch {
      toast.add({ title: t("partnersAdmin.copyFailed"), type: "error" })
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setIsSaving(true)
    try {
      const created = await partnerAccountRepository.create({
        email: form.email.trim(),
        password: form.password,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim() || undefined,
        address: form.address.trim() || undefined,
      })
      onCreated(created)
      setForm(emptyCreateForm)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("partnersAdmin.genericError"))
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("partnersAdmin.dialogTitle")}</DialogTitle>
          <DialogDescription>{t("partnersAdmin.dialogDescription")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="partner-firstName">{t("partnersAdmin.fieldFirstName")}</Label>
              <Input id="partner-firstName" value={form.firstName} onChange={(event) => set("firstName", event.target.value)} required maxLength={100} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partner-lastName">{t("partnersAdmin.fieldLastName")}</Label>
              <Input id="partner-lastName" value={form.lastName} onChange={(event) => set("lastName", event.target.value)} required maxLength={100} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="partner-email">{t("partnersAdmin.fieldEmail")}</Label>
            <Input id="partner-email" type="email" value={form.email} onChange={(event) => set("email", event.target.value)} required maxLength={255} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="partner-password">{t("partnersAdmin.fieldPassword")}</Label>
            <div className="flex items-center gap-2">
              <Input
                id="partner-password"
                type="text"
                value={form.password}
                onChange={(event) => set("password", event.target.value)}
                required
                minLength={8}
                maxLength={128}
                placeholder={t("partnersAdmin.fieldPasswordPlaceholder")}
                className="font-mono"
              />
              <Button type="button" variant="outline" size="icon" onClick={handleGeneratePassword} aria-label={t("partnersAdmin.generatePassword")}>
                <RefreshCw aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleCopyPassword}
                disabled={!form.password}
                aria-label={t("partnersAdmin.copyPassword")}
              >
                <Copy aria-hidden="true" />
              </Button>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="partner-phone">{t("partnersAdmin.fieldPhone")}</Label>
              <Input id="partner-phone" value={form.phone} onChange={(event) => set("phone", event.target.value)} maxLength={30} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partner-address">{t("partnersAdmin.fieldAddress")}</Label>
              <Input id="partner-address" value={form.address} onChange={(event) => set("address", event.target.value)} maxLength={255} />
            </div>
          </div>

          {error && (
            <p role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
              <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              {t("partnersAdmin.cancel")}
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Spinner />}
              {t("partnersAdmin.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function PartnersAdmin() {
  const { t, locale } = useLanguage()
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [page, setPage] = useState(1)
  const [reloadKey, setReloadKey] = useState(0)
  const [result, setResult] = useState<Result | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [creating, setCreating] = useState(false)

  const formatDate = (value: string | null) =>
    value ? new Date(value).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", { dateStyle: "medium" }) : t("partnersAdmin.neverLoggedIn")

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const key = `${debouncedSearch}|${page}|${reloadKey}`
  const current = result?.key === key ? result : null

  useEffect(() => {
    let mounted = true
    partnerAccountRepository
      .list({ q: debouncedSearch || undefined, page, limit: PAGE_SIZE })
      .then((data) => mounted && setResult({ key, data }))
      .catch((cause) => mounted && setResult({ key, error: cause instanceof Error ? cause.message : t("partnersAdmin.genericError") }))
    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- t() n'a pas besoin de redéclencher le fetch
  }, [key, debouncedSearch, page])

  const reload = () => setReloadKey((value) => value + 1)

  const patchAccount = (id: number, patch: Partial<PartnerAccount>) =>
    setResult((previous) =>
      previous?.data
        ? { ...previous, data: { ...previous.data, users: previous.data.users.map((item) => (item.id === id ? { ...item, ...patch } : item)) } }
        : previous
    )

  const toggleActive = async (target: PartnerAccount, isActive: boolean) => {
    setBusyId(target.id)
    try {
      const saved = await partnerAccountRepository.setStatus(target.id, isActive)
      patchAccount(target.id, { isActive: saved.isActive })
    } catch (cause) {
      toast.add({ title: "Erreur", description: cause instanceof Error ? cause.message : t("partnersAdmin.genericError"), type: "error" })
    } finally {
      setBusyId(null)
    }
  }

  const data = current?.data
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1

  return (
    <>
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">{t("partnersAdmin.eyebrow")}</p>
          <h1 className="mt-1 text-3xl font-medium tracking-tight sm:text-4xl">{t("partnersAdmin.title")}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{t("partnersAdmin.subtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              type="search"
              aria-label={t("partnersAdmin.searchAriaLabel")}
              placeholder={t("partnersAdmin.searchPlaceholder")}
              className="pl-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Button onClick={() => setCreating(true)} className="w-fit rounded-xl">
            <Plus aria-hidden="true" />
            {t("partnersAdmin.newButton")}
          </Button>
        </div>
      </section>

      {current?.error ? (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
          <span className="flex items-start gap-2">
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {current.error}
          </span>
          <Button variant="outline" size="sm" onClick={reload}>{t("partnersAdmin.retry")}</Button>
        </div>
      ) : !data ? (
        <Skeleton className="h-72 rounded-2xl" />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/80 bg-card/70 shadow-sm backdrop-blur-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("partnersAdmin.tableHeaderPartner")}</TableHead>
                <TableHead className="hidden md:table-cell">{t("partnersAdmin.tableHeaderLastLogin")}</TableHead>
                <TableHead>{t("partnersAdmin.tableHeaderActive")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="py-10 text-center text-muted-foreground">
                    {t("partnersAdmin.emptyState")}
                  </TableCell>
                </TableRow>
              )}
              {data.users.map((item) => (
                <TableRow key={item.id} className={item.isActive ? undefined : "opacity-60"}>
                  <TableCell>
                    <p className="truncate font-medium">{`${item.firstName} ${item.lastName}`.trim()}</p>
                    <p className="truncate text-xs text-muted-foreground">{item.email}</p>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{formatDate(item.lastLoginAt)}</TableCell>
                  <TableCell>
                    <Switch
                      checked={item.isActive}
                      disabled={busyId === item.id}
                      onCheckedChange={(checked) => toggleActive(item, checked)}
                      aria-label={t(item.isActive ? "partnersAdmin.toggleActiveAriaOn" : "partnersAdmin.toggleActiveAriaOff", { email: item.email })}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {data && totalPages > 1 && (
        <nav aria-label={t("partnersAdmin.paginationLabel")} className="flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            {t("partnersAdmin.previous")}
          </Button>
          <span className="text-sm text-muted-foreground">{t("partnersAdmin.pageOf", { page, total: totalPages })}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            {t("partnersAdmin.next")}
          </Button>
        </nav>
      )}

      <CreatePartnerDialog
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={() => {
          setCreating(false)
          reload()
          toast.add({ title: t("partnersAdmin.toastCreated"), type: "success" })
        }}
      />
    </>
  )
}
