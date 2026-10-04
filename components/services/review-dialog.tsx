"use client"

import { useState, type FormEvent } from "react"
import { CircleAlert, Send } from "lucide-react"

import { useLanguage } from "@/components/i18n/language-provider"
import { useFormGuard } from "@/components/forms/form-guard"
import { StarInput } from "@/components/services/star-rating"
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
import { serviceRepository, type MyServiceReview } from "@/repository/service.repository"

// Formulaire monté à chaque ouverture du dialogue : son état repart donc de zéro
function ReviewForm({
  service,
  onClose,
  onSubmitted,
}: {
  service: { id: number; name: string }
  onClose: () => void
  onSubmitted: (review: MyServiceReview) => void
}) {
  const { t } = useLanguage()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [error, setError] = useState("")
  const [isSending, setIsSending] = useState(false)
  const guard = useFormGuard("review")

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (rating < 1) {
      setError(t("serviceReviews.ratingRequired"))
      return
    }
    setError("")
    setIsSending(true)
    try {
      onSubmitted(await guard.run((headers) => serviceRepository.createReview(service.id, { rating, comment: comment.trim() }, headers)))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("serviceReviews.sendError"))
      setIsSending(false)
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t("serviceReviews.dialogTitle", { name: service.name })}</DialogTitle>
        <DialogDescription>{t("serviceReviews.dialogDescription")}</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="grid gap-4">
        {guard.trap}
        <div className="grid gap-2">
          <Label>{t("serviceReviews.ratingLabel")}</Label>
          <StarInput
            value={rating}
            onChange={setRating}
            label={t("serviceReviews.ratingLabel")}
            starLabel={(value) => t("serviceReviews.starsAria", { count: value })}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="review-comment">{t("serviceReviews.commentLabel")}</Label>
          <Textarea
            id="review-comment"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            rows={5}
            minLength={3}
            maxLength={2000}
            required
            placeholder={t("serviceReviews.commentPlaceholder")}
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
            {t("serviceReviews.cancel")}
          </Button>
          <Button type="submit" disabled={isSending}>
            {isSending ? <Spinner /> : <Send aria-hidden="true" />}
            {t("serviceReviews.submit")}
          </Button>
        </DialogFooter>
      </form>
    </>
  )
}

export function ReviewDialog({
  service,
  onClose,
  onSubmitted,
}: {
  // null = fermé
  service: { id: number; name: string } | null
  onClose: () => void
  onSubmitted: (review: MyServiceReview) => void
}) {
  return (
    <Dialog open={service !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        {service && <ReviewForm service={service} onClose={onClose} onSubmitted={onSubmitted} />}
      </DialogContent>
    </Dialog>
  )
}
