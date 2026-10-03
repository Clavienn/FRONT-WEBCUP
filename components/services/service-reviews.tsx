"use client"

import { useCallback, useEffect, useState } from "react"
import { CircleAlert, MessageSquareText } from "lucide-react"

import { useLanguage } from "@/components/i18n/language-provider"
import { StarDisplay } from "@/components/services/star-rating"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { serviceRepository, type ServiceReview } from "@/repository/service.repository"

const PAGE_SIZE = 5

const formatDate = (value: string) => new Date(value).toLocaleDateString("fr-FR", { dateStyle: "long" })

// Avis des citoyens sur un service : moyenne, nombre et liste paginée côté serveur
export function ServiceReviews({ serviceId }: { serviceId: number }) {
  const { t } = useLanguage()
  const [reviews, setReviews] = useState<ServiceReview[] | null>(null)
  const [total, setTotal] = useState(0)
  const [average, setAverage] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const [error, setError] = useState("")
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  useEffect(() => {
    let mounted = true
    serviceRepository
      .listReviews(serviceId, 1, PAGE_SIZE)
      .then((data) => {
        if (!mounted) return
        setReviews(data.reviews)
        setTotal(data.total)
        setAverage(data.averageRating)
        setPage(1)
      })
      .catch((cause) => mounted && setError(cause instanceof Error ? cause.message : t("serviceDetail.loadError")))
    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-fetch uniquement sur changement de service
  }, [serviceId])

  const loadMore = useCallback(async () => {
    setIsLoadingMore(true)
    try {
      const data = await serviceRepository.listReviews(serviceId, page + 1, PAGE_SIZE)
      setReviews((current) => [...(current ?? []), ...data.reviews])
      setPage(page + 1)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("serviceDetail.loadError"))
    } finally {
      setIsLoadingMore(false)
    }
  }, [page, serviceId, t])

  return (
    <section aria-labelledby="service-reviews" className="space-y-4 rounded-2xl border border-border/80 bg-card/70 p-6 shadow-sm backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="service-reviews" className="flex items-center gap-2 text-lg font-semibold">
          <MessageSquareText className="size-5 text-primary" aria-hidden="true" />
          {t("serviceReviews.title")}
        </h2>
        {average !== null && (
          <p className="flex items-center gap-2 text-sm">
            <StarDisplay value={average} label={t("serviceReviews.averageAria", { value: average })} />
            <span className="font-semibold tabular-nums">{average.toLocaleString("fr-FR")}</span>
            <span className="text-muted-foreground">· {t("serviceReviews.count", { count: total })}</span>
          </p>
        )}
      </div>

      {error ? (
        <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : reviews === null ? (
        <Skeleton className="h-24 rounded-xl" />
      ) : reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("serviceReviews.noReviews")}</p>
      ) : (
        <>
          <ul className="space-y-3">
            {reviews.map((review) => (
              <li key={review.id} className="rounded-xl border border-border/70 bg-background/55 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">{review.authorName}</p>
                  <StarDisplay value={review.rating} label={t("serviceReviews.starsAria", { count: review.rating })} />
                </div>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">{review.comment}</p>
                <p className="mt-2 text-xs text-muted-foreground">{formatDate(review.createdAt)}</p>
              </li>
            ))}
          </ul>
          {reviews.length < total && (
            <div className="flex justify-center">
              <Button variant="outline" size="sm" onClick={loadMore} disabled={isLoadingMore}>
                {t("serviceReviews.loadMore")}
              </Button>
            </div>
          )}
        </>
      )}
    </section>
  )
}
