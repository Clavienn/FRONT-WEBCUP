import type { Metadata } from "next"
import { AuthForm } from "@/components/auth/auth-form"

export const metadata: Metadata = {
  title: "Connexion | DevAtoandro",
  description: "Connexion ou création de compte pour Webcup 2026.",
}

export default function ConnexionPage() {
  return <AuthForm />
}