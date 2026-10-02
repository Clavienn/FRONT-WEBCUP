"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeftIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Toaster, toast } from "@/components/ui/toast"
import { Personne, personneRepository } from "@/repository/personne.repository"

const formatDate = (value: string) =>
  new Date(value).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })

const notifyError = (err: unknown) =>
  toast.add({
    title: "Erreur",
    description: err instanceof Error ? err.message : "Une erreur est survenue",
    type: "error",
  })

export default function PersonnesPage() {
  const [personnes, setPersonnes] = useState<Personne[]>([])
  const [loading, setLoading] = useState(true)

  // Modal ajout / modification (editing === null => ajout)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Personne | null>(null)
  const [nom, setNom] = useState("")
  const [saving, setSaving] = useState(false)

  // Modal suppression
  const [toDelete, setToDelete] = useState<Personne | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    try {
      setPersonnes(await personneRepository.getAll())
    } catch (err) {
      notifyError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const openAdd = () => {
    setEditing(null)
    setNom("")
    setFormOpen(true)
  }

  const openEdit = (personne: Personne) => {
    setEditing(personne)
    setNom(personne.nom)
    setFormOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const value = nom.trim()
    if (!value) return
    setSaving(true)
    try {
      if (editing) {
        await personneRepository.update(editing.id, value)
        toast.add({ title: "Personne modifiée", type: "success" })
      } else {
        await personneRepository.create(value)
        toast.add({ title: "Personne ajoutée", type: "success" })
      }
      setFormOpen(false)
      await load()
    } catch (err) {
      notifyError(err)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      await personneRepository.remove(toDelete.id)
      toast.add({ title: "Personne supprimée", type: "success" })
      setToDelete(null)
      await load()
    } catch (err) {
      notifyError(err)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Toaster>
      <div className="app-atmosphere min-h-screen px-6 py-10">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="flex items-end justify-between gap-4">
            <div className="space-y-2">
              <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/" />}>
                <ArrowLeftIcon /> Accueil
              </Button>
              <h1 className="text-2xl font-medium tracking-tight text-foreground">Gestion des personnes</h1>
            </div>
            <Button onClick={openAdd}>
              <PlusIcon /> Ajouter
            </Button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border/80 bg-card/70 shadow-[0_8px_30px_rgba(50,80,120,0.04)] backdrop-blur-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">ID</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Créé le</TableHead>
                  <TableHead>Modifié le</TableHead>
                  <TableHead className="w-28 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10">
                      <Spinner className="mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : personnes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                      Aucune personne enregistrée.
                    </TableCell>
                  </TableRow>
                ) : (
                  personnes.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.id}</TableCell>
                      <TableCell className="font-medium">{p.nom}</TableCell>
                      <TableCell>{formatDate(p.created_at)}</TableCell>
                      <TableCell>{formatDate(p.updated_at)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEdit(p)}
                          aria-label="Modifier"
                        >
                          <PencilIcon />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive"
                          onClick={() => setToDelete(p)}
                          aria-label="Supprimer"
                        >
                          <Trash2Icon />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Modal ajout / modification */}
        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogContent>
            <form onSubmit={handleSubmit} className="grid gap-4">
              <DialogHeader>
                <DialogTitle>{editing ? "Modifier la personne" : "Ajouter une personne"}</DialogTitle>
                <DialogDescription>
                  {editing
                    ? "Modifiez le nom puis enregistrez."
                    : "Saisissez le nom de la nouvelle personne."}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-2">
                <Label htmlFor="nom">Nom</Label>
                <Input
                  id="nom"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  maxLength={255}
                  placeholder="Ex : Jean Dupont"
                  autoFocus
                  required
                />
              </div>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" type="button" />}>
                  Annuler
                </DialogClose>
                <Button type="submit" disabled={saving || !nom.trim()}>
                  {saving && <Spinner />}
                  {editing ? "Enregistrer" : "Ajouter"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal confirmation suppression */}
        <AlertDialog open={toDelete !== null} onOpenChange={(open) => !open && setToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer cette personne ?</AlertDialogTitle>
              <AlertDialogDescription>
                « {toDelete?.nom} » sera définitivement supprimé(e). Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annuler</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={handleDelete} disabled={deleting}>
                {deleting && <Spinner />}
                Supprimer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Toaster>
  )
}
