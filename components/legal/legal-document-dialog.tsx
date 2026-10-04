"use client"

import { useState, type ReactNode } from "react"
import { LifeBuoy } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useLanguage } from "@/components/i18n/language-provider"
import { LEGAL_DOCUMENTS, type LegalDocumentKind } from "@/config/legal-documents"
import { OPEN_SUPPORT_BUBBLE_EVENT } from "@/lib/support-events"
import { cn } from "@/lib/utils"

interface LegalDocumentDialogProps {
  kind: LegalDocumentKind
  children: ReactNode
  className?: string
}

export function LegalDocumentDialog({ kind, children, className }: Readonly<LegalDocumentDialogProps>) {
  const [open, setOpen] = useState(false)
  const { locale, t } = useLanguage()
  const document = LEGAL_DOCUMENTS[locale][kind]
  const supportButtonLabel = t("legalDocuments.supportButton")

  const openSupport = () => {
    setOpen(false)
    window.setTimeout(() => window.dispatchEvent(new Event(OPEN_SUPPORT_BUBBLE_EVENT)), 180)
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={cn("text-left underline underline-offset-4", className)}>
        {children}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[90dvh] flex-col gap-0 overflow-hidden border-white/10 bg-[#07121a] p-0 text-slate-100 shadow-2xl sm:max-w-3xl">
          <DialogHeader className="border-b border-white/10 px-6 py-5 pr-14 sm:px-8">
            <p className="text-xs font-semibold uppercase text-cyan-300">{t("legalDocuments.eyebrow")}</p>
            <DialogTitle className="text-xl font-semibold text-white sm:text-2xl">{document.title}</DialogTitle>
            <DialogDescription className="text-slate-300">{document.introduction}</DialogDescription>
            <p className="text-xs text-slate-400">{document.version}</p>
          </DialogHeader>

          <div
            tabIndex={0}
            aria-label={t("legalDocuments.contentAriaLabel", { title: document.title })}
            className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-300 sm:px-8"
          >
            <aside className="rounded-lg border border-amber-300/30 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100" role="note">
              {document.draftNotice}
            </aside>

            {document.sections.map((section) => (
              <section key={section.title} className="space-y-2">
                <h3 className="font-semibold text-white">{section.title}</h3>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 48)} className="text-sm leading-6 text-slate-300">
                    {paragraph}
                  </p>
                ))}
              </section>
            ))}

            <section className="space-y-3 rounded-lg border border-white/10 bg-white/5 p-4">
              <h3 className="font-semibold text-white">{t("legalDocuments.questionsTitle")}</h3>
              <p className="text-sm leading-6 text-slate-300">{t("legalDocuments.questionsDescription")}</p>
              <Button type="button" variant="outline" onClick={openSupport} className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                <LifeBuoy aria-hidden="true" />
                {supportButtonLabel}
              </Button>
            </section>
          </div>

          <div className="flex justify-end border-t border-white/10 px-6 py-4 sm:px-8">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">
              {t("legalDocuments.close")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}