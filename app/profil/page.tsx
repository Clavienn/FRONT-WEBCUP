"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeftIcon, CalendarIcon, DownloadIcon, LogOutIcon, MailIcon, MapPinIcon, MonitorSmartphoneIcon, PhoneIcon, UserIcon } from "lucide-react"

import { useAuth } from "@/components/auth/auth-provider"
import { useLanguage } from "@/components/i18n/language-provider"
import { DashboardFrame } from "@/components/dashboard/dashboard-shell"
import { isStaff, roleLabel } from "@/repository/auth.repository"
import { DeleteAccountSection } from "@/components/profile/delete-account-section"
import { PasswordForm } from "@/components/profile/password-form"
import { SecuritySection } from "@/components/profile/security-section"
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
  const [exportingPdf, setExportingPdf] = useState(false)

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

  const handleDownloadProfile = async () => {
    if (!user) return

    setExportingPdf(true)
    try {
      const { jsPDF } = await import("jspdf")
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const margin = 18
      const contentWidth = pageWidth - margin * 2
      const gap = 6
      const columnWidth = (contentWidth - gap) / 2
      const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email
      const initials =
        ((user.firstName?.[0] ?? "") + (user.lastName?.[0] ?? "")).toUpperCase() ||
        user.email[0]?.toUpperCase() || "?"
      const locale = t("profilePage.pdf.locale")
      const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "long" })
      const formatPdfDate = (value: string) =>
        value ? dateFormatter.format(new Date(value)) : "—"
      const colors = {
        ink: [25, 48, 46] as const,
        forest: [17, 57, 53] as const,
        teal: [54, 119, 111] as const,
        copper: [215, 139, 91] as const,
        muted: [104, 122, 118] as const,
        paper: [246, 248, 245] as const,
        border: [222, 230, 225] as const,
        white: [255, 255, 255] as const,
      }

      pdf.setProperties({
        title: `${t("profilePage.pdf.title")} - ${fullName}`,
        subject: t("profilePage.pdf.subject"),
        author: "Terra Nova",
      })

      pdf.setFillColor(...colors.paper)
      pdf.rect(0, 0, pageWidth, pdf.internal.pageSize.getHeight(), "F")
      pdf.setFillColor(...colors.forest)
      pdf.rect(0, 0, pageWidth, 72, "F")
      pdf.setFillColor(...colors.copper)
      pdf.rect(0, 0, 3, 72, "F")
      pdf.setTextColor(...colors.copper)
      pdf.setFont("helvetica", "bold")
      pdf.setFontSize(8)
      pdf.text(t("profilePage.pdf.brand"), margin, 16)
      pdf.setTextColor(197, 216, 208)
      pdf.setFont("helvetica", "normal")
      pdf.setFontSize(7)
      pdf.text(t("profilePage.pdf.documentType"), pageWidth - margin, 16, { align: "right" })

      pdf.setTextColor(...colors.white)
      pdf.setFont("times", "bold")
      pdf.setFontSize(24)
      const nameLines = pdf.splitTextToSize(fullName, 137).slice(0, 2)
      pdf.text(nameLines, margin, 37)

      const role = t(`roles.${roleLabel(user)}`)
      pdf.setFont("helvetica", "bold")
      pdf.setFontSize(8)
      const roleWidth = pdf.getTextWidth(role) + 12
      pdf.setFillColor(...colors.teal)
      pdf.roundedRect(margin, 55, roleWidth, 9, 4.5, 4.5, "F")
      pdf.setTextColor(...colors.white)
      pdf.text(role, margin + 6, 61)

      pdf.setDrawColor(255, 255, 255)
      pdf.setLineWidth(0.6)
      pdf.circle(pageWidth - 31, 43, 15, "S")
      pdf.setTextColor(...colors.white)
      pdf.setFont("times", "bold")
      pdf.setFontSize(15)
      pdf.text(initials, pageWidth - 31, 45, { align: "center" })
      pdf.setTextColor(...colors.copper)
      pdf.setFont("helvetica", "bold")
      pdf.setFontSize(6)
      pdf.text("TN  /  " + String(user.id).padStart(5, "0"), pageWidth - 31, 64, { align: "center" })

      pdf.setFillColor(...colors.white)
      pdf.setDrawColor(...colors.border)
      pdf.roundedRect(margin, 82, contentWidth, 24, 3, 3, "FD")
      pdf.setTextColor(...colors.muted)
      pdf.setFont("helvetica", "bold")
      pdf.setFontSize(7)
      pdf.text(t("profilePage.pdf.accountNumber"), margin + 6, 91)
      pdf.setTextColor(...colors.ink)
      pdf.setFontSize(12)
      pdf.text("TN-" + String(user.id).padStart(6, "0"), margin + 6, 100)
      pdf.setDrawColor(...colors.border)
      pdf.line(pageWidth / 2, 87, pageWidth / 2, 101)
      pdf.setTextColor(...colors.muted)
      pdf.setFontSize(7)
      pdf.text(t("profilePage.pdf.memberSince"), pageWidth / 2 + 7, 91)
      pdf.setTextColor(...colors.ink)
      pdf.setFont("helvetica", "normal")
      pdf.setFontSize(9)
      pdf.text(formatPdfDate(user.createdAt), pageWidth / 2 + 7, 100)

      pdf.setTextColor(...colors.teal)
      pdf.setFont("helvetica", "bold")
      pdf.setFontSize(8)
      pdf.text(t("profilePage.pdf.sectionTitle"), margin, 122)
      pdf.setDrawColor(...colors.copper)
      pdf.setLineWidth(1)
      pdf.line(margin, 126, margin + 16, 126)

      const drawField = (label: string, value: string, x: number, y: number, width: number) => {
        const lines = pdf.splitTextToSize(value || "—", width - 12)
        const height = Math.max(28, 18 + lines.length * 5)
        pdf.setFillColor(...colors.white)
        pdf.setDrawColor(...colors.border)
        pdf.setLineWidth(0.25)
        pdf.roundedRect(x, y, width, height, 2, 2, "FD")
        pdf.setTextColor(...colors.muted)
        pdf.setFont("helvetica", "bold")
        pdf.setFontSize(7)
        pdf.text(label.toUpperCase(), x + 5, y + 8)
        pdf.setTextColor(...colors.ink)
        pdf.setFont("helvetica", "normal")
        pdf.setFontSize(9)
        pdf.text(lines, x + 5, y + 17)
        return height
      }

      let y = 132
      const emailHeight = drawField(t("profilePage.pdf.email"), user.email, margin, y, columnWidth)
      const phoneHeight = drawField(
        t("profilePage.pdf.phone"),
        user.phone || "—",
        margin + columnWidth + gap,
        y,
        columnWidth
      )
      y += Math.max(emailHeight, phoneHeight) + 5

      y += drawField(t("profilePage.pdf.address"), user.address || "—", margin, y, contentWidth) + 5

      const roleHeight = drawField(
        t("profilePage.pdf.role"),
        role,
        margin + columnWidth + gap,
        y,
        columnWidth
      )
      const idHeight = drawField(
        t("profilePage.pdf.accountId"),
        String(user.id),
        margin,
        y,
        columnWidth
      )
      y += Math.max(roleHeight, idHeight) + 5

      const createdHeight = drawField(
        t("profilePage.pdf.memberSince"),
        formatPdfDate(user.createdAt),
        margin,
        y,
        columnWidth
      )
      drawField(
        t("profilePage.pdf.lastUpdate"),
        formatPdfDate(user.updatedAt),
        margin + columnWidth + gap,
        y,
        columnWidth
      )

      const footerY = Math.min(278, y + createdHeight + 13)
      pdf.setDrawColor(...colors.border)
      pdf.line(margin, footerY, pageWidth - margin, footerY)
      pdf.setTextColor(...colors.muted)
      pdf.setFont("helvetica", "normal")
      pdf.setFontSize(7)
      pdf.text(t("profilePage.pdf.footer"), margin, footerY + 7)
      pdf.setTextColor(...colors.teal)
      pdf.setFont("helvetica", "bold")
      pdf.text(formatPdfDate(new Date().toISOString()), pageWidth - margin, footerY + 7, { align: "right" })

      pdf.save(`terra-nova-profil-${user.id}.pdf`)
    } catch (err) {
      notifyError(err)
    } finally {
      setExportingPdf(false)
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
    { icon: PhoneIcon, label: t("profilePage.fields.phone"), value: user.phone || "—" },
    { icon: MapPinIcon, label: t("profilePage.fields.address"), value: user.address || "—" },
    { icon: CalendarIcon, label: t("profilePage.fields.memberSince"), value: formatDate(user.createdAt) },
    { icon: CalendarIcon, label: t("profilePage.fields.lastUpdate"), value: formatDate(user.updatedAt) },
  ]

  return (
    <DashboardFrame>
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div className="space-y-2">
              <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/dashboard" />}>
                <ArrowLeftIcon /> {t("profilePage.backToDashboard")}
              </Button>
              <h1 className="text-2xl font-medium tracking-tight text-foreground">{t("profilePage.title")}</h1>
            </div>
            <div className="flex w-full gap-2 sm:w-auto">
              <Button
                onClick={handleDownloadProfile}
                disabled={exportingPdf || signingOut !== null}
                className="flex-1 sm:flex-none"
              >
                {exportingPdf ? <Spinner /> : <DownloadIcon />}
                {exportingPdf ? t("profilePage.generatingPdf") : t("profilePage.downloadProfile")}
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleSignOut("one")}
                disabled={signingOut !== null || exportingPdf}
                className="flex-1 sm:flex-none"
              >
                {signingOut === "one" ? <Spinner /> : <LogOutIcon />}
                {t("profilePage.signOut")}
              </Button>
            </div>
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

          <SecuritySection />

          {/* Un agent ou un administrateur reste administrable via la console : la suppression
              de compte n'est proposée qu'à l'espace citoyen, comme le refuse l'API. */}
          {!isStaff(user) && <DeleteAccountSection />}
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