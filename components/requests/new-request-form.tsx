"use client"

import { useEffect, useState } from "react"

import { useLanguage } from "@/components/i18n/language-provider"
import { useFormGuard } from "@/components/forms/form-guard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import {
  citizenRequestRepository,
  type NewRequestInput,
} from "@/repository/citizenRequest.repository"
import { serviceRepository, type MunicipalService } from "@/repository/service.repository"

// Mêmes plafonds que le serveur : le front valide pour le confort, l'API reste l'autorité
const SUBJECT_MAX = 255
const DESCRIPTION_MAX = 5000

interface NewRequestFormProps {
  onCreated: () => void
}

/** Formulaire de dépôt d'une demande citoyenne. */
export function NewRequestForm({ onCreated }: NewRequestFormProps) {
  const { t } = useLanguage()
  const [services, setServices] = useState<MunicipalService[] | null>(null)
  const [subject, setSubject] = useState("")
  const [description, setDescription] = useState("")
  const [serviceId, setServiceId] = useState("")
  const [error, setError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const guard = useFormGuard("request")

  useEffect(() => {
    let cancelled = false
    serviceRepository
      .list()
      .then((data) => !cancelled && setServices(data))
      .catch(() => !cancelled && setServices([]))
    return () => {
      cancelled = true
    }
  }, [])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting) return

    const trimmedSubject = subject.trim()
    if (!trimmedSubject) return setError(t("citizenRequests.subjectRequired"))
    if (trimmedSubject.length > SUBJECT_MAX) return setError(t("citizenRequests.subjectTooLong"))
    if (description.trim().length > DESCRIPTION_MAX) return setError(t("citizenRequests.descriptionTooLong"))

    const payload: NewRequestInput = {
      subject: trimmedSubject,
      description: description.trim() || null,
      serviceId: serviceId ? Number(serviceId) : null,
    }

    setError("")
    setSubmitting(true)
    try {
      await guard.run((headers) => citizenRequestRepository.create(payload, headers))
      setSubject("")
      setDescription("")
      setServiceId("")
      toast.add({
        title: t("citizenRequests.created"),
        description: t("citizenRequests.createdDescription"),
        type: "success",
      })
      onCreated()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t("citizenRequests.submitError"))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {guard.trap}
      <div className="space-y-1.5">
        <Label htmlFor="request-subject">{t("citizenRequests.subjectLabel")}</Label>
        <Input
          id="request-subject"
          value={subject}
          maxLength={SUBJECT_MAX}
          placeholder={t("citizenRequests.subjectPlaceholder")}
          onChange={(event) => setSubject(event.target.value)}
          aria-invalid={error !== ""}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="request-description">{t("citizenRequests.descriptionLabel")}</Label>
        <Textarea
          id="request-description"
          value={description}
          maxLength={DESCRIPTION_MAX}
          rows={4}
          placeholder={t("citizenRequests.descriptionPlaceholder")}
          onChange={(event) => setDescription(event.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="request-service">{t("citizenRequests.serviceLabel")}</Label>
        <NativeSelect
          id="request-service"
          className="w-full"
          value={serviceId}
          onChange={(event) => setServiceId(event.target.value)}
        >
          <NativeSelectOption value="">{t("citizenRequests.serviceNone")}</NativeSelectOption>
          {services?.map((service) => (
            <NativeSelectOption key={service.id} value={String(service.id)}>
              {service.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" disabled={submitting}>
        {submitting && <Spinner />}
        {submitting ? t("citizenRequests.sendingLabel") : t("citizenRequests.submitLabel")}
      </Button>
    </form>
  )
}