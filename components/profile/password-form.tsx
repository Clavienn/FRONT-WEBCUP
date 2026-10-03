"use client"

import { useState, type FormEvent } from "react"
import { CircleAlert, KeyRoundIcon } from "lucide-react"

import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"

export function PasswordForm() {
  const { changePassword } = useAuth()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    if (newPassword !== confirmPassword) {
      setError("Les deux mots de passe ne correspondent pas.")
      return
    }
    if (newPassword === currentPassword) {
      setError("Le nouveau mot de passe doit être différent de l’actuel.")
      return
    }

    setSaving(true)
    try {
      await changePassword({ currentPassword, newPassword })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      toast.add({
        title: "Mot de passe modifié",
        description: "Vos autres sessions ont été déconnectées.",
        type: "success",
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue. Réessayez.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="currentPassword">Mot de passe actuel</Label>
        <Input
          id="currentPassword"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          required
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="newPassword">Nouveau mot de passe</Label>
          <Input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            required
          />
          <p className="text-xs text-muted-foreground">8 caractères minimum.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmation</Label>
          <Input
            id="confirmPassword"
            type="password"
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
        <Button type="submit" disabled={saving}>
          {saving ? <Spinner /> : <KeyRoundIcon />}
          Changer le mot de passe
        </Button>
      </div>
    </form>
  )
}
