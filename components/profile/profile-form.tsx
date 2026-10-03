"use client"

import { useState, type FormEvent } from "react"
import { SaveIcon } from "lucide-react"

import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import type { AuthUser } from "@/repository/auth.repository"

export function ProfileForm({ user }: Readonly<{ user: AuthUser }>) {
  const { updateProfile } = useAuth()
  const [firstName, setFirstName] = useState(user.firstName ?? "")
  const [lastName, setLastName] = useState(user.lastName ?? "")
  const [email, setEmail] = useState(user.email)
  const [saving, setSaving] = useState(false)

  const hasChanges =
    firstName.trim() !== (user.firstName ?? "") ||
    lastName.trim() !== (user.lastName ?? "") ||
    email.trim().toLowerCase() !== user.email

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    try {
      // Champ vide -> null : le backend efface la valeur
      await updateProfile({
        email: email.trim(),
        firstName: firstName.trim() || null,
        lastName: lastName.trim() || null,
      })
      toast.add({ title: "Profil mis à jour", type: "success" })
    } catch (err) {
      toast.add({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Une erreur est survenue",
        type: "error",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="firstName">Prénom</Label>
          <Input
            id="firstName"
            autoComplete="given-name"
            maxLength={100}
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Nom</Label>
          <Input
            id="lastName"
            autoComplete="family-name"
            maxLength={100}
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Adresse e-mail</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          maxLength={255}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving || !hasChanges}>
          {saving ? <Spinner /> : <SaveIcon />}
          Enregistrer
        </Button>
      </div>
    </form>
  )
}
