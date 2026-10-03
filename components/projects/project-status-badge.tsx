import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/components/i18n/language-provider"
import type { ProjectStatus } from "@/repository/project.repository"

const STATUS_CLASS: Record<ProjectStatus, string> = {
  planned: "border-slate-500/30 bg-slate-500/10 text-slate-700 dark:text-slate-300",
  ongoing: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  completed: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
}

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  const { t } = useLanguage()
  return (
    <Badge variant="outline" className={STATUS_CLASS[status]}>
      {t(`projectsList.status.${status}`)}
    </Badge>
  )
}
