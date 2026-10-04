"use client"

import { useEffect, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { ShieldAlert, ArrowRight, CircleAlert, CircleCheck } from "lucide-react"

import { BrandMark } from "@/components/brand/brand-mark"
import { BRAND_NAME } from "@/config/brand"
import { useAuth } from "@/components/auth/auth-provider"
import { useFormGuard } from "@/components/forms/form-guard"
import type { Locale } from "@/lib/i18n/types"
import { startVisitorSession } from "@/lib/visitor-session"
import { LegalDocumentDialog } from "@/components/legal/legal-document-dialog"
import { PasswordInput } from "@/components/auth/password-input"
import { Breadcrumb } from "@/components/navigation/breadcrumb"
import { useLanguage } from "@/components/i18n/language-provider"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { isPasswordStrong, PasswordRequirements } from "@/components/auth/password-requirements"
import { AuthApiError, type SignupRole } from "@/repository/auth.repository"
import { formatCountdown, useLoginThrottle } from "@/components/auth/use-login-throttle"
import { isTwoFactorChallenge, type SignupRole } from "@/repository/auth.repository"
import { SESSION_EXPIRED_KEY } from "@/components/auth/idle-logout"
import { ACCOUNT_DELETED_KEY } from "@/components/profile/delete-account-section"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"

const signupRoles: SignupRole[] = ["citizen", "agent"]
const ROLE_DICT_KEY: Record<SignupRole, string> = { citizen: "roleCitizen", agent: "roleAgent" }


type AuthMode = "login" | "register"

export function AuthForm() {
  const router = useRouter()
  const { user, isLoading, signIn, signUp, completeTwoFactorLogin } = useAuth()
  const { locale, setLocale, t } = useLanguage()
  const [mode, setMode] = useState<AuthMode>("login")
  // Mot de passe validé mais double authentification requise : challengeToken identifie la tentative
  // auprès du serveur, le reste de la page passe à la saisie du code à 6 chiffres.
  const [twoFactorChallenge, setTwoFactorChallenge] = useState<{ challengeToken: string } | null>(null)
  const [twoFactorCode, setTwoFactorCode] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [acceptedLegal, setAcceptedLegal] = useState(false)
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false)
  const [role, setRole] = useState<SignupRole>("citizen")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isVisitorSetup, setIsVisitorSetup] = useState(false)
  const [visitorLocale, setVisitorLocale] = useState<Locale>(locale)
  const [visitorError, setVisitorError] = useState("")
  // Lu dans l'initialiseur et non dans un effet : le rendu de React peut s'exécuter deux fois en
  // StrictMode, mais le drapeau n'est effacé que par l'effet ci-dessous, donc le message reste.
  const [accountDeleted] = useState(
    () => typeof window !== "undefined" && window.sessionStorage.getItem(ACCOUNT_DELETED_KEY) === "1"
  )
  // Session fermée automatiquement après une longue inactivité : on l'explique à l'arrivée sur la page
  const [sessionExpired] = useState(
    () => typeof window !== "undefined" && window.sessionStorage.getItem(SESSION_EXPIRED_KEY) === "1"
  )
  const isRegistering = mode === "register"
  // Un jeton par formulaire : renouvelé quand on passe de la connexion à l'inscription
  const guard = useFormGuard(isRegistering ? "register" : "login")
  // Friction progressive après plusieurs mots de passe faux, et blocage annoncé par le serveur (voir use-login-throttle)
  const throttle = useLoginThrottle()
  const locked = !isRegistering && throttle.secondsLeft > 0

  // Le drapeau ne vaut que pour l'arrivée sur la page : le retirer évite de le revoir plus tard.
  useEffect(() => {
    if (accountDeleted) window.sessionStorage.removeItem(ACCOUNT_DELETED_KEY)
  }, [accountDeleted])

  useEffect(() => {
    if (sessionExpired) window.sessionStorage.removeItem(SESSION_EXPIRED_KEY)
  }, [sessionExpired])

  useEffect(() => {
    if (!isLoading && user) router.replace("/dashboard")
  }, [isLoading, router, user])

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (locked) return
    setError("")
    if (isRegistering && !isPasswordStrong(password)) {
      setError(t("authForm.passwordRequirementsError"))
      return
    }
    if (isRegistering && (!acceptedLegal || !acceptedPrivacy)) {
      setError(t("authForm.legalConsentRequired"))
      return
    }
    setIsSubmitting(true)

    try {
      const result = await guard.run((headers) =>
        isRegistering
          ? signUp({ email, password, firstName: firstName.trim(), lastName: lastName.trim(), role }, headers)
          : signIn({ email, password }, headers)
      )
      if (!isRegistering) throttle.recordSuccess()
      router.replace("/dashboard")
    } catch (cause) {
      if (!isRegistering && cause instanceof AuthApiError) {
        // 429 bot_blocked : adresse bloquée par le serveur ; 401 : mot de passe ou identifiant incorrect
        if (cause.status === 429 && cause.code === "bot_blocked") throttle.recordServerBlock(cause.retryAfterMs)
        else if (cause.status === 401) throttle.recordFailure()
      }
      setError(cause instanceof Error ? cause.message : t("authForm.errorGeneric"))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTwoFactorSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!twoFactorChallenge) return
    setError("")
    setIsSubmitting(true)
    try {
      await completeTwoFactorLogin(twoFactorChallenge.challengeToken, twoFactorCode)
      router.replace("/dashboard")
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("authForm.errorGeneric"))
    } finally {
      setIsSubmitting(false)
    }
  }

  const cancelTwoFactor = () => {
    setTwoFactorChallenge(null)
    setTwoFactorCode("")
    setError("")
  }

  const changeMode = () => {
    setError("")
    setIsVisitorSetup(false)
    setAcceptedLegal(false)
    setAcceptedPrivacy(false)
    setMode(isRegistering ? "login" : "register")
  }

  const startVisitorAccess = () => {
    setVisitorError("")
    if (!startVisitorSession()) {
      setVisitorError(t("visitor.sessionUnavailable"))
      return
    }
    setLocale(visitorLocale)
    router.push("/visiteur")
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

        {sessionExpired && (
          <p
            role="status"
            className="mb-6 flex items-start gap-2 rounded-xl border border-primary/30 bg-accent px-4 py-3 text-sm text-foreground"
          >
            <CircleCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            <span>{t("authForm.sessionExpired")}</span>
          </p>
        )}

        {accountDeleted && (
          <p
            role="status"
            className="mb-6 flex items-start gap-2 rounded-xl border border-primary/30 bg-accent px-4 py-3 text-sm text-foreground"
          >
            <CircleCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
            <span>{t("authForm.accountDeleted")}</span>
          </p>
        )}

        <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card/90 p-6 shadow-[0_16px_48px_rgba(15,28,50,0.12)] backdrop-blur-xl sm:p-8">
          {/* Futuristic colony terminal top bar */}
          <div className="mb-6 flex items-center justify-between border-b border-border/60 pb-3 text-[11px] font-mono tracking-wider text-muted-foreground">
            <span className="flex items-center gap-1.5 font-medium text-primary">
              <span className="inline-block size-2 rounded-full bg-cyan-400 animate-pulse" />
              TERMINAL CITOYEN // DÔME-01
            </span>
            <span className="hidden sm:inline text-xs uppercase tracking-widest text-muted-foreground/80">
              STATION ST-TERRA
            </span>
          </div>

          <div className="mb-6 flex items-center gap-3">
            <BrandMark className="w-10 text-primary" />
            <div>
              <p className="font-display text-base font-bold tracking-[0.15em] text-foreground uppercase">
                {BRAND_NAME}
              </p>
              <p className="text-xs text-muted-foreground">{t("authForm.brandTagline")}</p>
            </div>
          </div>

          {twoFactorChallenge ? (
            <>
              <header className="mb-7 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
                  {t("authForm.kicker")}
                </p>
                <h1 className="text-3xl font-medium tracking-tight text-foreground">
                  {t("authForm.twoFactor.title")}
                </h1>
                <p className="text-sm leading-6 text-muted-foreground">{t("authForm.twoFactor.subtitle")}</p>
              </header>

              <form onSubmit={handleTwoFactorSubmit} className="space-y-5">
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={twoFactorCode}
                    onChange={setTwoFactorCode}
                    autoFocus
                    inputMode="numeric"
                  >
                    <InputOTPGroup>
                      {Array.from({ length: 6 }, (_, index) => (
                        <InputOTPSlot key={index} index={index} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <p className="text-center text-xs text-muted-foreground">{t("authForm.twoFactor.recoveryHint")}</p>

                {error && (
                  <p role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
                    <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    <span>{error}</span>
                  </p>
                )}

                <Button type="submit" className="h-10 w-full rounded-xl" disabled={isSubmitting || twoFactorCode.trim().length < 6}>
                  {isSubmitting ? <Spinner /> : null}
                  {isSubmitting ? t("authForm.submitWait") : t("authForm.twoFactor.submit")}
                </Button>
                <Button type="button" variant="ghost" className="w-full" disabled={isSubmitting} onClick={cancelTwoFactor}>
                  {t("authForm.twoFactor.back")}
                </Button>
              </form>
            </>
          ) : (
            <>
          <header className="mb-7 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
              {t("authForm.kicker")}
            </p>
            <h1 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {isRegistering ? t("authForm.titleRegister") : t("authForm.titleLogin")}
            </h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {isRegistering ? t("authForm.subtitleRegister") : t("authForm.subtitleLogin")}
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-5">
            {guard.trap}
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

            {isRegistering && (
              <fieldset className="space-y-3 rounded-xl border border-border/70 bg-background/50 p-4">
                <legend className="px-1 text-sm font-medium">{t("authForm.legalConsentTitle")}</legend>
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="accept-legal-terms"
                    checked={acceptedLegal}
                    aria-required="true"
                    onCheckedChange={(checked) => setAcceptedLegal(checked === true)}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="accept-legal-terms" className="cursor-pointer leading-5">
                      {t("authForm.acceptLegal")}
                    </Label>
                    <LegalDocumentDialog kind="legal" className="text-sm font-medium text-primary hover:underline">
                      {t("authForm.readLegal")}
                    </LegalDocumentDialog>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="accept-privacy-policy"
                    checked={acceptedPrivacy}
                    aria-required="true"
                    onCheckedChange={(checked) => setAcceptedPrivacy(checked === true)}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="accept-privacy-policy" className="cursor-pointer leading-5">
                      {t("authForm.acceptPrivacy")}
                    </Label>
                    <LegalDocumentDialog kind="privacy" className="text-sm font-medium text-primary hover:underline">
                      {t("authForm.readPrivacy")}
                    </LegalDocumentDialog>
                  </div>
                </div>
                <p className="text-xs leading-5 text-muted-foreground">{t("authForm.legalConsentHint")}</p>
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
              <PasswordInput
                id="password"
                fieldLabel={t("authForm.password")}
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

            {locked && (
              <p
                role="status"
                className="flex items-start gap-2 rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-2.5 text-sm"
              >
                <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden="true" />
                <span>
                  {throttle.serverBlocked
                    ? t("authForm.throttle.blocked", { time: formatCountdown(throttle.secondsLeft) })
                    : t("authForm.throttle.wait", { time: formatCountdown(throttle.secondsLeft) })}
                </span>
              </p>
            )}

            <Button
              type="submit"
              className="h-10 w-full rounded-xl"
              disabled={
                isLoading ||
                isSubmitting ||
                locked ||
                (isRegistering && (!isPasswordStrong(password) || !acceptedLegal || !acceptedPrivacy))
              }
            >
              {(isLoading || isSubmitting) ? <Spinner /> : null}
              {isLoading
                ? t("authForm.submitChecking")
                : isSubmitting
                  ? t("authForm.submitWait")
                  : locked
                    ? t("authForm.throttle.retryIn", { time: formatCountdown(throttle.secondsLeft) })
                    : isRegistering
                      ? t("authForm.submitCreate")
                      : t("authForm.submitLogin")}
              {!isLoading && !isSubmitting && !locked && <ArrowRight className="size-4" aria-hidden="true" />}
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

          <section className="mt-5 border-t border-border/70 pt-5">
            {isVisitorSetup ? (
              <div className="space-y-4">
                <div>
                  <h2 className="font-medium text-foreground">{t("visitor.accessTitle")}</h2>
                  <p className="mt-1 text-sm leading-5 text-muted-foreground">{t("visitor.accessDescription")}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="visitor-language">{t("visitor.languageQuestion")}</Label>
                  <select
                    id="visitor-language"
                    value={visitorLocale}
                    onChange={(event) => setVisitorLocale(event.currentTarget.value as Locale)}
                    className="h-10 w-full rounded-[10px] border border-input bg-card/75 px-3 text-base text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                  >
                    <option value="fr">{t("visitor.languageFrench")}</option>
                    <option value="en">{t("visitor.languageEnglish")}</option>
                  </select>
                </div>
                <p className="text-xs leading-5 text-muted-foreground">{t("visitor.readOnlyDuration")}</p>
                {visitorError && <p role="alert" className="text-sm text-destructive">{visitorError}</p>}
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button type="button" onClick={startVisitorAccess} className="flex-1">
                    {t("visitor.start")}
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setIsVisitorSetup(false)}>
                    {t("visitor.back")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm text-muted-foreground">{t("visitor.invitation")}</p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-3 w-full"
                  onClick={() => {
                    setVisitorLocale(locale)
                    setVisitorError("")
                    setIsVisitorSetup(true)
                  }}
                >
                  {t("visitor.enterAsVisitor")}
                </Button>
              </div>
            )}
          </section>
            </>
          )}
        </div>
      </section>
    </main>
  )
}