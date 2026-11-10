"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = {
  error?: string;
  notice?: string;
  email?: string;
};

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;
const MIN_PASSWORD = 8;

function readCredentials(formData: FormData) {
  return {
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    password: String(formData.get("password") ?? ""),
  };
}

function authMessage(code: string | undefined): string {
  switch (code) {
    case "invalid_credentials":
      return "Email ou mot de passe incorrect. Vérifie et réessaie.";
    case "email_not_confirmed":
      return "Confirme d’abord ton email avec le lien reçu, puis reconnecte-toi.";
    case "user_already_exists":
    case "email_exists":
      return "Un compte existe déjà avec cet email. Connecte-toi plutôt.";
    case "weak_password":
      return `Choisis un mot de passe plus solide (au moins ${MIN_PASSWORD} caractères).`;
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Trop de tentatives. Patiente quelques minutes, puis réessaie.";
    default:
      return "Quelque chose n’a pas marché. Réessaie dans un instant.";
  }
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const { email, password } = readCredentials(formData);

  if (!EMAIL_PATTERN.test(email)) return { email, error: "Indique une adresse email valide." };
  if (password.length < MIN_PASSWORD) {
    return { email, error: `Choisis un mot de passe d’au moins ${MIN_PASSWORD} caractères.` };
  }

  const origin = (await headers()).get("origin") ?? "";
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${origin}/auth/confirm` },
  });

  if (error) return { email, error: authMessage(error.code) };

  // Si la confirmation par email est activée, il n'y a pas encore de session.
  if (!data.session) {
    return {
      email,
      notice: `On t’a envoyé un email à ${email}. Clique sur le lien pour activer ton compte.`,
    };
  }

  redirect("/espace");
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const { email, password } = readCredentials(formData);

  if (!EMAIL_PATTERN.test(email) || !password) {
    return { email, error: "Indique ton email et ton mot de passe." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { email, error: authMessage(error.code) };

  redirect("/espace");
}
