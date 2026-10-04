"use client"

import { useState } from "react"
import { Download, Loader2 } from "lucide-react"

import { cn } from "cn"
import { useLanguage } from "@/components/i18n/language-provider"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/toast"
import { buildAdminExportPdf } from "@/lib/adminExportPdf"
import {
  EXPORT_SECTIONS,
  loadAdminExport,
  type ExportSection,
} from "@/repository/adminExport.repository"
import type { AuthUser } from "@/repository/auth.repository"

const DEFAULT_SECTIONS: ExportSection[] = ["synthesis", "requests", "accounts"]

/**
 * Droit exigé pour produire le rapport.
 *
 * L'export n'a pas son propre code de permission côté API (le seed n'en définit aucun pour
 * l'export) : on s'appuie donc sur un droit réel, déjà exigé par les écrans que le PDF reproduit.
 * `admin.users.manage` ouvre l'annuaire des comptes, les rôles, les permissions et le journal
 * d'audit — c'est-à-dire l'essentiel de ce que le rapport peut rassembler. Un compte
 * administrateur qui en serait privé n'a plus de raison d'exporter la plateforme.
 */
const EXPORT_PERMISSION = "admin.users.manage"

/**
 * Export PDF de la console d'administration : l'admin coche les sources utiles, le rapport est
 * construit côté client à partir des mêmes endpoints que l'écran (aucune donnée n'est ajoutée ici).
 *
 * Le déclencheur n'apparaît que pour un compte portant EXPORT_PERMISSION, et `handleExport` le
 * revérifie : l'export est l'opération la plus sensible de la console (une source refusée par
 * l'API est signalée dans le PDF, pas bloquée), elle ne doit pas dépendre du seul écran qui
 * l'affiche. Chaque source garde par ailleurs son propre `requirePermission` côté serveur.
 */
export function AdminExportDialog({ user }: { user: AuthUser }) {
  const { t, locale } = useLanguage()
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<ExportSection[]>(DEFAULT_SECTIONS)
  const [busy, setBusy] = useState(false)
  const canExport = user.permissions.includes(EXPORT_PERMISSION)

  const toggle = (section: ExportSection) =>
    setSelected((current) =>
      current.includes(section)
        ? current.filter((entry) => entry !== section)
        : EXPORT_SECTIONS.filter((entry) => current.includes(entry) || entry === section)
    )

  const handleExport = async () => {
    if (selected.length === 0) return
    // Revérifié ici, pas seulement sur le bouton : l'état des permissions peut avoir changé
    // depuis l'ouverture de la boîte de dialogue.
    if (!canExport) return
    setBusy(true)
    try {
      const results = await loadAdminExport(selected)
      await buildAdminExportPdf({
        locale,
        t,
        sections: selected,
        results,
        author: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email,
      })
      // Une source refusée par l'API ne doit pas disparaître dans le silence : elle est nommée ici
      const failed = selected.filter(
        (section) => section !== "synthesis" && results[section].error !== null
      )
      if (failed.length > 0) {
        toast.add({
          title: t("adminDashboard.export.partialTitle"),
          description: t("adminDashboard.export.partialDescription", {
            count: failed.length,
            sections: failed.map((section) => t(`adminDashboard.export.sections.${section}.label`)).join(", "),
          }),
          type: "warning",
        })
      } else {
        toast.add({ title: t("adminDashboard.export.successTitle"), type: "success" })
      }
      setOpen(false)
    } catch {
      toast.add({
        title: t("adminDashboard.export.errorTitle"),
        description: t("adminDashboard.export.errorDescription"),
        type: "error",
      })
    } finally {
      setBusy(false)
    }
  }

  // Sans le droit d'export, l'action n'est pas offerte : un lien inactif devant un tableau de
  // cases à cocher n'apporterait rien. Les écrans eux-mêmes gardent leur propre garde.
  if (!canExport) return null

  return (
    <>
      <Button variant="outline" className="w-fit gap-2" onClick={() => setOpen(true)}>
        <Download className="size-4" aria-hidden="true" />
        {t("adminDashboard.export.button")}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("adminDashboard.export.dialogTitle")}</DialogTitle>
          <DialogDescription>{t("adminDashboard.export.dialogDescription")}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="min-w-0 text-sm text-muted-foreground">
            {t("adminDashboard.export.selectedCount", { count: selected.length, total: EXPORT_SECTIONS.length })}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelected([...EXPORT_SECTIONS])}
              disabled={busy}
            >
              {t("adminDashboard.export.selectAll")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelected([])}
              disabled={busy}
            >
              {t("adminDashboard.export.clearAll")}
            </Button>
          </div>
        </div>

        <ul className="max-h-72 min-w-0 space-y-1 overflow-y-auto overflow-x-hidden pr-1">
          {EXPORT_SECTIONS.map((section) => (
            <li key={section} className="min-w-0">
              <label
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-lg border border-border/70 p-3 transition-colors hover:bg-muted/40",
                  selected.includes(section) && "border-primary/40 bg-primary/5"
                )}
              >
                <Checkbox
                  checked={selected.includes(section)}
                  onCheckedChange={() => toggle(section)}
                  disabled={busy}
                  className="mt-0.5"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium">
                    {t(`adminDashboard.export.sections.${section}.label`)}
                  </span>
                  <span className="mt-0.5 block text-xs leading-5 text-muted-foreground">
                    {t(`adminDashboard.export.sections.${section}.hint`)}
                  </span>
                </span>
              </label>
            </li>
          ))}
        </ul>

        {selected.length === 0 && (
          <p role="alert" className="text-sm font-medium text-destructive">
            {t("adminDashboard.export.noneSelected")}
          </p>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
            {t("adminDashboard.export.cancel")}
          </Button>
          <Button onClick={handleExport} disabled={busy || selected.length === 0}>
            {busy && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            {busy ? t("adminDashboard.export.running") : t("adminDashboard.export.run")}
          </Button>
        </DialogFooter>
      </DialogContent>
      </Dialog>
    </>
  )
}