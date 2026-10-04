"use client"

import { useEffect, useState } from "react"
import { CircleAlert, Pencil, Search } from "lucide-react"

import { useLanguage } from "@/components/i18n/language-provider"
import {
  ProtectedValue,
  useApprovalErrorToast,
  useBlockedActionHint,
  useCurrentAgentApproval,
} from "@/components/agent/agent-approval"
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
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "@/components/ui/toast"
import {
  citizenAccountRepository,
  type CitizenAccount,
  type CitizenAccountPage,
} from "@/repository/citizenAccount.repository"

const PAGE_SIZE = 10

interface Result {
  key: string
  data?: CitizenAccountPage
  error?: string
}

interface ProfileForm {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
}

const toForm = (user: CitizenAccount): ProfileForm => ({
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  phone: user.phone ?? "",
  address: user.address ?? "",
})

// Édition du profil : nom, email, téléphone, adresse. Pas de gestion de rôle ici, un agent
// n'administre que des comptes purement citoyens (voir le contrôleur côté API).
function EditProfileDialog({
  user,
  onClose,
  onSaved,
}: {
  user: CitizenAccount | null
  onClose: () => void
  onSaved: (id: number, patch: Partial<CitizenAccount>) => void
}) {
  const { t } = useLanguage()
  const [form, setForm] = useState<ProfileForm | null>(null)
  const [saving, setSaving] = useState(false)
  const notifyError = useApprovalErrorToast()

  useEffect(() => {
    setForm(user ? toForm(user) : null)
  }, [user])

  const update = (field: keyof ProfileForm) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setForm((previous) => (previous ? { ...previous, [field]: event.target.value } : previous))

  const save = async () => {
    if (!user || !form) return
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.add({ title: t("citizenAccounts.toast.errorTitle"), description: t("citizenAccounts.toast.nameRequired"), type: "error" })
      return
    }
    setSaving(true)
    try {
      const saved = await citizenAccountRepository.update(user.id, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
      })
      onSaved(user.id, saved)
      toast.add({ title: t("citizenAccounts.toast.profileUpdated"), type: "success" })
      onClose()
    } catch (cause) {
      notifyError(cause, t("citizenAccounts.toast.errorTitle"), "edit")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={user !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("citizenAccounts.dialog.title")}</DialogTitle>
          <DialogDescription>{t("citizenAccounts.dialog.description")}</DialogDescription>
        </DialogHeader>

        {form && (
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="firstName">{t("citizenAccounts.dialog.firstName")}</Label>
                <Input id="firstName" value={form.firstName} onChange={update("firstName")} disabled={saving} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="lastName">{t("citizenAccounts.dialog.lastName")}</Label>
                <Input id="lastName" value={form.lastName} onChange={update("lastName")} disabled={saving} />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="email">{t("citizenAccounts.dialog.email")}</Label>
              <Input id="email" type="email" value={form.email} onChange={update("email")} disabled={saving} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="phone">{t("citizenAccounts.dialog.phone")}</Label>
              <Input id="phone" value={form.phone} onChange={update("phone")} disabled={saving} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="address">{t("citizenAccounts.dialog.address")}</Label>
              <Input id="address" value={form.address} onChange={update("address")} disabled={saving} />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>{t("citizenAccounts.dialog.cancel")}</Button>
          <Button onClick={save} disabled={saving}>{t("citizenAccounts.dialog.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function CitizenAccounts() {
  const { t, locale } = useLanguage()
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [page, setPage] = useState(1)
  const [reloadKey, setReloadKey] = useState(0)
  const [result, setResult] = useState<Result | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)

  const { approval, reportContacts } = useCurrentAgentApproval()
  const notifyError = useApprovalErrorToast()
  // Tant que le compte attend sa validation, l'API refuse ces deux écritures : on désactive le
  // bouton en annonçant pourquoi, au lieu de laisser l'agent découvrir le refus à chaque clic.
  const pending = approval === "pending"
  const editHint = useBlockedActionHint("edit")
  const statusHint = useBlockedActionHint("status")

  const errorMessage = (cause: unknown) => (cause instanceof Error ? cause.message : t("citizenAccounts.errorGeneric"))

  const formatDate = (value: string | null) =>
    value ? new Date(value).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", { dateStyle: "medium" }) : t("citizenAccounts.never")

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
    citizenAccountRepository
      .list({ q: debouncedSearch || undefined, page, limit: PAGE_SIZE })
      .then((data) => {
        if (!mounted) return
        // Ce lot de contacts est la seule chose qui révèle si l'API masque les coordonnées.
        reportContacts(data.users)
        setResult({ key, data })
      })
      .catch((cause) => mounted && setResult({ key, error: errorMessage(cause) }))
    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, debouncedSearch, page])

  const reload = () => setReloadKey((value) => value + 1)

  const patchUser = (id: number, patch: Partial<CitizenAccount>) =>
    setResult((previous) =>
      previous?.data
        ? {
            ...previous,
            data: {
              ...previous.data,
              users: previous.data.users.map((item) => (item.id === id ? { ...item, ...patch } : item)),
            },
          }
        : previous
    )

  const toggleActive = async (target: CitizenAccount, isActive: boolean) => {
    setBusyId(target.id)
    try {
      const saved = await citizenAccountRepository.setStatus(target.id, isActive)
      patchUser(target.id, { isActive: saved.isActive })
      toast.add({
        title: saved.isActive ? t("citizenAccounts.toast.activated") : t("citizenAccounts.toast.deactivated"),
        description: saved.isActive
          ? t("citizenAccounts.toast.activatedDescription")
          : t("citizenAccounts.toast.deactivatedDescription"),
        type: "success",
      })
    } catch (cause) {
      notifyError(cause, t("citizenAccounts.toast.errorTitle"), "status")
    } finally {
      setBusyId(null)
    }
  }

  const data = current?.data
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1
  const editing = data?.users.find((item) => item.id === editingId) ?? null

  return (
    <>
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">{t("citizenAccounts.eyebrow")}</p>
          <h1 className="mt-1 text-3xl font-medium tracking-tight sm:text-4xl">{t("citizenAccounts.title")}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{t("citizenAccounts.description")}</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            type="search"
            aria-label={t("citizenAccounts.searchAriaLabel")}
            placeholder={t("citizenAccounts.searchPlaceholder")}
            className="pl-9"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
      </section>

      {current?.error ? (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
          <span className="flex items-start gap-2">
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {current.error}
          </span>
          <Button variant="outline" size="sm" onClick={reload}>{t("citizenAccounts.retry")}</Button>
        </div>
      ) : !data ? (
        <Skeleton className="h-72 rounded-2xl" />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border/80 bg-card/70 shadow-sm backdrop-blur-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("citizenAccounts.table.citizen")}</TableHead>
                <TableHead className="hidden md:table-cell">{t("citizenAccounts.table.phone")}</TableHead>
                <TableHead className="hidden md:table-cell">{t("citizenAccounts.table.lastLogin")}</TableHead>
                <TableHead>{t("citizenAccounts.table.active")}</TableHead>
                <TableHead className="text-right">{t("citizenAccounts.table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    {t("citizenAccounts.emptyState")}
                  </TableCell>
                </TableRow>
              )}
              {data.users.map((item) => (
                <TableRow key={item.id} className={item.isActive ? undefined : "opacity-60"}>
                  <TableCell>
                    <p className="truncate font-medium">{`${item.firstName} ${item.lastName}`.trim()}</p>
                    {/* Un e-mail « a***@domaine » vient du masquage côté API : il s'affiche tel quel,
                        mais marqué comme restreint, pour ne pas passer pour une donnée cassée. */}
                    <ProtectedValue value={item.email} className="block truncate text-xs text-muted-foreground" />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {/* En attente de validation, l'API ne transmet aucun téléphone : on montre le
                        cadenas plutôt qu'un tiret, qui se lirait comme un champ laissé vide. */}
                    <ProtectedValue value={item.phone} withheld={pending} />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{formatDate(item.lastLoginAt)}</TableCell>
                  <TableCell>
                    <Switch
                      checked={item.isActive}
                      // Le refus de l'API est ici une information : on le dit avant le clic
                      disabled={pending || busyId === item.id}
                      title={pending ? statusHint ?? undefined : undefined}
                      onCheckedChange={(checked) => toggleActive(item, checked)}
                      aria-label={t(
                        item.isActive ? "citizenAccounts.table.deactivateAria" : "citizenAccounts.table.activateAria",
                        { email: item.email }
                      )}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pending}
                      title={pending ? editHint ?? undefined : undefined}
                      onClick={() => setEditingId(item.id)}
                    >
                      <Pencil />
                      {t("citizenAccounts.table.edit")}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {data && totalPages > 1 && (
        <nav aria-label={t("citizenAccounts.pagination.aria")} className="flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            {t("citizenAccounts.pagination.previous")}
          </Button>
          <span className="text-sm text-muted-foreground">
            {t("citizenAccounts.pagination.pageOf", { page, total: totalPages })}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            {t("citizenAccounts.pagination.next")}
          </Button>
        </nav>
      )}

      <EditProfileDialog user={editing} onClose={() => setEditingId(null)} onSaved={patchUser} />
    </>
  )
}
