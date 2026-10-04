"use client"

import { useState } from "react"
import { CircleAlert, Copy, ShieldCheck, ShieldOff } from "lucide-react"

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
import { useAuth } from "@/components/auth/auth-provider"
import { useLanguage } from "@/components/i18n/language-provider"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import { authRepository } from "@/repository/auth.repository"

type EnableStep = "password" | "scan" | "recovery"

/**
 * Double authentification (F53/F54) : activation (mot de passe -> QR code -> code à 6 chiffres
 * -> codes de secours montrés une seule fois) et désactivation (mot de passe + code). La connexion
 * elle-même redemande ce code après le mot de passe, voir components/auth/auth-form.tsx.
 */
export function TwoFactorSection() {
  const { user, reloadUser } = useAuth()
  const { t } = useLanguage()
  const enabled = user?.twoFactorEnabled ?? false

  const [enableOpen, setEnableOpen] = useState(false)
  const [enableStep, setEnableStep] = useState<EnableStep>("password")
  const [password, setPassword] = useState("")
  const [setupData, setSetupData] = useState<{ secret: string; qrCodeDataUrl: string } | null>(null)
  const [code, setCode] = useState("")
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([])
  const [working, setWorking] = useState(false)
  const [error, setError] = useState("")

  const [disableOpen, setDisableOpen] = useState(false)
  const [disablePassword, setDisablePassword] = useState("")
  const [disableCode, setDisableCode] = useState("")
  const [disabling, setDisabling] = useState(false)
  const [disableError, setDisableError] = useState("")

  const closeEnableDialog = (next: boolean) => {
    setEnableOpen(next)
    if (!next) {
      setEnableStep("password")
      setPassword("")
      setSetupData(null)
      setCode("")
      setRecoveryCodes([])
      setError("")
    }
  }

  const closeDisableDialog = (next: boolean) => {
    setDisableOpen(next)
    if (!next) {
      setDisablePassword("")
      setDisableCode("")
      setDisableError("")
    }
  }

  const startSetup = async () => {
    setError("")
    setWorking(true)
    try {
      setSetupData(await authRepository.setupTwoFactor(password))
      setEnableStep("scan")
    } catch (err) {
      setError(err instanceof Error ? err.message : t("twoFactorSection.errorGeneric"))
    } finally {
      setWorking(false)
    }
  }

  const confirmSetup = async () => {
    setError("")
    setWorking(true)
    try {
      const { recoveryCodes: codes } = await authRepository.verifyTwoFactorSetup(code)
      setRecoveryCodes(codes)
      setEnableStep("recovery")
      await reloadUser()
    } catch (err) {
      setError(err instanceof Error ? err.message : t("twoFactorSection.errorGeneric"))
    } finally {
      setWorking(false)
    }
  }

  const handleDisable = async () => {
    setDisableError("")
    setDisabling(true)
    try {
      await authRepository.disableTwoFactor(disablePassword, disableCode)
      closeDisableDialog(false)
      await reloadUser()
      toast.add({ title: t("twoFactorSection.disabledToast"), type: "success" })
    } catch (err) {
      setDisableError(err instanceof Error ? err.message : t("twoFactorSection.errorGeneric"))
    } finally {
      setDisabling(false)
    }
  }

  const copyRecoveryCodes = async () => {
    try {
      await navigator.clipboard.writeText(recoveryCodes.join("\n"))
      toast.add({ title: t("twoFactorSection.copied"), type: "success" })
    } catch {
      // Presse-papiers indisponible : les codes restent affichés, recopiables à la main
    }
  }

  return (
    <section className="space-y-4 rounded-2xl border border-border/80 bg-card/70 p-6 backdrop-blur-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-medium text-foreground">{t("twoFactorSection.title")}</h2>
          <p className="text-sm text-muted-foreground">
            {enabled ? t("twoFactorSection.statusEnabled") : t("twoFactorSection.statusDisabled")}
          </p>
        </div>
        {enabled ? (
          <Button variant="outline" onClick={() => setDisableOpen(true)}>
            <ShieldOff className="size-4" aria-hidden="true" />
            {t("twoFactorSection.disable")}
          </Button>
        ) : (
          <Button onClick={() => setEnableOpen(true)}>
            <ShieldCheck className="size-4" aria-hidden="true" />
            {t("twoFactorSection.enable")}
          </Button>
        )}
      </div>

      <Dialog open={enableOpen} onOpenChange={closeEnableDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("twoFactorSection.dialogTitle")}</DialogTitle>
            <DialogDescription>
              {enableStep === "password" && t("twoFactorSection.step.password")}
              {enableStep === "scan" && t("twoFactorSection.step.scan")}
              {enableStep === "recovery" && t("twoFactorSection.step.recovery")}
            </DialogDescription>
          </DialogHeader>

          {enableStep === "password" && (
            <form
              className="space-y-2"
              onSubmit={(event) => {
                event.preventDefault()
                void startSetup()
              }}
            >
              <Label htmlFor="twofa-password">{t("twoFactorSection.passwordLabel")}</Label>
              <Input
                id="twofa-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={working}
                required
              />
            </form>
          )}

          {enableStep === "scan" && setupData && (
            <div className="space-y-4">
              <div className="flex justify-center rounded-xl border border-border/70 bg-white p-3">
                {/* QR produit côté serveur (data URL PNG), pas une image distante : rien à charger */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={setupData.qrCodeDataUrl} alt={t("twoFactorSection.qrAlt")} width={200} height={200} />
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">{t("twoFactorSection.manualEntryHint")}</p>
                <code className="block rounded-lg border border-border/70 bg-background/50 px-3 py-2 text-center text-sm tracking-wider break-all">
                  {setupData.secret}
                </code>
              </div>
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={code} onChange={setCode} inputMode="numeric" autoFocus>
                  <InputOTPGroup>
                    {Array.from({ length: 6 }, (_, index) => (
                      <InputOTPSlot key={index} index={index} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>
          )}

          {enableStep === "recovery" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{t("twoFactorSection.recoveryHint")}</p>
              <ul className="grid grid-cols-2 gap-2 rounded-xl border border-border/70 bg-background/50 p-4 font-mono text-sm">
                {recoveryCodes.map((recoveryCode) => (
                  <li key={recoveryCode}>{recoveryCode}</li>
                ))}
              </ul>
              <Button type="button" variant="outline" size="sm" onClick={() => void copyRecoveryCodes()}>
                <Copy className="size-4" aria-hidden="true" />
                {t("twoFactorSection.copyRecoveryCodes")}
              </Button>
            </div>
          )}

          {error && (
            <p role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
              <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </p>
          )}

          <DialogFooter>
            {enableStep === "password" && (
              <Button disabled={working || password.length === 0} onClick={() => void startSetup()}>
                {working && <Spinner />}
                {t("twoFactorSection.continue")}
              </Button>
            )}
            {enableStep === "scan" && (
              <Button disabled={working || code.trim().length < 6} onClick={() => void confirmSetup()}>
                {working && <Spinner />}
                {t("twoFactorSection.verifyAndEnable")}
              </Button>
            )}
            {enableStep === "recovery" && <Button onClick={() => closeEnableDialog(false)}>{t("twoFactorSection.done")}</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={disableOpen} onOpenChange={closeDisableDialog}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive">
              <ShieldOff />
            </AlertDialogMedia>
            <AlertDialogTitle>{t("twoFactorSection.disableDialogTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("twoFactorSection.disableDialogDescription")}</AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="disable-2fa-password">{t("twoFactorSection.passwordLabel")}</Label>
              <Input
                id="disable-2fa-password"
                type="password"
                autoComplete="current-password"
                value={disablePassword}
                onChange={(event) => setDisablePassword(event.target.value)}
                disabled={disabling}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="disable-2fa-code">{t("twoFactorSection.codeLabel")}</Label>
              <Input
                id="disable-2fa-code"
                autoComplete="one-time-code"
                value={disableCode}
                onChange={(event) => setDisableCode(event.target.value)}
                disabled={disabling}
                placeholder={t("twoFactorSection.codePlaceholder")}
                required
              />
            </div>
          </div>

          {disableError && (
            <p role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
              <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>{disableError}</span>
            </p>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={disabling}>{t("twoFactorSection.cancel")}</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={disabling || disablePassword.length === 0 || disableCode.length === 0}
              onClick={() => void handleDisable()}
            >
              {disabling && <Spinner />}
              {t("twoFactorSection.confirmDisable")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
