"use client"

import { useEffect, useState, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, CircleAlert, ShieldCheck } from "lucide-react"

import { useAuth } from "@/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import type { SignupRole } from "@/repository/auth.repository"

const signupRoles: { value: SignupRole; label: string; hint: string }[] = [
  { value: "citizen", label: "Citoyen", hint: "Demandes et signalements" },
  { value: "agent", label: "Agent", hint: "Console des agents" },
]

type AuthMode = "login" | "register"

export function AuthForm() {
  const router = useRouter()
  const { user, isLoading, signIn, signUp } = useAuth()
  const [mode, setMode] = useState<AuthMode>("login")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<SignupRole>("citizen")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isRegistering = mode === "register"

  useEffect(() => {
    if (!isLoading && user) router.replace("/dashboard")
  }, [isLoading, router, user])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      if (isRegistering) {
        await signUp({
          email,
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          role,
        })
      } else {
        await signIn({ email, password })
      }
      router.replace("/dashboard")
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Une erreur est survenue. Réessayez.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const changeMode = () => {
    setError("")
    setMode(isRegistering ? "login" : "register")
  }

  return (
    <main className="app-atmosphere grid min-h-screen place-items-center px-4 py-10">
      <section className="w-full max-w-110">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-secondary-foreground transition-colors hover:text-primary">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Retour à l’accueil
        </Link>

        <div className="rounded-2xl border border-border/80 bg-card/85 p-6 shadow-[0_16px_48px_rgba(30,55,90,0.08)] backdrop-blur-xl sm:p-8">
          <div className="mb-8 flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-accent text-primary">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold tracking-[0.08em] text-foreground">TERRA NOVA</p>
              <p className="text-xs text-muted-foreground">Console des agents</p>
            </div>
          </div>

          <header className="mb-7 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
              Haut Conseil de Terra Nova
            </p>
            <h1 className="text-3xl font-medium tracking-tight text-foreground">
              {isRegistering ? "Créer un compte" : "Connexion"}
            </h1>
            <p className="text-sm leading-6 text-muted-foreground">
              {isRegistering
                ? "Créez votre accès à la console des agents de Terra Nova."
                : "Connectez-vous pour accompagner les habitants de Terra Nova."}
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegistering && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input
                    id="firstName"
                    autoComplete="given-name"
                    maxLength={100}
                    required
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
                    required
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                  />
                </div>
              </div>
            )}

            {isRegistering && (
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium leading-none">Je suis</legend>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  {signupRoles.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={role === option.value}
                      onClick={() => setRole(option.value)}
                      className={`rounded-xl border px-3 py-2.5 text-left transition-colors ${
                        role === option.value
                          ? "border-primary bg-accent text-foreground"
                          : "border-border bg-card/60 text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      <span className="block text-sm font-semibold">{option.label}</span>
                      <span className="block text-xs">{option.hint}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Adresse e-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                maxLength={255}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="nom@exemple.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                autoComplete={isRegistering ? "new-password" : "current-password"}
                minLength={isRegistering ? 8 : undefined}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              {isRegistering && (
                <p className="text-xs text-muted-foreground">8 caractères minimum.</p>
              )}
            </div>

            {error && (
              <p role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
                <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </p>
            )}

            <Button type="submit" className="h-10 w-full rounded-xl" disabled={isLoading || isSubmitting}>
              {(isLoading || isSubmitting) ? <Spinner /> : null}
              {isLoading
                ? "Vérification de la session..."
                : isSubmitting
                  ? "Veuillez patienter..."
                  : isRegistering
                    ? "Créer mon compte"
                    : "Se connecter"}
              {!isLoading && !isSubmitting && <ArrowRight className="size-4" aria-hidden="true" />}
            </Button>
          </form>

          <p className="mt-6 border-t border-border/70 pt-5 text-center text-sm text-muted-foreground">
            {isRegistering ? "Vous avez déjà un compte ?" : "Vous n’avez pas encore de compte ?"}{" "}
            <button
              type="button"
              onClick={changeMode}
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              {isRegistering ? "Se connecter" : "Créer un compte"}
            </button>
          </p>
        </div>
      </section>
    </main>
  )
}