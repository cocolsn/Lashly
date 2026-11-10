import type { Metadata } from "next";
import Link from "next/link";
import { signUp } from "../actions";
import { AuthForm } from "../auth-form";

export const metadata: Metadata = { title: "Créer mon espace · Lashly" };

export default function SignUpPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Créer mon espace</h1>
      <p className="mt-1 text-mute">Quelques secondes, puis tu configures ton studio.</p>
      <AuthForm
        action={signUp}
        submitLabel="Créer mon espace"
        pendingLabel="Création en cours…"
        passwordAutoComplete="new-password"
        passwordHint="Au moins 8 caractères."
      />
      <p className="mt-5 text-sm text-mute">
        Déjà un compte ?{" "}
        <Link href="/connexion" className="font-semibold text-ink">
          Me connecter
        </Link>
      </p>
    </>
  );
}
