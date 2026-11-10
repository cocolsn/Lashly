"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseDecimal, validateRecord, type RecordErrors, type RecordValues } from "@/lib/client-record";
import { createClient } from "@/lib/supabase/server";

const SAVE_FAILED = "L’enregistrement n’a pas marché. Réessaie dans un instant.";

async function requireUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) redirect("/connexion");
  return { supabase, userId };
}

// --- Coordonnées ---

export type ContactValues = { fullName: string; phone: string; email: string };
export type ContactState = {
  values?: ContactValues;
  errors?: Partial<Record<keyof ContactValues, string>>;
  error?: string;
  saved?: boolean;
};

export async function saveContact(clientId: string, _prev: ContactState, formData: FormData): Promise<ContactState> {
  const values: ContactValues = {
    fullName: String(formData.get("fullName") ?? "").trim().replace(/\s+/g, " "),
    phone: String(formData.get("phone") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
  };
  const errors: ContactState["errors"] = {};
  if (values.fullName.length < 2 || values.fullName.length > 120) errors.fullName = "Indique le prénom et le nom.";
  const digits = values.phone.replace(/\D/g, "").length;
  if (!/^[+\d\s.()-]+$/.test(values.phone) || digits < 9 || digits > 15) {
    errors.phone = "Indique un numéro valide, par exemple 06 12 34 56 78.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email) || values.email.length > 200) {
    errors.email = "Indique une adresse email valide.";
  }
  if (Object.keys(errors).length) return { values, errors };

  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("clients")
    .update({ full_name: values.fullName, phone: values.phone, email: values.email })
    .eq("id", clientId);
  if (error?.code === "23505") return { values, errors: { email: "Une autre de tes clientes a déjà cet email." } };
  if (error) return { values, error: SAVE_FAILED };

  revalidatePath(`/espace/clientes/${clientId}`);
  return { values, saved: true };
}

// --- Fiche technique et réactions ---

export type RecordState = { values?: RecordValues; errors?: RecordErrors; error?: string; saved?: boolean };

export async function saveRecord(
  clientId: string,
  hasHealthConsent: boolean,
  _prev: RecordState,
  formData: FormData,
): Promise<RecordState> {
  const text = (key: keyof RecordValues) => String(formData.get(key) ?? "").trim();
  const values: RecordValues = {
    lashType: text("lashType"),
    curl: text("curl"),
    length: text("length"),
    thickness: text("thickness"),
    glue: text("glue"),
    reactions: text("reactions"),
    notes: text("notes"),
  };
  const consentGiven = formData.get("healthConsent") === "on";
  const errors = validateRecord(values, hasHealthConsent, consentGiven);
  if (Object.keys(errors).length) return { values, errors };

  const { supabase, userId } = await requireUser();
  const { error } = await supabase.from("client_records").upsert(
    {
      pro_id: userId,
      client_id: clientId,
      lash_type: values.lashType || null,
      curl: values.curl || null,
      length_mm: parseDecimal(values.length),
      thickness: parseDecimal(values.thickness),
      glue: values.glue || null,
      reactions: values.reactions || null,
      notes: values.notes || null,
      ...(consentGiven && !hasHealthConsent ? { health_consent_at: new Date().toISOString() } : {}),
    },
    { onConflict: "client_id" },
  );
  if (error) return { values, error: SAVE_FAILED };

  revalidatePath(`/espace/clientes/${clientId}`);
  return { values, saved: true };
}

// --- Suppression (droit à l'effacement) ---

export async function deleteClient(clientId: string) {
  const { supabase } = await requireUser();
  // La fiche et les rendez-vous de la cliente sont supprimés avec elle (on delete cascade).
  await supabase.from("clients").delete().eq("id", clientId);
  revalidatePath("/espace/clientes");
  redirect("/espace/clientes");
}
