import { useLanguage } from "@/components/i18n/language-provider"

export function ProjectProgressBar({ progress }: { progress: number }) {
  const { t } = useLanguage()
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{t("projectsList.progressLabel")}</span>
        <span className="font-medium tabular-nums text-foreground">{progress}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-accent" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-sky-500" style={{ width: `${progress}%` }} />
      </div>
    </div>
  )
}
