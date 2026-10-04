import type { Translate } from "@/lib/audit-actions"
import type { Locale } from "@/lib/i18n/types"
import { actionLabel, entityLabel, isFailure } from "@/lib/audit-actions"
import { requestPriorityKey, requestStatusKey } from "@/repository/citizenRequest.repository"
import type { ContactStatus } from "@/repository/contactMessage.repository"
import type { ExportResult, ExportSection } from "@/repository/adminExport.repository"
import { EXPORT_ROW_LIMIT } from "@/repository/adminExport.repository"

/**
 * Fabrique le PDF d'export d'administration. Les données arrivent déjà filtrées par la sélection de
 * l'admin : le document ne contient que les sections cochées, plus la synthèse qui les commente.
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
  alert: [180, 83, 9] as const,
}

interface SectionContent {
  title: string
  indicators: { label: string; value: string }[]
  attention: string[]
  table?: { head: string[]; rows: string[][]; total: number }
}

export interface AdminExportPdfInput {
  locale: Locale
  t: Translate
  /** Sections cochées par l'admin, dans l'ordre d'affichage du document */
  sections: ExportSection[]
  results: ExportResult
  author: string
}

const percent = (part: number, total: number) => (total === 0 ? "0 %" : `${Math.round((part / total) * 100)} %`)

const nameOf = (first: string | null, last: string | null, fallback: string) =>
  [first, last].filter(Boolean).join(" ") || fallback

// Les codes techniques des statuts ne quittent jamais le rapport : ils sont traduits comme à l'écran
const CONTACT_STATUS_KEYS: Record<ContactStatus, string> = {
  new: "adminDashboard.export.values.new",
  read: "adminDashboard.export.values.read",
  processed: "adminDashboard.export.values.processed",
}

function formatDate(value: string | null, locale: Locale) {
  if (!value) return "—"
  return new Date(value).toLocaleDateString(DATE_LOCALES[locale], { dateStyle: "short" })
}

function formatDateTime(value: string | null, locale: Locale) {
  if (!value) return "—"
  return new Date(value).toLocaleString(DATE_LOCALES[locale], { dateStyle: "short", timeStyle: "short" })
}

/** Construit le contenu texte de chaque section : indicateurs, points d'attention, tableau. */
function buildSections({ t, locale, sections, results }: AdminExportPdfInput): SectionContent[] {
  const content: SectionContent[] = []

  for (const section of sections) {
    if (section === "synthesis") continue
    const entry = sectionsContent(section, t, locale, results)
    if (entry) content.push(entry)
  }

  // La synthèse vient en tête : elle commente ce qui suit
  if (sections.includes("synthesis")) {
    const summary = content.flatMap((item) => item.attention)
    content.unshift({
      title: t("adminDashboard.export.pdf.synthesisTitle"),
      indicators: [
        {
          label: t("adminDashboard.export.pdf.sectionsCount"),
          value: String(sections.length),
        },
        {
          label: t("adminDashboard.export.pdf.attentionCount"),
          value: String(summary.length),
        },
      ],
      attention: summary.length > 0 ? summary : [t("adminDashboard.export.pdf.noAttention")],
    })
  }

  return content
}

function sectionsContent(
  section: ExportSection,
  t: Translate,
  locale: Locale,
  results: ExportResult
): SectionContent | null {
  switch (section) {
    case "requests": {
      const data = results.requests.data
      if (!data) return unavailable(section, t)
      const open = data.counts.pending + data.counts.in_progress
      return {
        title: t("adminDashboard.export.sections.requests.label"),
        indicators: [
          { label: t("adminDashboard.export.columns.total"), value: String(data.total) },
          { label: t("adminDashboard.export.columns.pending"), value: String(data.counts.pending) },
          { label: t("adminDashboard.export.columns.inProgress"), value: String(data.counts.in_progress) },
          { label: t("adminDashboard.export.columns.resolved"), value: String(data.counts.resolved) },
          { label: t("adminDashboard.export.columns.rejected"), value: String(data.counts.rejected) },
        ],
        attention:
          open > 0
            ? [t("adminDashboard.export.pdf.requestsOpen", { count: open, share: percent(open, data.total) })]
            : [t("adminDashboard.export.pdf.requestsDrained")],
        table: {
          head: [
            t("adminDashboard.export.columns.subject"),
            t("adminDashboard.export.columns.service"),
            t("adminDashboard.export.columns.priority"),
            t("adminDashboard.export.columns.status"),
            t("adminDashboard.export.columns.date"),
          ],
          rows: data.recent.map((request) => [
            request.subject,
            request.service?.name ?? "—",
            t(`agentRequests.priority${requestPriorityKey(request.priority)}`),
            t(`agentRequests.filter${requestStatusKey(request.status)}`),
            formatDate(request.createdAt, locale),
          ]),
          total: data.total,
        },
      }
    }
    case "accounts": {
      const data = results.accounts.data
      if (!data) return unavailable(section, t)
      const rows = data.directory.users
      const inactive = rows.filter((user) => !user.isActive).length
      const neverLoggedIn = rows.filter((user) => user.lastLoginAt === null).length
      return {
        title: t("adminDashboard.export.sections.accounts.label"),
        indicators: [
          { label: t("adminDashboard.export.columns.directory"), value: String(data.directory.total) },
          { label: t("adminDashboard.export.columns.citizens"), value: String(data.citizens.total) },
          {
            label: t("adminDashboard.export.columns.staff"),
            value: String(data.directory.total - data.citizens.total),
          },
        ],
        attention: [
          t("adminDashboard.export.pdf.accountsInactive", { count: inactive, total: rows.length }),
          t("adminDashboard.export.pdf.accountsNeverLoggedIn", { count: neverLoggedIn, total: rows.length }),
        ],
        table: {
          head: [
            t("adminDashboard.export.columns.name"),
            t("adminDashboard.export.columns.email"),
            t("adminDashboard.export.columns.roles"),
            t("adminDashboard.export.columns.status"),
            t("adminDashboard.export.columns.lastLogin"),
          ],
          rows: rows.map((user) => [
            nameOf(user.firstName, user.lastName, "—"),
            user.email,
            (user.roles ?? []).join(", ") || "—",
            user.isActive ? t("adminDashboard.export.values.active") : t("adminDashboard.export.values.inactive"),
            formatDateTime(user.lastLoginAt, locale),
          ]),
          total: data.directory.total,
        },
      }
    }
    case "rbac": {
      const data = results.rbac.data
      if (!data) return unavailable(section, t)
      const custom = data.roles.filter((role) => !role.isSystem)
      const broad = [...data.roles].sort((a, b) => (b.permissions?.length ?? 0) - (a.permissions?.length ?? 0))[0]
      return {
        title: t("adminDashboard.export.sections.rbac.label"),
        indicators: [
          { label: t("adminDashboard.export.columns.roles"), value: String(data.roles.length) },
          { label: t("adminDashboard.export.columns.permissions"), value: String(data.permissions.length) },
          { label: t("adminDashboard.export.columns.customRoles"), value: String(custom.length) },
        ],
        attention: [
          t("adminDashboard.export.pdf.rbacBroadest", {
            label: broad?.label ?? "—",
            count: broad?.permissions?.length ?? 0,
          }),
          t("adminDashboard.export.pdf.rbacCustom", { count: custom.length }),
        ],
        table: {
          head: [
            t("adminDashboard.export.columns.role"),
            t("adminDashboard.export.columns.code"),
            t("adminDashboard.export.columns.level"),
            t("adminDashboard.export.columns.users"),
            t("adminDashboard.export.columns.permissions"),
          ],
          rows: data.roles.map((role) => [
            role.label,
            role.code,
            String(role.level),
            String(role.usersCount ?? 0),
            String(role.permissions?.length ?? 0),
          ]),
          total: data.roles.length,
        },
      }
    }
    case "audit": {
      const data = results.audit.data
      if (!data) return unavailable(section, t)
      const failures = data.page.logs.filter((log) => isFailure(log.action)).length
      return {
        title: t("adminDashboard.export.sections.audit.label"),
        indicators: [
          { label: t("adminDashboard.export.columns.events"), value: String(data.page.total) },
          { label: t("adminDashboard.export.columns.failures"), value: String(failures) },
        ],
        attention: [
          t("adminDashboard.export.pdf.auditFailures", { count: failures, total: data.page.total }),
        ],
        table: {
          head: [
            t("adminDashboard.export.columns.date"),
            t("adminDashboard.export.columns.action"),
            t("adminDashboard.export.columns.entity"),
            t("adminDashboard.export.columns.author"),
          ],
          rows: data.page.logs.map((log) => [
            formatDateTime(log.createdAt, locale),
            actionLabel(log.action, t),
            entityLabel(log.entityType ?? "", t),
            log.user ? nameOf(log.user.firstName, log.user.lastName, log.user.email) : "—",
          ]),
          total: data.page.total,
        },
      }
    }
    case "services": {
      const data = results.services.data
      if (!data) return unavailable(section, t)
      const active = data.services.filter((service) => service.isActive)
      const rated = active.filter((service) => service.reviewsCount > 0)
      const average =
        rated.length > 0
          ? (
              rated.reduce((sum, service) => sum + (service.averageRating ?? 0), 0) / rated.length
            ).toFixed(2)
          : "—"
      return {
        title: t("adminDashboard.export.sections.services.label"),
        indicators: [
          { label: t("adminDashboard.export.columns.active"), value: String(active.length) },
          { label: t("adminDashboard.export.columns.inactiveServices"), value: String(data.services.length - active.length) },
          { label: t("adminDashboard.export.columns.averageRating"), value: average },
          { label: t("adminDashboard.export.columns.reviews"), value: String(data.services.reduce((sum, service) => sum + service.reviewsCount, 0)) },
        ],
        attention: [
          t("adminDashboard.export.pdf.servicesUnrated", { count: active.length - rated.length, total: active.length }),
        ],
        table: {
          head: [
            t("adminDashboard.export.columns.service"),
            t("adminDashboard.export.columns.code"),
            t("adminDashboard.export.columns.status"),
            t("adminDashboard.export.columns.averageRating"),
            t("adminDashboard.export.columns.reviews"),
          ],
          rows: data.services.map((service) => [
            service.name,
            service.code,
            service.isActive ? t("adminDashboard.export.values.active") : t("adminDashboard.export.values.inactive"),
            service.averageRating?.toFixed(2) ?? "—",
            String(service.reviewsCount),
          ]),
          total: data.services.length,
        },
      }
    }
    case "projects": {
      const data = results.projects.data
      if (!data) return unavailable(section, t)
      const by = (status: string) => data.projects.filter((project) => project.status === status).length
      const stalled = data.projects.filter(
        (project) => project.status === "ongoing" && (project.progress ?? 0) === 0
      )
      return {
        title: t("adminDashboard.export.sections.projects.label"),
        indicators: [
          { label: t("adminDashboard.export.columns.planned"), value: String(by("planned")) },
          { label: t("adminDashboard.export.columns.inProgress"), value: String(by("ongoing")) },
          { label: t("adminDashboard.export.columns.completed"), value: String(by("completed")) },
        ],
        attention: [t("adminDashboard.export.pdf.projectsStalled", { count: stalled.length })],
        table: {
          head: [
            t("adminDashboard.export.columns.title"),
            t("adminDashboard.export.columns.status"),
            t("adminDashboard.export.columns.progress"),
            t("adminDashboard.export.columns.participants"),
            t("adminDashboard.export.columns.author"),
          ],
          rows: data.projects.map((project) => [
            project.title,
            t(`projectsSection.status.${project.status}`),
            project.progress === null ? "—" : `${project.progress} %`,
            String(project.participants.length),
            project.author ? nameOf(project.author.firstName, project.author.lastName, "—") : "—",
          ]),
          total: data.projects.length,
        },
      }
    }
    case "ideas": {
      const data = results.ideas.data
      if (!data) return unavailable(section, t)
      return {
        title: t("adminDashboard.export.sections.ideas.label"),
        indicators: [{ label: t("adminDashboard.export.columns.total"), value: String(data.list.total) }],
        attention: [t("adminDashboard.export.pdf.ideasPending", { count: data.list.total })],
        table: {
          head: [
            t("adminDashboard.export.columns.reference"),
            t("adminDashboard.export.columns.content"),
            t("adminDashboard.export.columns.author"),
            t("adminDashboard.export.columns.date"),
          ],
          rows: data.list.ideas.map((idea) => [
            idea.reference,
            idea.content,
            idea.author?.name ?? "—",
            formatDate(idea.createdAt, locale),
          ]),
          total: data.list.total,
        },
      }
    }
    case "messages": {
      const data = results.messages.data
      if (!data) return unavailable(section, t)
      const unread = data.inbox.counts.new
      return {
        title: t("adminDashboard.export.sections.messages.label"),
        indicators: [
          { label: t("adminDashboard.export.columns.total"), value: String(data.inbox.total) },
          { label: t("adminDashboard.export.columns.unread"), value: String(unread) },
          { label: t("adminDashboard.export.columns.read"), value: String(data.inbox.counts.read) },
          { label: t("adminDashboard.export.columns.processed"), value: String(data.inbox.counts.processed) },
        ],
        attention: [
          unread > 0
            ? t("adminDashboard.export.pdf.messagesUnread", { count: unread })
            : t("adminDashboard.export.pdf.messagesCleared"),
        ],
        table: {
          head: [
            t("adminDashboard.export.columns.subject"),
            t("adminDashboard.export.columns.status"),
            t("adminDashboard.export.columns.sender"),
            t("adminDashboard.export.columns.date"),
          ],
          rows: data.inbox.messages.map((message) => [
            message.subject,
            t(CONTACT_STATUS_KEYS[message.status]),
            message.sender
              ? nameOf(message.sender.firstName, message.sender.lastName, message.sender.email)
              : "—",
            formatDateTime(message.sentAt, locale),
          ]),
          total: data.inbox.total,
        },
      }
    }
    default:
      return null
  }
}

function unavailable(section: ExportSection, t: Translate): SectionContent {
  return {
    title: t(`adminDashboard.export.sections.${section}.label`),
    indicators: [],
    attention: [
      t("adminDashboard.export.pdf.sourceUnavailable", { section: t(`adminDashboard.export.sections.${section}.label`) }),
    ],
  }
}

/**
 * Construit et télécharge le rapport. `jsPDF` est chargé à la demande : la console d'administration
 * n'a pas à embarquer la bibliothèque pour l'utilisateur qui n'exporte pas.
 */
export async function buildAdminExportPdf(input: AdminExportPdfInput): Promise<void> {
  const { jsPDF } = await import("jspdf")
  const { t, locale } = input
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const margin = 18
  const contentWidth = pageWidth - margin * 2
  const dateFormatter = new Intl.DateTimeFormat(
    locale === "fr" ? "fr-FR" : "en-GB",
    { dateStyle: "long", timeStyle: "short" }
  )

  pdf.setProperties({
    title: t("adminDashboard.export.pdf.title"),
    subject: t("adminDashboard.export.pdf.subject"),
    author: input.author,
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
      pdf.text(t("adminDashboard.export.pdf.footer"), margin, 288)
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
  pdf.text(t("adminDashboard.export.pdf.brand"), margin, 16)
  pdf.setTextColor(197, 216, 208)
  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(7)
  pdf.text(t("adminDashboard.export.pdf.documentType"), pageWidth - margin, 16, { align: "right" })

  pdf.setTextColor(...COLORS.white)
  pdf.setFont("times", "bold")
  pdf.setFontSize(22)
  pdf.text(pdf.splitTextToSize(t("adminDashboard.export.pdf.title"), contentWidth - 20).slice(0, 2), margin, 38)

  pdf.setTextColor(197, 216, 208)
  pdf.setFont("helvetica", "normal")
  pdf.setFontSize(8)
  pdf.text(t("adminDashboard.export.pdf.generatedAt", { date: dateFormatter.format(new Date()) }), margin, 56)
  pdf.text(t("adminDashboard.export.pdf.author", { author: input.author }), margin, 62)
  pdf.text(
    t("adminDashboard.export.pdf.scope", { count: input.sections.length }),
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
    if (items.length === 0) return
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
      pdf.text(
        pdf.splitTextToSize(item.label.toUpperCase(), width - 8).slice(0, 1),
        x + 4,
        top + 6
      )
      pdf.setTextColor(...COLORS.ink)
      pdf.setFontSize(12)
      pdf.text(item.value, x + 4, top + 12.5)
    })
    y += rows * 18 + 4
  }

  const table = (head: string[], rows: string[][], total: number) => {
    if (rows.length === 0) {
      body(t("adminDashboard.export.pdf.emptySource"), COLORS.muted)
      return
    }
    // Deux premières colonnes plus larges (libellé, contenu), le reste se partage le reliquat
    const share = 0.4 / Math.max(1, head.length - 2)
    const widths = head.map((_, index) => (index === 1 ? 0.34 : index === 0 ? 0.26 : share))
    const rowHeight = 7

    // Une cellule tient sur une ligne : au-delà, la ligne est coupée et le lecteur le voit
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

    if (total > rows.length) {
      body(
        t("adminDashboard.export.pdf.truncated", {
          shown: rows.length,
          total,
          limit: EXPORT_ROW_LIMIT,
        }),
        COLORS.muted
      )
    }
  }

  for (const section of buildSections(input)) {
    heading(section.title)
    indicators(section.indicators)
    if (section.table) {
      table(section.table.head, section.table.rows, section.table.total)
      y += 3
    }
    for (const point of section.attention) bullet(point)
    y += 4
  }

  drawFooter()

  const stamp = new Date().toISOString().slice(0, 10)
  pdf.save(t("adminDashboard.export.pdf.filename", { date: stamp }))
}