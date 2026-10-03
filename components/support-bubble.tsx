"use client"

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react"
import Link from "next/link"
import { CheckCircle2, CircleAlert, LifeBuoy, Send } from "lucide-react"

import { useAuth } from "@/components/auth/auth-provider"
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
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { contactMessageRepository, type ContactReceipt } from "@/repository/contactMessage.repository"

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

export function SupportBubble() {
  const { user, isLoading } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState("")
  const [receipt, setReceipt] = useState<ContactReceipt | null>(null)
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
    setError("")
    setIsOpen(true)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!user || isSending) return

    setError("")
    setIsSending(true)
    try {
      setReceipt(await contactMessageRepository.send({ subject: subject.trim(), message: message.trim() }))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Impossible d’envoyer votre demande.")
    } finally {
      setIsSending(false)
    }
  }

  return (
    <>
      <Button
        type="button"
        size="icon-lg"
        className={`fixed z-40 size-12 rounded-full border border-primary/20 bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-transform hover:scale-105 touch-none cursor-grab active:cursor-grabbing ${position ? "" : "right-5 bottom-5"}`}
        style={position ? { left: position.x, top: position.y } : undefined}
        aria-label="Ouvrir l’aide et contacter le support"
        title="Aide et support · glisser pour déplacer"
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
          {receipt ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CheckCircle2 className="size-5 text-emerald-600" aria-hidden="true" />
                  Demande transmise
                </DialogTitle>
                <DialogDescription>{receipt.confirmation}</DialogDescription>
              </DialogHeader>
              <div className="rounded-xl border border-border/70 bg-muted/40 p-4">
                <p className="text-sm font-medium">{receipt.contactMessage.subject}</p>
                <p className="mt-1 text-xs text-muted-foreground">Référence #{receipt.contactMessage.id}</p>
              </div>
              <DialogFooter>
                <Button type="button" onClick={() => setIsOpen(false)}>Terminer</Button>
              </DialogFooter>
            </>
          ) : isLoading ? (
            <div className="grid min-h-36 place-items-center"><Spinner /></div>
          ) : !user ? (
            <>
              <DialogHeader>
                <DialogTitle>Connectez-vous pour écrire à l’administration</DialogTitle>
                <DialogDescription>
                  Les demandes de support sont associées à votre compte pour permettre leur suivi.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button nativeButton={false} render={<Link href="/connexion" />} onClick={() => setIsOpen(false)}>
                  Se connecter
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Contacter l’administration</DialogTitle>
                <DialogDescription>
                  Décrivez votre question ou la difficulté rencontrée. Une confirmation avec une référence sera affichée après l’envoi.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="support-subject">Sujet</Label>
                  <Input
                    id="support-subject"
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    placeholder="Ex. : difficulté avec une démarche"
                    maxLength={120}
                    minLength={3}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="support-message">Votre message</Label>
                  <Textarea
                    id="support-message"
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Décrivez brièvement le problème rencontré..."
                    maxLength={3000}
                    minLength={10}
                    rows={5}
                    required
                  />
                  <p className="text-xs text-muted-foreground">Votre identité de compte sera jointe à la demande.</p>
                </div>
                {error && (
                  <p role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
                    <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    <span>{error}</span>
                  </p>
                )}
                <DialogFooter>
                  <Button type="submit" disabled={isSending || !subject.trim() || !message.trim()}>
                    {isSending ? <Spinner /> : <Send aria-hidden="true" />}
                    {isSending ? "Envoi en cours..." : "Envoyer à l’administration"}
                  </Button>
                </DialogFooter>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}