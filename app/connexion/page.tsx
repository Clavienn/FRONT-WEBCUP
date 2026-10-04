import type { Metadata } from "next"
import { AuthForm } from "@/components/auth/auth-form"

export const metadata: Metadata = {
  title: "Connexion & Inscription | Terra Nova",
  description: "Accès au terminal citoyen et aux services du Haut Conseil de Terra Nova.",
}

export default function ConnexionPage() {
  return <AuthForm />
}