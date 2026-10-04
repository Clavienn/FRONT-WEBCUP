"use client"

import { useState, type FormEvent } from "react"
import { CircleAlert, Send } from "lucide-react"

import { useFormGuard } from "@/components/forms/form-guard"
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
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { partnerServiceRepository, type PartnerService, type PartnerServiceRequest } from "@/repository/partnerService.repository"

function ContactForm({
  service,
  onClose,
  onSent,
}: {
  service: PartnerService
  onClose: () => void
  onSent: (request: PartnerServiceRequest) => void
}) {
  const { t } = useLanguage()
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [isSending, setIsSending] = useState(false)
  const guard = useFormGuard("partner_request")

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError("")
    setIsSending(true)
    try {
      onSent(await guard.run((headers) => partnerServiceRepository.contact(service.id, message.trim() || null, headers)))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("partnerContact.sendError"))
      setIsSending(false)
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t("partnerContact.dialogTitle", { name: service.name })}</DialogTitle>
        <DialogDescription>
          {service.contactPhone || service.contactEmail
            ? t("partnerContact.dialogDescriptionWithContact")
            : t("partnerContact.dialogDescriptionDefault")}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="grid gap-4">
        {guard.trap}
        <div className="grid gap-2">
          <Label htmlFor="partner-message">{t("partnerContact.messageLabel")}</Label>
          <Textarea
            id="partner-message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={4}
            maxLength={2000}
            placeholder={t("partnerContact.messagePlaceholder")}
          />
        </div>
        {error && (
          <p role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
            <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </p>
        )}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={isSending}>
            {t("partnerContact.cancel")}
          </Button>
          <Button type="submit" disabled={isSending}>
            {isSending ? <Spinner /> : <Send aria-hidden="true" />}
            {t("partnerContact.submit")}
          </Button>
        </DialogFooter>
      </form>
    </>
  )
}

export function PartnerContactDialog({
  service,
  onClose,
  onSent,
}: {
  // null = fermé
  service: PartnerService | null
  onClose: () => void
  onSent: (request: PartnerServiceRequest) => void
}) {
  return (
    <Dialog open={service !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        {service && <ContactForm service={service} onClose={onClose} onSent={onSent} />}
      </DialogContent>
    </Dialog>
  )
}
