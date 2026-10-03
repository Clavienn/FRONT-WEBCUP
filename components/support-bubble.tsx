"use client"

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react"
import { LifeBuoy, Send } from "lucide-react"

import { useLanguage } from "@/components/i18n/language-provider"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface DragState {
  pointerId: number
  startX: number
  startY: number
  startLeft: number
  startTop: number
  width: number
  height: number
  moved: boolean
}

const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim()

export function SupportBubble() {
  const { t } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null)
  const dragState = useRef<DragState | null>(null)
  const suppressClick = useRef(false)

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return

    const bounds = event.currentTarget.getBoundingClientRect()
    dragState.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startLeft: bounds.left,
      startTop: bounds.top,
      width: bounds.width,
      height: bounds.height,
      moved: false,
    }
    suppressClick.current = false
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragState.current
    if (!drag || drag.pointerId !== event.pointerId) return

    const deltaX = event.clientX - drag.startX
    const deltaY = event.clientY - drag.startY
    if (!drag.moved && Math.hypot(deltaX, deltaY) < 6) return

    drag.moved = true
    suppressClick.current = true
    setPosition({
      x: Math.min(Math.max(12, drag.startLeft + deltaX), window.innerWidth - drag.width - 12),
      y: Math.min(Math.max(12, drag.startTop + deltaY), window.innerHeight - drag.height - 12),
    })
  }

  const handlePointerEnd = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (dragState.current?.pointerId === event.pointerId) dragState.current = null
  }

  const handleClick = () => {
    if (suppressClick.current) {
      suppressClick.current = false
      return
    }
    setIsOpen(true)
  }

  const mailtoHref = SUPPORT_EMAIL
    ? `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(t("supportBubble.mailSubject"))}&body=${encodeURIComponent(message.trim())}`
    : undefined

  return (
    <>
      <Button
        type="button"
        size="icon-lg"
        className={`fixed z-40 size-12 rounded-full border border-primary/20 bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-transform hover:scale-105 touch-none cursor-grab active:cursor-grabbing ${position ? "" : "right-5 bottom-5"}`}
        style={position ? { left: position.x, top: position.y } : undefined}
        aria-label={t("supportBubble.openAriaLabel")}
        title={t("supportBubble.dragTitle")}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onClick={handleClick}
      >
        <LifeBuoy aria-hidden="true" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("supportBubble.dialogTitle")}</DialogTitle>
            <DialogDescription>
              {t("supportBubble.dialogDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2">
            <Label htmlFor="support-message">{t("supportBubble.messageLabel")}</Label>
            <Textarea
              id="support-message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={t("supportBubble.messagePlaceholder")}
              maxLength={2000}
              rows={5}
            />
            <p className="text-xs text-muted-foreground">
              {SUPPORT_EMAIL
                ? t("supportBubble.emailConfigured", { email: SUPPORT_EMAIL })
                : t("supportBubble.emailNotConfigured")}
            </p>
          </div>

          <DialogFooter>
            {mailtoHref ? (
              <Button nativeButton={false} render={<a href={mailtoHref} />} disabled={!message.trim()}>
                <Send aria-hidden="true" />
                {t("supportBubble.submit")}
              </Button>
            ) : (
              <Button disabled>
                <Send aria-hidden="true" />
                {t("supportBubble.submit")}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}