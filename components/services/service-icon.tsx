"use client"

import { Landmark } from "lucide-react"
import { DynamicIcon, type IconName } from "lucide-react/dynamic"

// Le backend stocke un nom d'icône Lucide en kebab-case (ex. "heart-pulse") ; icône par défaut si absent ou inconnu
export function ServiceIcon({ name, className }: { name: string | null; className?: string }) {
  const fallback = <Landmark className={className} aria-hidden="true" />
  if (!name) return fallback
  return <DynamicIcon name={name as IconName} className={className} aria-hidden="true" fallback={() => fallback} />
}
