"use client"

import { useEffect, useState } from "react"

const numberFormatter = new Intl.NumberFormat("fr-FR")

export function useCountUp(target: number, start: boolean, duration = 1600) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!start) return

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches
    const effectiveDuration = prefersReducedMotion ? 1 : duration

    let frame: number
    const startTime = performance.now()

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / effectiveDuration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(target * eased))
      if (progress < 1) {
        frame = requestAnimationFrame(tick)
      }
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [start, target, duration])

  return numberFormatter.format(value)
}
