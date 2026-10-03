"use client"

import { useState } from "react"
import { useMotionValueEvent } from "framer-motion"

import { useScrollProgress } from "@/components/landing/scroll-sequence"
import { useCountUp } from "@/hooks/use-count-up"
import type { StatItem } from "@/config/landing-content"

const START_THRESHOLD = 0.4

export function Counter({ value, suffix, label }: StatItem) {
  const progress = useScrollProgress()
  const [started, setStarted] = useState(() => progress.get() >= START_THRESHOLD)

  useMotionValueEvent(progress, "change", (latest) => {
    if (latest >= START_THRESHOLD) setStarted(true)
  })

  const formatted = useCountUp(value, started)

  return (
    <div className="flex flex-col gap-2">
      <span className="tn-stat-value">
        {formatted}
        {suffix}
      </span>
      <span className="tn-stat-label">{label}</span>
    </div>
  )
}
