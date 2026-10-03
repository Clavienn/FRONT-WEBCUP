"use client"

import { useEffect, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, CircleAlert, CircleCheck, ShieldCheck } from "lucide-react"

import { useAuth } from "@/components/auth/auth-provider"
import { Breadcrumb } from "@/components/navigation/breadcrumb"
import { useLanguage } from "@/components/i18n/language-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { isPasswordStrong, PasswordRequirements } from "@/components/auth/password-requirements"
import { ACCOUNT_DELETED_KEY } from "@/components/profile/delete-account-section"
import type { SignupRole } from "@/repository/auth.repository"

const signupRoles: SignupRole[] = ["citizen", "agent"]
const ROLE_DICT_KEY: Record<SignupRole, string> = { citizen: "roleCitizen", agent: "roleAgent" }

type AuthMode = "login" | "register"

export function AuthForm() {
  const router = useRouter()
  const { user, isLoading, signIn, signUp } = useAuth()
  const { t } = useLanguage()
  const [mode, setMode] = useState<AuthMode>("login")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<SignupRole>("citizen")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  // Lu dans l'initialiseur et non dans un effet : le rendu de React peut s'exécuter deux fois en
  // StrictMode, mais le drapeau n'est effacé que par l'effet ci-dessous, donc le message reste.
  const [accountDeleted] = useState(
    () => typeof window !== "undefined" && window.sessionStorage.getItem(ACCOUNT_DELETED_KEY) === "1"
  )
  const isRegistering = mode === "register"

  // Le drapeau ne vaut que pour l'arrivée sur la page : le retirer évite de le revoir plus tard.
  useEffect(() => {
    if (accountDeleted) window.sessionStorage.removeItem(ACCOUNT_DELETED_KEY)
  }, [accountDeleted])

  useEffect(() => {
    if (!isLoading && user) router.replace("/dashboard")
  }, [isLoading, router, user])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    if (isRegistering && !isPasswordStrong(password)) {
      setError(t("authForm.passwordRequirementsError"))
      return
    }
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
      setError(cause instanceof Error ? cause.message : t("authForm.errorGeneric"))
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
        <Breadcrumb
          items={[
            { label: t("nav.accueil"), href: "/" },
            { label: t("breadcrumbs.login") },
          ]}
          className="mb-6"
        />

        {accountDeleted && (
          <p
            role="status"
            className="mb-6 flex items-start gap-2 rounded-xl border border-primary/30 bg-accent px-4 py-3 text-sm text-foreground"
          >
            <CircleCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            <span>{t("authForm.accountDeleted")}</span>
          </p>
        )}

        <div className="rounded-2xl border border-border/80 bg-card/85 p-6 shadow-[0_16px_48px_rgba(30,55,90,0.08)] backdrop-blur-xl sm:p-8">
          <div className="mb-8 flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-accent text-primary">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold tracking-[0.08em] text-foreground">TERRA NOVA</p>
              <p className="text-xs text-muted-foreground">{t("authForm.brandTagline")}</p>
            </div>
          </div>

          <header className="mb-7 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
              {t("authForm.kicker")}
            </p>
            <h1 className="text-3xl font-medium tracking-tight text-foreground">
              {isRegistering ? t("authForm.titleRegister") : t("authForm.titleLogin")}
            </h1>
            <p className="text-sm leading-6 text-muted-foreground">
              {isRegistering ? t("authForm.subtitleRegister") : t("authForm.subtitleLogin")}
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegistering && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">{t("authForm.firstName")}</Label>
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
                  <Label htmlFor="lastName">{t("authForm.lastName")}</Label>
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
                <legend className="text-sm font-medium leading-none">{t("authForm.roleLegend")}</legend>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  {signupRoles.map((value) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={role === value}
                      onClick={() => setRole(value)}
                      className={`rounded-xl border px-3 py-2.5 text-left transition-colors ${
                        role === value
                          ? "border-primary bg-accent text-foreground"
                          : "border-border bg-card/60 text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      <span className="block text-sm font-semibold">{t(`authForm.${ROLE_DICT_KEY[value]}.label`)}</span>
                      <span className="block text-xs">{t(`authForm.${ROLE_DICT_KEY[value]}.hint`)}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">{t("authForm.email")}</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                maxLength={255}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t("authForm.emailPlaceholder")}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t("authForm.password")}</Label>
              <Input
                id="password"
                type="password"
                autoComplete={isRegistering ? "new-password" : "current-password"}
                minLength={isRegistering ? 8 : undefined}
                aria-invalid={isRegistering && password.length > 0 && !isPasswordStrong(password)}
                aria-describedby={isRegistering ? "password-requirements" : undefined}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              {isRegistering && (
                <PasswordRequirements password={password} />
              )}
            </div>

            {error && (
              <p role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
                <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </p>
            )}

            <Button
              type="submit"
              className="h-10 w-full rounded-xl"
              disabled={isLoading || isSubmitting || (isRegistering && !isPasswordStrong(password))}
            >
              {(isLoading || isSubmitting) ? <Spinner /> : null}
              {isLoading
                ? t("authForm.submitChecking")
                : isSubmitting
                  ? t("authForm.submitWait")
                  : isRegistering
                    ? t("authForm.submitCreate")
                    : t("authForm.submitLogin")}
              {!isLoading && !isSubmitting && <ArrowRight className="size-4" aria-hidden="true" />}
            </Button>
          </form>

          <p className="mt-6 border-t border-border/70 pt-5 text-center text-sm text-muted-foreground">
            {isRegistering ? t("authForm.switchHasAccount") : t("authForm.switchNoAccount")}{" "}
            <button
              type="button"
              onClick={changeMode}
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              {isRegistering ? t("authForm.switchToLogin") : t("authForm.switchToRegister")}
            </button>
          </p>
        </div>
      </section>
    </main>
  )
}