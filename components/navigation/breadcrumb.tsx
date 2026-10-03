"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"

import { useLanguage } from "@/components/i18n/language-provider"
import { cn } from "@/lib/utils"

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  tone?: "default" | "landing"
  className?: string
}

// Le dernier item représente toujours la page courante et reste non cliquable.
export function Breadcrumb({ items, tone = "default", className }: Readonly<BreadcrumbProps>) {
  const { t } = useLanguage()
  if (items.length === 0) return null

  const linkTone = tone === "landing"
    ? "text-[var(--tn-text-muted)] hover:text-[var(--tn-text)]"
    : "text-muted-foreground hover:text-foreground"
  const currentTone = tone === "landing" ? "text-[var(--tn-text)]" : "text-foreground"

  return (
    <nav
      aria-label={t("breadcrumbs.ariaLabel")}
      className={cn("min-w-0 max-w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", className)}
    >
      <ol className="flex w-max min-w-full items-center gap-2 py-1 text-sm">
        {items.map((item, index) => {
          const isCurrent = index === items.length - 1
          const content = isCurrent ? (
            <span
              aria-current="page"
              className={cn("max-w-[min(55vw,22rem)] truncate font-semibold", currentTone)}
              title={item.label}
            >
              {item.label}
            </span>
          ) : item.href ? (
            <Link href={item.href} className={cn("max-w-[min(40vw,16rem)] truncate transition-colors", linkTone)} title={item.label}>
              {item.label}
            </Link>
          ) : (
            <span className="max-w-[min(40vw,16rem)] truncate text-muted-foreground" title={item.label}>
              {item.label}
            </span>
          )

          return (
            <li key={`${item.href ?? item.label}-${index}`} className="flex shrink-0 items-center gap-2">
              {index > 0 && <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/70" aria-hidden="true" />}
              {content}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}