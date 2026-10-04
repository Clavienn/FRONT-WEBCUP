"use client"

// Rendre visible la protection des données administratives, sans la rendre opaque à l'écran.
//
// L'API masque les coordonnées d'un agent en attente de validation (staffAccess côté serveur) mais
// ne le dit pas. Sans rien afficher, un e-mail « a***@exemple.fr » se lit comme une donnée
// abîmée et un téléphone vide comme une information manquante : la protection est alors
// inexistante pour l'agent qui la subit. Ces trois éléments la rendent lisible —
//   - AgentApprovalNotice : ce qui est restreint, et ce qui ne l'est pas (l'agent continue de
//     travailler) ;
//   - ProtectedValue      : une valeur retenue n'affiche pas un tiret de donnée manquante, mais
//     une valeur verrouillée qui explique pourquoi ;
//   - blockedActionHint   : un bouton désactivé dit ce qu'il faudrait pour le débloquer.
// Rien de bloquant à l'écran : la bannière n'interrompt rien, elle explique.

import { useCallback } from "react"
import { Lock, ShieldAlert } from "lucide-react"

import { useAuth } from "@/components/auth/auth-provider"
import { useLanguage } from "@/components/i18n/language-provider"
import { toast } from "@/components/ui/toast"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "cn"
import {
  isMaskedEmail,
  isNotValidatedError,
  isRateLimitError,
  useAgentApproval,
} from "@/lib/agent-approval"
import { AuthApiError } from "@/repository/auth.repository"

/** Le statut de validation du compte agent connecté. Les écrans qui reçoivent des contacts
 *  citoyens appellent `reportContacts` pour l'alimenter ; les autres lisent l'état. */
export function useCurrentAgentApproval() {
  const { user } = useAuth()
  return useAgentApproval(user?.id ?? null)
}

/**
 * Bandeau de la console agent, affiché tant que le compte n'est pas validé.
 *
 * Volontairement informatif et non bloquant : il décrit les trois protections en vigueur et
 * rappelle que le reste du travail reste possible. C'est ce qui distingue « cet écran est
 * restreint » d'« une donnée manque », et c'est lisible en une phrase.
 */
export function AgentApprovalNotice() {
  const { approval } = useCurrentAgentApproval()
  const { t } = useLanguage()

  if (approval !== "pending") return null

  const items = [
    t("agentApproval.banner.masked"),
    t("agentApproval.banner.writes"),
    t("agentApproval.banner.traced"),
  ]

  return (
    <aside
      role="status"
      aria-label={t("agentApproval.banner.title")}
      className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm shadow-sm backdrop-blur-sm"
    >
      <div className="flex items-start gap-3">
        <ShieldAlert className="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
        <div className="min-w-0 space-y-2">
          <p className="font-medium text-amber-900 dark:text-amber-100">{t("agentApproval.banner.title")}</p>
          <p className="text-amber-900/80 dark:text-amber-100/80">{t("agentApproval.banner.lead")}</p>
          <ul className="list-disc space-y-1 pl-5 text-amber-900/80 dark:text-amber-100/80">
            {items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>
    </aside>
  )
}

/**
 * Une donnée personnelle que l'API a pu retenir.
 *
 * - Valeur masquée par le serveur (« a***@exemple.fr ») : on l'affiche telle quelle, marquée comme
 *   restreinte. C'est le signe qu'une protection est active, pas qu'une donnée est cassée.
 * - Champ non transmis (`withheld`) : un cadenas, et non un tiret. Un tiret se lit comme une
 *   information manquante ; seul l'appelant, qui connaît le statut du compte, peut affirmer que
 *   le champ a été retenu. Un champ simplement vide chez un citoyen garde donc son tiret.
 */
export function ProtectedValue({
  value,
  withheld = false,
  className,
}: {
  value: string | null
  withheld?: boolean
  className?: string
}) {
  const { t } = useLanguage()
  const masked = isMaskedEmail(value)

  if (!masked && !withheld) return <span className={className}>{value ?? "—"}</span>

  const title = masked ? t("agentApproval.hidden.maskedTitle") : t("agentApproval.hidden.withheldTitle")
  const description = masked
    ? t("agentApproval.hidden.maskedDescription")
    : t("agentApproval.hidden.withheldDescription")

  return (
    <TooltipProvider delay={200}>
      <Tooltip>
        <TooltipTrigger
          render={<span className={cn("inline-flex items-center gap-1.5", className)} />}
          aria-label={`${masked ? value : t("agentApproval.hidden.label")} — ${title}`}
        >
          {masked && <span className="truncate">{value}</span>}
          <Lock className="size-3 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
        </TooltipTrigger>
        <TooltipContent>
          <span className="font-medium">{title}</span>
          <span className="opacity-80"> — {description}</span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/**
 * Raison affichée sur un bouton rendu inactif pour cause de validation en attente.
 * Renvoie null quand le compte est validé : le bouton redevient normalement actif.
 */
export function useBlockedActionHint(action: "edit" | "status") {
  const { approval } = useCurrentAgentApproval()
  const { t } = useLanguage()
  if (approval !== "pending") return null
  return t("agentApproval.blockedAction.description", { action: t(`agentApproval.blockedAction.${action}`) })
}

/**
 * Signale un refus de l'API à l'agent, et en profite pour affiner le statut du compte.
 *
 * Deux refus méritent un message propre, parce que tous deux sont une protection qui vient de
 * s'exercer et non une panne :
 *   - `agent_not_validated` (403) : preuve directe que le compte attend sa validation. Le statut
 *     passe alors de « déduit » à « connu », et le bouton reste désactivé au lieu d'échouer à
 *     chaque clic ;
 *   - `sensitive_rate_limited` (429) : le plafond de consultations est atteint. Le délai est
 *     annoncé, sinon l'agent lit un échec alors que l'opération est simplement trop rapprochée.
 */
export function useApprovalErrorToast() {
  const { t } = useLanguage()
  const { reportDenial } = useCurrentAgentApproval()

  return useCallback(
    (cause: unknown, errorTitle: string, action?: "edit" | "status") => {
      if (isNotValidatedError(cause)) {
        reportDenial()
        toast.add({
          title: t("agentApproval.errors.notValidatedTitle"),
          description: t("agentApproval.blockedAction.description", {
            action: t(`agentApproval.blockedAction.${action ?? "edit"}`),
          }),
          type: "caution",
        })
        return
      }

      if (isRateLimitError(cause)) {
        const seconds =
          cause instanceof AuthApiError && cause.retryAfterMs
            ? Math.max(1, Math.ceil(cause.retryAfterMs / 1000))
            : null
        toast.add({
          title: t("agentApproval.errors.rateLimitedTitle"),
          // Sans délai exploitable (en-tête absent), on donne le motif plutôt qu'un compte à rebours faux
          description: seconds
            ? t("agentApproval.errors.rateLimitedDescription", { seconds })
            : t("agentApproval.errors.retryIn", { seconds: "…" }),
          type: "caution",
        })
        return
      }

      toast.add({
        title: errorTitle,
        description: cause instanceof Error ? cause.message : t("citizenAccounts.errorGeneric"),
        type: "error",
      })
    },
    [t, reportDenial]
  )
}