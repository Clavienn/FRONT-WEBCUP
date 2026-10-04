"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Compass,
  LifeBuoy,
  ListChecks,
} from "lucide-react";

import { useLanguage } from "@/components/i18n/language-provider";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  guidanceRepository,
  type GuidanceRequest as Guidance,
} from "@/repository/guidanceRequest.repository";

// Même minimum que le serveur : le front valide pour le confort, l'API reste l'autorité
const MIN_LENGTH = 10;

interface GuidancePanelProps {
  onDeposited?: () => void;
  kindSelect?: React.ReactNode;
}

/**
 * Parcours d'aide : l'habitant décrit son problème, la ville désigne le service compétent et
 * la démarche. Le dépôt de la demande dans ce service est proposé juste après, pour ne pas
 * laisser l'orientation s'arrêter à un conseil.
 */
export function GuidancePanel({ onDeposited, kindSelect }: GuidancePanelProps) {
  const { t, locale } = useLanguage();
  const [problem, setProblem] = useState("");
  const [guidance, setGuidance] = useState<Guidance | null>(null);
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSending) return;

    const described = problem.trim();
    if (described.length < MIN_LENGTH)
      return setError(t("guidance.tooShort", { min: MIN_LENGTH }));

    setError("");
    setGuidance(null);
    setIsSending(true);
    try {
      const { guidance: answer } = await guidanceRepository.create(described);
      setGuidance(answer);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : t("guidance.submitError"),
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleDeposit = async () => {
    if (!guidance || isDepositing) return;

    setError("");
    setIsDepositing(true);
    try {
      const { guidance: updated } = await guidanceRepository.deposit(
        guidance.id,
      );
      setGuidance(updated);
      onDeposited?.();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : t("guidance.depositError"),
      );
    } finally {
      setIsDepositing(false);
    }
  };

  const depositDate = (value: string) =>
    new Date(value).toLocaleDateString(locale === "en" ? "en-GB" : "fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-2" noValidate>
        <div className="flex items-end gap-2 rounded-[28px] border border-border/70 bg-muted/60 p-2 pl-5 transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30">
          <LifeBuoy
            className="mb-2.5 size-5 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <textarea
            id="guidance-problem"
            aria-label={t("guidance.label")}
            placeholder={t("guidance.placeholder")}
            rows={1}
            value={problem}
            onChange={(event) => setProblem(event.target.value)}
            maxLength={2000}
            disabled={isSending}
            className="min-h-10 flex-1 resize-none border-0 bg-transparent px-0 shadow-none focus-visible:border-0 focus-visible:ring-0 dark:bg-transparent"
          />
          {kindSelect}
          <Button
            type="submit"
            size="icon-lg"
            className="size-10 rounded-full"
            disabled={isSending}
            aria-label={t("guidance.submitLabel")}
          >
            {isSending ? (
              <Spinner />
            ) : (
              <Compass className="size-5" aria-hidden="true" />
            )}
          </Button>
        </div>

        <div className="flex items-center justify-between gap-3 px-1">
          <p className="text-xs text-muted-foreground">{t("guidance.hint")}</p>
          <p className="text-xs text-muted-foreground tabular-nums">
            {t("ideaBox.counter", { count: problem.trim().length, max: 2000 })}
          </p>
        </div>
      </form>

      {guidance && (
        <section
          aria-label={t("guidance.resultLabel")}
          className="space-y-4 rounded-2xl border border-primary/25 bg-primary/5 p-5"
        >
          {guidance.service ? (
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
                <Compass className="size-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 space-y-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("guidance.resultLabel")}
                </p>
                <p className="text-base font-semibold">
                  {guidance.service.name}
                </p>
                <Link
                  href={`/dashboard/services/detail?id=${guidance.service.id}`}
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary underline-offset-4 hover:underline"
                >
                  {t("guidance.serviceLinkLabel")}
                  <ArrowRight className="size-3" aria-hidden="true" />
                </Link>
              </div>
            </div>
          ) : (
            // Aucun service reconnu : l'orientation s'arrête ici, il lui faut donc une porte de
            // sortie réelle. Le texte seul laisserait l'habitant devant un cul-de-sac.
            <div className="space-y-2">
              <p className="text-sm leading-6 text-muted-foreground">
                {t("guidance.noService")}
              </p>
              <Link
                href="/dashboard/my-requests"
                className="inline-flex items-center gap-1 text-xs font-medium text-primary underline-offset-4 hover:underline"
              >
                {t("guidance.noServiceLink")}
                <ArrowRight className="size-3" aria-hidden="true" />
              </Link>
            </div>
          )}

          {guidance.summary && (
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("guidance.summaryLabel")}
              </p>
              <p className="text-sm leading-6">{guidance.summary}</p>
            </div>
          )}

          {guidance.steps.length > 0 && (
            <div className="space-y-2">
              <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <ListChecks className="size-3.5" aria-hidden="true" />
                {t("guidance.stepsLabel")}
              </p>
              <ol className="space-y-1.5 text-sm leading-6">
                {guidance.steps.map((step, index) => (
                  <li key={index} className="flex gap-2">
                    <span className="tabular-nums text-muted-foreground">
                      {index + 1}.
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {guidance.automatic && (
            <p className="flex items-start gap-2 border-t border-primary/15 pt-3 text-xs leading-5 text-muted-foreground">
              <CircleAlert
                className="mt-0.5 size-3.5 shrink-0"
                aria-hidden="true"
              />
              {t("guidance.automaticNotice")}
            </p>
          )}

          {guidance.service && (
            <div className="border-t border-primary/15 pt-3">
              {guidance.request ? (
                <p className="flex items-start gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2
                    className="mt-0.5 size-4 shrink-0"
                    aria-hidden="true"
                  />
                  {t("guidance.alreadyDeposited", {
                    reference: guidance.request.reference,
                    date: depositDate(guidance.request.depositedAt),
                  })}
                </p>
              ) : (
                <Button onClick={handleDeposit} disabled={isDepositing}>
                  {isDepositing && <Spinner />}
                  {isDepositing
                    ? t("guidance.depositingLabel")
                    : t("guidance.depositLabel")}
                </Button>
              )}
            </div>
          )}
        </section>
      )}

      {error && (
        <p
          role="alert"
          className="flex items-start justify-center gap-2 text-sm text-destructive"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}
