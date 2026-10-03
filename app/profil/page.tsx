"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeftIcon, CalendarIcon, LogOutIcon, MailIcon, MonitorSmartphoneIcon, UserIcon } from "lucide-react"

import { useAuth } from "@/components/auth/auth-provider"
import { useLanguage } from "@/components/i18n/language-provider"
import { DashboardFrame } from "@/components/dashboard/dashboard-shell"
import { roleLabel } from "@/repository/auth.repository"
import { PasswordForm } from "@/components/profile/password-form"
import { ProfileForm } from "@/components/profile/profile-form"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
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

const formatDate = (value: string) =>
  new Date(value).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" })

export default function ProfilPage() {
  const router = useRouter()
  const { user, isLoading, reloadUser, signOut, signOutEverywhere } = useAuth()
  const { t } = useLanguage()
  const [signingOut, setSigningOut] = useState<"one" | "all" | null>(null)
  const [confirmAll, setConfirmAll] = useState(false)

  const notifyError = (err: unknown) =>
    toast.add({
      title: t("profilePage.errorTitle"),
      description: err instanceof Error ? err.message : t("profilePage.errorFallback"),
      type: "error",
    })

  // Pas de session : retour à la connexion
  useEffect(() => {
    if (!isLoading && !user && !signingOut) router.replace("/connexion")
  }, [isLoading, router, signingOut, user])

  // Données à jour depuis le backend (/auth/me)
  const hasUser = user !== null
  useEffect(() => {
    if (!isLoading && hasUser) reloadUser().catch(notifyError)
  }, [hasUser, isLoading, reloadUser])

  const handleSignOut = async (scope: "one" | "all") => {
    setSigningOut(scope)
    try {
      await (scope === "all" ? signOutEverywhere() : signOut())
    } catch (err) {
      // La session locale est déjà effacée par le provider
      notifyError(err)
    } finally {
      router.replace("/connexion")
    }
  }

  if (isLoading || !user) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Spinner />
      </div>
    )
  }

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ")
  const initials =
    ((user.firstName?.[0] ?? "") + (user.lastName?.[0] ?? "")).toUpperCase() ||
    user.email[0].toUpperCase()

  const details = [
    { icon: MailIcon, label: t("profilePage.fields.email"), value: user.email },
    { icon: UserIcon, label: t("profilePage.fields.firstName"), value: user.firstName || "—" },
    { icon: UserIcon, label: t("profilePage.fields.lastName"), value: user.lastName || "—" },
    { icon: CalendarIcon, label: t("profilePage.fields.memberSince"), value: formatDate(user.createdAt) },
    { icon: CalendarIcon, label: t("profilePage.fields.lastUpdate"), value: formatDate(user.updatedAt) },
  ]

  return (
    <DashboardFrame>
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="flex items-end justify-between gap-4">
            <div className="space-y-2">
              <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/dashboard" />}>
                <ArrowLeftIcon /> {t("profilePage.backToDashboard")}
              </Button>
              <h1 className="text-2xl font-medium tracking-tight text-foreground">{t("profilePage.title")}</h1>
            </div>
            <Button variant="destructive" onClick={() => handleSignOut("one")} disabled={signingOut !== null}>
              {signingOut === "one" ? <Spinner /> : <LogOutIcon />}
              {t("profilePage.signOut")}
            </Button>
          </div>

          <section className="rounded-2xl border border-border/80 bg-card/70 p-6 shadow-[0_8px_30px_rgba(50,80,120,0.04)] backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <Avatar className="size-14">
                <AvatarFallback className="bg-accent text-lg font-medium text-primary">{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-lg font-medium text-foreground">{fullName || user.email}</p>
                <Badge variant={user.roles.includes("admin") ? "default" : "secondary"} className="mt-1">
                  {t(`roles.${roleLabel(user)}`)}
                </Badge>
              </div>
            </div>

            <dl className="mt-6 divide-y divide-border/70 border-t border-border/70">
              {details.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3 py-3 text-sm">
                  <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <dt className="w-40 shrink-0 text-muted-foreground">{label}</dt>
                  <dd className="min-w-0 truncate font-medium text-foreground">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="rounded-2xl border border-border/80 bg-card/70 p-6 backdrop-blur-sm">
            <div className="mb-5">
              <h2 className="font-medium text-foreground">{t("profilePage.editTitle")}</h2>
              <p className="text-sm text-muted-foreground">{t("profilePage.editSubtitle")}</p>
            </div>
            {/* key : réinitialise le formulaire quand le profil est rechargé ou enregistré */}
            <ProfileForm key={`${user.id}-${user.updatedAt}`} user={user} />
          </section>

          <section className="rounded-2xl border border-border/80 bg-card/70 p-6 backdrop-blur-sm">
            <div className="mb-5">
              <h2 className="font-medium text-foreground">{t("profilePage.passwordTitle")}</h2>
              <p className="text-sm text-muted-foreground">
                {t("profilePage.passwordSubtitle")}
              </p>
            </div>
            <PasswordForm />
          </section>

          <section className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card/70 p-6 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-foreground">{t("profilePage.sessionsTitle")}</p>
              <p className="text-sm text-muted-foreground">
                {t("profilePage.sessionsSubtitle")}
              </p>
            </div>
            <Button variant="outline" onClick={() => setConfirmAll(true)} disabled={signingOut !== null}>
              {signingOut === "all" ? <Spinner /> : <MonitorSmartphoneIcon />}
              {t("profilePage.signOutEverywhere")}
            </Button>
          </section>
        </div>

        <AlertDialog open={confirmAll} onOpenChange={setConfirmAll}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("profilePage.confirmDialog.title")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("profilePage.confirmDialog.description")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("profilePage.confirmDialog.cancel")}</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={() => {
                  setConfirmAll(false)
                  handleSignOut("all")
                }}
              >
                {t("profilePage.confirmDialog.confirm")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </DashboardFrame>
  )
}