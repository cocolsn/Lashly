import type { Metadata } from "next";
import Link from "next/link";
import { signIn } from "../actions";
import { AuthForm } from "../auth-form";

export const metadata: Metadata = { title: "Me connecter · Lashly" };

export default function SignInPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Me connecter</h1>
      <p className="mt-1 text-mute">Retrouve ton agenda et tes clientes.</p>
      <AuthForm
        action={signIn}
        submitLabel="Me connecter"
        pendingLabel="Connexion…"
        passwordAutoComplete="current-password"
      />
      <p className="mt-5 text-sm text-mute">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="font-semibold text-ink">
          Créer mon espace
        </Link>
      </p>
    </>
  );
}
