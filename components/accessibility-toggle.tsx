"use client"

import { ALargeSmall } from "lucide-react"

import { useLanguage } from "@/components/i18n/language-provider"
import { Button } from "@/components/ui/button"
import { useAccessibility } from "@/hooks/use-accessibility"

const NEXT_LABEL_KEY = {
  normal: "textSizeToggle.activateLarge",
  large: "textSizeToggle.activateXLarge",
  xlarge: "textSizeToggle.activateNormal",
} as const

export function AccessibilityToggle() {
  const { t } = useLanguage()
  const { textSize, cycleTextSize } = useAccessibility()
  const label = t(NEXT_LABEL_KEY[textSize])

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="fixed top-4 right-16 z-40 size-10 rounded-full border-border/80 bg-card/85 shadow-sm backdrop-blur-md"
      onClick={cycleTextSize}
      aria-label={label}
      title={label}
    >
      <ALargeSmall aria-hidden="true" />
    </Button>
  )
}
