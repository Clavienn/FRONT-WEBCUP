"use client"

import { CheckIcon, CircleIcon } from "lucide-react"

import { useLanguage } from "@/components/i18n/language-provider"

export function getPasswordRequirements(password: string) {
  return {
    length: Array.from(password).length >= 8,
    lowercase: /\p{Ll}/u.test(password),
    uppercase: /\p{Lu}/u.test(password),
    number: /\p{N}/u.test(password),
    special: /[^\p{L}\p{N}\s]/u.test(password),
  }
}

export function isPasswordStrong(password: string) {
  return Object.values(getPasswordRequirements(password)).every(Boolean)
}

export function PasswordRequirements({ password }: Readonly<{ password: string }>) {
  const { t } = useLanguage()
  const requirements = getPasswordRequirements(password)
  const items = [
    { key: "length", valid: requirements.length },
    { key: "lowercase", valid: requirements.lowercase },
    { key: "uppercase", valid: requirements.uppercase },
    { key: "number", valid: requirements.number },
    { key: "special", valid: requirements.special },
  ] as const

  return (
    <div id="password-requirements" className="space-y-2 rounded-lg border border-border/70 bg-muted/20 p-3">
      <p className="text-xs font-medium text-foreground">{t("passwordRequirements.title")}</p>
      <ul className="grid gap-1.5 text-xs sm:grid-cols-2">
        {items.map(({ key, valid }) => {
          const Icon = valid ? CheckIcon : CircleIcon
          return (
            <li key={key} className={`flex items-center gap-2 ${valid ? "text-emerald-700 dark:text-emerald-400" : "text-destructive"}`}>
              <Icon className="size-3.5 shrink-0" aria-hidden="true" />
              <span>{t(`passwordRequirements.${key}`)}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}