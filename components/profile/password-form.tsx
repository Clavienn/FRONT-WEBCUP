"use client"

import { useState, type FormEvent } from "react"
import { CircleAlert, KeyRoundIcon } from "lucide-react"

import { PasswordInput } from "@/components/auth/password-input"
import { useAuth } from "@/components/auth/auth-provider"
import { useLanguage } from "@/components/i18n/language-provider"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import { isPasswordStrong, PasswordRequirements } from "@/components/auth/password-requirements"

export function PasswordForm() {
  const { changePassword } = useAuth()
  const { t } = useLanguage()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    if (newPassword !== confirmPassword) {
      setError(t("passwordForm.errorMismatch"))
      return
    }
    if (!isPasswordStrong(newPassword)) {
      setError(t("passwordForm.errorWeakPassword"))
      return
    }
    if (newPassword === currentPassword) {
      setError(t("passwordForm.errorSameAsOld"))
      return
    }

    setSaving(true)
    try {
      await changePassword({ currentPassword, newPassword })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      toast.add({
        title: t("passwordForm.successTitle"),
        description: t("passwordForm.successDescription"),
        type: "success",
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : t("passwordForm.errorGeneric"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="currentPassword">{t("passwordForm.currentPassword")}</Label>
        <PasswordInput
          id="currentPassword"
          fieldLabel={t("passwordForm.currentPassword")}
          autoComplete="current-password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="newPassword">{t("passwordForm.newPassword")}</Label>
          <PasswordInput
            id="newPassword"
            fieldLabel={t("passwordForm.newPassword")}
            autoComplete="new-password"
            minLength={8}
            aria-invalid={newPassword.length > 0 && !isPasswordStrong(newPassword)}
            aria-describedby="password-requirements"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            required
          />
          <PasswordRequirements password={newPassword} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">{t("passwordForm.confirmPassword")}</Label>
          <PasswordInput
            id="confirmPassword"
            fieldLabel={t("passwordForm.confirmPassword")}
            autoComplete="new-password"
            minLength={8}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={saving || !isPasswordStrong(newPassword)}>
          {saving ? <Spinner /> : <KeyRoundIcon />}
          {t("passwordForm.submit")}
        </Button>
      </div>
    </form>
  )
}
