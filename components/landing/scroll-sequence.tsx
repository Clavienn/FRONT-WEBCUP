"use client"

import { createContext, useContext, useEffect, useRef } from "react"
import type { CSSProperties, ReactNode } from "react"
import { useMotionValue, type MotionValue } from "framer-motion"

import { createFrameLoader } from "@/lib/frame-loader"
import { isConstrainedConnection } from "@/lib/network"
import { cn } from "@/lib/utils"

const ScrollProgressContext = createContext<MotionValue<number> | null>(null)

/** 0..1 progress through the nearest ancestor ScrollSequence's pinned track. */
export function useScrollProgress() {
  const progress = useContext(ScrollProgressContext)
  if (!progress) {
    throw new Error("useScrollProgress must be used within a ScrollSequence overlay")
  }
  return progress
}

interface ScrollSequenceProps {
  frames: string[]
  /** Height of the pinned scroll track, in viewport heights. */
  scrollLengthVh?: number
  /** Easing rate toward the target frame. Higher = tighter follow. */
  smoothing?: number
  maxDpr?: number
  id?: string
  ariaLabel?: string
  className?: string
  scrimClassName?: string
  /** Rendered inside the sticky stage, above the scrim. */
  overlay?: ReactNode
  /** Rendered in the tall (non-sticky) track, e.g. in-page anchor markers for nav/scroll-spy. */
  anchors?: ReactNode
}

const MAX_CANVAS_PIXELS = 3840 * 2160

export function ScrollSequence({
  frames,
  scrollLengthVh = 4,
  smoothing = 12,
  maxDpr = 2,
  id,
  ariaLabel,
  className,
  scrimClassName,
  overlay = null,
  anchors = null,
}: ScrollSequenceProps) {
  const sectionRef = useRef<HTMLElement | null>(null)
  const stageRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const progress = useMotionValue(0)

  useEffect(() => {
    const section = sectionRef.current
    const stage = stageRef.current
    const canvas = canvasRef.current
    if (!section || !stage || !canvas) return

    // Économie de données ou 2G : une image sur trois suffit à garder l'effet, pour un tiers du poids
    const constrained = isConstrainedConnection()
    const sequence = constrained ? frames.filter((_, index) => index % 3 === 0 || index === frames.length - 1) : frames

    const total = sequence.length
    if (total === 0) return

    const ctx = canvas.getContext("2d", { alpha: false })
    if (!ctx) return

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")

    let raf = 0
    let lastTime = 0
    let dirty = true
    let smoothed = 0
    let target = 0
    let lastIndex = -1
    let travel = 1
    let cssWidth = 0
    let cssHeight = 0

    const draw = (index: number): boolean => {
      const image = loader.get(index)
      if (!image || image.naturalWidth === 0) return false

      // object-fit: cover, computed by hand so the aspect ratio survives.
      const scale = Math.max(cssWidth / image.naturalWidth, cssHeight / image.naturalHeight)
      const width = image.naturalWidth * scale
      const height = image.naturalHeight * scale

      ctx.drawImage(image, (cssWidth - width) / 2, (cssHeight - height) / 2, width, height)
      dirty = false
      return true
    }

    const schedule = () => {
      if (raf === 0) raf = requestAnimationFrame(tick)
    }

    function tick(now: number) {
      raf = 0
      const dt = lastTime === 0 ? 1 / 60 : Math.min((now - lastTime) / 1000, 0.05)
      lastTime = now

      if (reduced.matches) {
        smoothed = target
      } else {
        // Frame-rate independent exponential smoothing.
        const next = smoothed + (target - smoothed) * (1 - Math.exp(-smoothing * dt))
        smoothed = Math.abs(target - next) < 0.0002 ? target : next
      }

      const index = Math.min(Math.max(Math.round(smoothed * (total - 1)), 0), total - 1)
      if (index !== lastIndex || dirty) {
        if (draw(index)) lastIndex = index
      }
      progress.set(smoothed)

      // Idle out rather than burning rAF all session: stop once the easing has
      // caught up, and stop for good when the only thing left to draw is a
      // frame that already failed.
      if (smoothed === target && !dirty) {
        lastTime = 0
        return
      }
      if (dirty && loader.isSettled()) {
        lastTime = 0
        return
      }
      schedule()
    }

    const loader = createFrameLoader(sequence, {
      concurrency: constrained ? 2 : 6,
      priorityCount: Math.min(4, total),
      onSettled: () => {
        dirty = true
        schedule()
      },
    })

    const measure = () => {
      const stageHeight = stage.offsetHeight
      travel = Math.max(section.offsetHeight - stageHeight, 1)
      cssWidth = stage.clientWidth
      cssHeight = stageHeight
    }

    const resize = () => {
      // Cap the backing store: a 4K display at dpr 2 is already 33M pixels.
      const dpr = Math.min(window.devicePixelRatio || 1, maxDpr)
      const width = stage.clientWidth
      const height = stage.offsetHeight
      const budget = Math.sqrt(MAX_CANVAS_PIXELS / Math.max(width * height, 1))
      const scale = Math.min(dpr, budget)

      const pixelWidth = Math.max(1, Math.round(width * scale))
      const pixelHeight = Math.max(1, Math.round(height * scale))
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth
        canvas.height = pixelHeight
      }
      ctx.setTransform(scale, 0, 0, scale, 0, 0)

      measure()
      dirty = true
      schedule()
    }

    const onScroll = () => {
      // Read-only: the draw happens in rAF, so this never forces a sync layout.
      const rect = section.getBoundingClientRect()
      const nextTarget = Math.min(Math.max(-rect.top / travel, 0), 1)
      target = nextTarget
      loader.focus(Math.round(nextTarget * (total - 1)))
      schedule()
    }

    const observer = new ResizeObserver(resize)
    observer.observe(stage)
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", resize)

    resize()
    onScroll()

    return () => {
      if (raf !== 0) cancelAnimationFrame(raf)
      observer.disconnect()
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", resize)
      loader.dispose()
    }
  }, [frames, smoothing, maxDpr, progress])

  return (
    <section
      ref={sectionRef}
      id={id}
      aria-label={ariaLabel}
      className={cn("tn-scrollseq", className)}
      style={{ "--tn-scrollseq-length": scrollLengthVh } as CSSProperties}
    >
      {anchors}
      <div ref={stageRef} className="tn-scrollseq__stage">
        <canvas ref={canvasRef} className="tn-scrollseq__canvas" aria-hidden="true" />
        <div className={cn("tn-scrollseq__scrim", scrimClassName)} aria-hidden="true" />
        {overlay && (
          <ScrollProgressContext.Provider value={progress}>
            <div className="tn-scrollseq__overlay">{overlay}</div>
          </ScrollProgressContext.Provider>
        )}
      </div>
    </section>
  )
}
