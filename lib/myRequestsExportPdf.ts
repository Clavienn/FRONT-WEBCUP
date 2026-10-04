import type { Translate } from "@/lib/audit-actions"
import type { Locale } from "@/lib/i18n/types"
import { requestStatusKey, type CitizenRequest, type RequestStatus } from "@/repository/citizenRequest.repository"

/**
 * Fabrique le PDF "mes demandes" d'un citoyen. Contrairement à un export brut, le document ouvre
 * sur une synthèse (compteurs par statut, délais, points d'attention) avant le détail ligne à
 * ligne : la personne qui le reçoit (le citoyen, ou quelqu'un qui l'accompagne dans sa démarche)
 * doit pouvoir en tirer une lecture utile sans recompter les lignes elle-même.
 */

const DATE_LOCALES: Record<Locale, string> = { fr: "fr-FR", en: "en-GB" }

const COLORS = {
  ink: [25, 48, 46] as const,
  forest: [17, 57, 53] as const,
  teal: [54, 119, 111] as const,
  copper: [215, 139, 91] as const,
  muted: [104, 122, 118] as const,
  border: [222, 230, 225] as const,
  paper: [246, 248, 245] as const,
  white: [255, 255, 255] as const,
}

const MS_PER_DAY = 1000 * 60 * 60 * 24

// Plafond de pagination de l'API (`parsePagination`) : au-delà, le rapport le signale dans son en-tête.
export const MY_REQUESTS_EXPORT_LIMIT = 100

export interface MyRequestsExportPdfInput {
  locale: Locale
  t: Translate
  author: string
  requests: CitizenRequest[]
  total: number
}

function formatDate(value: string, locale: Locale) {
  return new Date(value).toLocaleDateString(DATE_LOCALES[locale], { dateStyle: "short" })
}

function daysBetween(from: string, to: Date) {
  return Math.max(0, Math.round((to.getTime() - new Date(from).getTime()) / MS_PER_DAY))
}

/**
 * Construit et télécharge le récapitulatif. `jsPDF` est chargé à la demande : la page des demandes
 * n'a pas à embarquer la bibliothèque pour le citoyen qui ne télécharge jamais son récapitulatif.
 */
export async function buildMyRequestsExportPdf(input: MyRequestsExportPdfInput): Promise<void> {
  const { jsPDF } = await import("jspdf")
  const { t, locale, requests, total } = input
  const now = new Date()

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const margin = 18
  const contentWidth = pageWidth - margin * 2
  const dateFormatter = new Intl.DateTimeFormat(
    locale === "fr" ? "fr-FR" : "en-GB",
    { dateStyle: "long", timeStyle: "short" }
  )

  pdf.setProperties({
    title: t("citizenRequests.export.pdf.title"),
    subject: t("citizenRequests.export.pdf.subject"),
    author: input.author,
  })

  // ── Synthèse ───────────────────────────────────────────────
  const counts: Record<RequestStatus, number> = { pending: 0, in_progress: 0, resolved: 0, rejected: 0 }
  for (const request of requests) counts[request.status] += 1

  const closed = counts.resolved + counts.rejected
  const resolutionRate = closed > 0 ? `${Math.round((counts.resolved / closed) * 100)} %` : t("citizenRequests.export.pdf.noValue")

  const resolvedDelays = requests
    .filter((request) => request.status === "resolved" && request.updatedAt)
    .map((request) => daysBetween(request.createdAt, new Date(request.updatedAt!)))
  const averageDelay =
    resolvedDelays.length > 0
      ? Math.round(resolvedDelays.reduce((sum, value) => sum + value, 0) / resolvedDelays.length)
      : null

  const pending = requests.filter((request) => request.status === "pending" || request.status === "in_progress")
  const oldestPending = pending.length > 0
    ? pending.reduce((oldest, request) => (request.createdAt < oldest.createdAt ? request : oldest))
    : null

  const attention: string[] = []
  if (oldestPending) {
    attention.push(
      t("citizenRequests.export.pdf.attentionOldestPending", {
        subject: oldestPending.subject,
        days: daysBetween(oldestPending.createdAt, now),
      })
    )
  } else {
    attention.push(t("citizenRequests.export.pdf.attentionNone"))
  }
  if (averageDelay !== null) {
    attention.push(t("citizenRequests.export.pdf.attentionAverageDelay", { days: averageDelay }))
  }
  if (counts.rejected > 0) {
    attention.push(t("citizenRequests.export.pdf.attentionRejected", { count: counts.rejected }))
  }

  const indicatorItems = [
    { label: t("citizenRequests.export.pdf.columnTotal"), value: String(total) },
    { label: t("citizenRequests.export.pdf.columnPending"), value: String(counts.pending) },
    { label: t("citizenRequests.export.pdf.columnInProgress"), value: String(counts.in_progress) },
    { label: t("citizenRequests.export.pdf.columnResolved"), value: String(counts.resolved) },
    { label: t("citizenRequests.export.pdf.columnRejected"), value: String(counts.rejected) },
    { label: t("citizenRequests.export.pdf.columnResolutionRate"), value: resolutionRate },
    {
      label: t("citizenRequests.export.pdf.columnAverageDelay"),
      value: averageDelay !== null ? `${averageDelay} j.` : t("citizenRequests.export.pdf.noValue"),
    },
  ]

  const tableRows = requests.map((request) => {
    const delay =
      request.status === "resolved" || request.status === "rejected"
        ? t("citizenRequests.export.pdf.delayDone", { days: daysBetween(request.createdAt, request.updatedAt ? new Date(request.updatedAt) : now) })
        : t("citizenRequests.export.pdf.delayOngoing", { days: daysBetween(request.createdAt, now) })
    return [
      request.subject,
      request.service?.name ?? "—",
      t(`citizenRequests.status${requestStatusKey(request.status)}`),
      formatDate(request.createdAt, locale),
      delay,
    ]
  })

  const drawFooter = () => {
    const pages = pdf.getNumberOfPages()
    for (let page = 1; page <= pages; page += 1) {
      pdf.setPage(page)
      pdf.setDrawColor(...COLORS.border)
      pdf.setLineWidth(0.2)
      pdf.line(margin, 283, pageWidth - margin, 283)
      pdf.setTextColor(...COLORS.muted)
      pdf.setFont("helvetica", "normal")
      pdf.setFontSize(7)
      pdf.text(t("citizenRequests.export.pdf.footer"), margin, 288)
      pdf.text(`${page} / ${pages}`, pageWidth - margin, 288, { align: "right" })
    }
  }

  // ── En-tête ────────────────────────────────────────────────
  pdf.setFillColor(...COLORS.forest)
  pdf.rect(0, 0, pageWidth, 84, "F")
  pdf.setFillColor(...COLORS.copper)
  pdf.rect(0, 0, 3, 84, "F")
  pdf.setTextColor(...COLORS.copper)
  pdf.setFont("helvetica", "bold")
  pdf.setFontSize(8)
  pdf.text(t("citizenRequests.export.pdf.brand"), margin, 16)
  pdf.setTextColor(197, 216, 208)
  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(7)
  pdf.text(t("citizenRequests.export.pdf.documentType"), pageWidth - margin, 16, { align: "right" })

  pdf.setTextColor(...COLORS.white)
  pdf.setFont("times", "bold")
  pdf.setFontSize(22)
  pdf.text(pdf.splitTextToSize(t("citizenRequests.export.pdf.title"), contentWidth - 20).slice(0, 2), margin, 38)

  pdf.setTextColor(197, 216, 208)
  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(8)
  pdf.text(t("citizenRequests.export.pdf.generatedAt", { date: dateFormatter.format(now) }), margin, 56)
  pdf.text(t("citizenRequests.export.pdf.author", { author: input.author }), margin, 62)
  pdf.text(
    total > requests.length
      ? t("citizenRequests.export.pdf.scopeTruncated", { shown: requests.length, total })
      : t("citizenRequests.export.pdf.scope", { count: total }),
    margin,
    68
  )

  // ── Contenu ────────────────────────────────────────────────
  let y = 96

  const ensureSpace = (needed: number) => {
    if (y + needed <= 274) return
    pdf.addPage()
    y = margin
  }

  const heading = (text: string) => {
    ensureSpace(16)
    pdf.setTextColor(...COLORS.teal)
    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(11)
    pdf.text(text, margin, y)
    pdf.setDrawColor(...COLORS.copper)
    pdf.setLineWidth(0.8)
    pdf.line(margin, y + 3, margin + 14, y + 3)
    y += 11
  }

  const body = (text: string, color: readonly [number, number, number] = COLORS.ink) => {
    const lines = pdf.splitTextToSize(text, contentWidth) as string[]
    ensureSpace(lines.length * 4.6 + 3)
    pdf.setTextColor(...color)
    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(9)
    pdf.text(lines, margin, y)
    y += lines.length * 4.6 + 3
  }

  const bullet = (text: string) => {
    const lines = pdf.splitTextToSize(text, contentWidth - 5) as string[]
    ensureSpace(lines.length * 4.6 + 3)
    pdf.setTextColor(...COLORS.copper)
    pdf.setFont("helvetica", "bold")
    pdf.setFontSize(9)
    pdf.text("•", margin, y)
    pdf.setTextColor(...COLORS.ink)
    pdf.setFont("helvetica", "normal")
    pdf.text(lines, margin + 5, y)
    y += lines.length * 4.6 + 3
  }

  const indicators = (items: { label: string; value: string }[]) => {
    const columns = Math.min(items.length, 4)
    const width = (contentWidth - (columns - 1) * 4) / columns
    const rows = Math.ceil(items.length / columns)
    ensureSpace(rows * 18 + 4)
    items.forEach((item, index) => {
      const column = index % columns
      const row = Math.floor(index / columns)
      const x = margin + column * (width + 4)
      const top = y + row * 18
      pdf.setFillColor(...COLORS.white)
      pdf.setDrawColor(...COLORS.border)
      pdf.setLineWidth(0.25)
      pdf.roundedRect(x, top, width, 15, 2, 2, "FD")
      pdf.setTextColor(...COLORS.muted)
      pdf.setFont("helvetica", "bold")
      pdf.setFontSize(6.5)
      pdf.text(pdf.splitTextToSize(item.label.toUpperCase(), width - 8).slice(0, 1), x + 4, top + 6)
      pdf.setTextColor(...COLORS.ink)
      pdf.setFontSize(12)
      pdf.text(item.value, x + 4, top + 12.5)
    })
    y += rows * 18 + 4
  }

  const table = (head: string[], rows: string[][]) => {
    if (rows.length === 0) {
      body(t("citizenRequests.export.pdf.emptyTitle"), COLORS.muted)
      return
    }
    const share = 0.4 / Math.max(1, head.length - 2)
    const widths = head.map((_, index) => (index === 1 ? 0.3 : index === 0 ? 0.3 : share))
    const rowHeight = 7

    const cell = (value: string, width: number) => {
      const lines = pdf.splitTextToSize(value || "—", width) as string[]
      return lines.length > 1 ? `${lines[0].slice(0, -3)}...` : lines[0]
    }

    const drawHead = () => {
      ensureSpace(rowHeight + 4)
      pdf.setFillColor(...COLORS.forest)
      pdf.rect(margin, y, contentWidth, rowHeight, "F")
      let x = margin + 3
      pdf.setTextColor(...COLORS.white)
      pdf.setFont("helvetica", "bold")
      pdf.setFontSize(7)
      head.forEach((value, index) => {
        pdf.text(cell(value.toUpperCase(), widths[index] * contentWidth - 6), x, y + 4.6)
        x += widths[index] * contentWidth
      })
      y += rowHeight
    }

    drawHead()
    rows.forEach((row, rowIndex) => {
      ensureSpace(rowHeight + 2)
      if (rowIndex % 2 === 1) {
        pdf.setFillColor(...COLORS.paper)
        pdf.rect(margin, y, contentWidth, rowHeight, "F")
      }
      let x = margin + 3
      pdf.setTextColor(...COLORS.ink)
      pdf.setFont("helvetica", "normal")
      pdf.setFontSize(7.5)
      row.forEach((value, index) => {
        pdf.text(cell(value, widths[index] * contentWidth - 6), x, y + 4.6)
        x += widths[index] * contentWidth
      })
      pdf.setDrawColor(...COLORS.border)
      pdf.setLineWidth(0.15)
      pdf.line(margin, y + rowHeight, pageWidth - margin, y + rowHeight)
      y += rowHeight
    })
  }

  heading(t("citizenRequests.export.pdf.synthesisTitle"))
  indicators(indicatorItems)
  for (const point of attention) bullet(point)
  y += 4

  table(
    [
      t("citizenRequests.export.pdf.tableSubject"),
      t("citizenRequests.export.pdf.tableService"),
      t("citizenRequests.export.pdf.tableStatus"),
      t("citizenRequests.export.pdf.tableDate"),
      t("citizenRequests.export.pdf.tableDelay"),
    ],
    tableRows
  )

  drawFooter()

  const stamp = now.toISOString().slice(0, 10)
  pdf.save(t("citizenRequests.export.pdf.filename", { date: stamp }))
}
