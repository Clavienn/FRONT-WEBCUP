"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CircleAlert, Trash2Icon } from "lucide-react"

import { useAuth } from "@/components/auth/auth-provider"
import { useLanguage } from "@/components/i18n/language-provider"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"

// Drapeau lu par AuthForm sur /connexion pour confirmer la suppression.
export const ACCOUNT_DELETED_KEY = "terra-nova-account-deleted"

export function DeleteAccountSection() {
  const router = useRouter()
  const { deleteAccount } = useAuth()
  const { t, tList } = useLanguage()
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [deleting, setDeleting] = useState(false)

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) {
      setPassword("")
      setError("")
    }
  }

  const handleDelete = async () => {
    setError("")
    setDeleting(true)
    try {
      await deleteAccount(password)
      handleOpenChange(false)
      // Drapeau en sessionStorage et non query string : setUser(null) déclenche par ailleurs la
      // redirection générique de DashboardFrame vers /connexion, qui écraserait un "?compteSupprime=1"
      // et ferait perdre la confirmation. Le Toaster ne convient pas non plus, il est porté par
      // le layout racine et disparaît lui aussi avec la page.
      window.sessionStorage.setItem(ACCOUNT_DELETED_KEY, "1")
      router.replace("/connexion")
    } catch (err) {
      // La session est intacte : on reste sur place, l'utilisateur peut réessayer.
      setError(err instanceof Error ? err.message : t("deleteAccount.errorGeneric"))
    } finally {
      setDeleting(false)
    }
  }

  return (
    <section className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-medium text-foreground">{t("deleteAccount.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("deleteAccount.subtitle")}</p>
        </div>
        <Button variant="destructive" onClick={() => handleOpenChange(true)}>
          <Trash2Icon />
          {t("deleteAccount.trigger")}
        </Button>
      </div>

      <AlertDialog open={open} onOpenChange={handleOpenChange}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive">
              <Trash2Icon />
            </AlertDialogMedia>
            <AlertDialogTitle>{t("deleteAccount.dialogTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("deleteAccount.dialogDescription")}</AlertDialogDescription>
          </AlertDialogHeader>

          <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
            {tList("deleteAccount.consequences").map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          <form
            className="space-y-2"
            onSubmit={(event) => {
              event.preventDefault()
              void handleDelete()
            }}
          >
            <Label htmlFor="deleteAccountPassword">{t("deleteAccount.passwordLabel")}</Label>
            <Input
              id="deleteAccountPassword"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={deleting}
              required
            />
          </form>

          {error && (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
            >
              <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </p>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t("deleteAccount.cancel")}</AlertDialogCancel>
            {/* Button et non AlertDialogAction : ce dernier ferme le dialogue au clic, donc
                même sur un mot de passe erroné l'utilisateur verrait le dialogue se refermer
                sans jamais lire le message d'erreur. Ici le dialogue ne se ferme qu'après un
                204 de l'API (voir handleOpenChange). */}
            <Button
              variant="destructive"
              disabled={deleting || password.length === 0}
              onClick={() => void handleDelete()}
            >
              {deleting && <Spinner />}
              {t("deleteAccount.confirm")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}