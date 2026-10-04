import { useLanguage } from "@/components/i18n/language-provider"
import { Badge } from "@/components/ui/badge"
import type { AnnouncementStatus } from "@/repository/announcement.repository"

const tones: Record<AnnouncementStatus, string> = {
  published: "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200",
  draft: "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200",
  archived: "text-muted-foreground",
}

export function StatusBadge({ status }: { status: AnnouncementStatus }) {
  const { t } = useLanguage()
  return (
    <Badge variant="outline" className={tones[status]}>
      {t(`announcementHub.status.${status}`)}
    </Badge>
  )
}
