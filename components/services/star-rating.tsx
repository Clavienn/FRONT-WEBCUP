"use client"

import { useState } from "react"
import { Star } from "lucide-react"

import { cn } from "@/lib/utils"

const STARS = [1, 2, 3, 4, 5]

// Étoiles en lecture seule : `value` peut être décimal (moyenne), arrondi à l'étoile la plus proche
export function StarDisplay({ value, className, label }: { value: number; className?: string; label?: string }) {
  const filled = Math.round(value)
  return (
    <span className={cn("inline-flex items-center gap-0.5", className)} role="img" aria-label={label}>
      {STARS.map((star) => (
        <Star
          key={star}
          aria-hidden="true"
          className={cn("size-4", star <= filled ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40")}
        />
      ))}
    </span>
  )
}

// Saisie de la note : groupe de 5 boutons-radio, survol et clavier (flèches) pris en charge
export function StarInput({
  value,
  onChange,
  label,
  starLabel,
}: {
  value: number
  onChange: (value: number) => void
  label: string
  // Libellé accessible de chaque étoile, ex. (n) => `${n} sur 5`
  starLabel: (value: number) => string
}) {
  const [hover, setHover] = useState(0)
  const shown = hover || value

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="flex items-center gap-1"
      onMouseLeave={() => setHover(0)}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight" || event.key === "ArrowUp") onChange(Math.min(5, (value || 0) + 1))
        if (event.key === "ArrowLeft" || event.key === "ArrowDown") onChange(Math.max(1, (value || 2) - 1))
      }}
    >
      {STARS.map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={starLabel(star)}
          tabIndex={value === star || (value === 0 && star === 1) ? 0 : -1}
          className="cursor-pointer rounded p-0.5 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          onMouseEnter={() => setHover(star)}
          onClick={() => onChange(star)}
        >
          <Star
            aria-hidden="true"
            className={cn("size-7 transition-colors", star <= shown ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40")}
          />
        </button>
      ))}
    </div>
  )
}
