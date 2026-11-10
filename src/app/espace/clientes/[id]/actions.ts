"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseDecimal, validateRecord, type RecordErrors, type RecordValues } from "@/lib/client-record";
import { PHOTO_BUCKET } from "@/lib/photos";
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
  const text = (key: string) => String(formData.get(key) ?? "").trim();
  const values: RecordValues = {
    lashType: text("lashType"),
    effect: text("effect"),
    volume: text("volume"),
    curl: text("curl"),
    thickness: text("thickness"),
    lengthMin: text("lengthMin"),
    lengthMax: text("lengthMax"),
    mappingInner: text("mappingInner"),
    mappingMiddle: text("mappingMiddle"),
    mappingOuter: text("mappingOuter"),
    glue: text("glue"),
    eyeShape: text("eyeShape"),
    naturalLashes: text("naturalLashes"),
    sensitiveEyes: formData.get("sensitiveEyes") === "on",
    contactLenses: formData.get("contactLenses") === "on",
    patchTestOn: text("patchTestOn"),
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
      effect: values.effect || null,
      volume: values.volume || null,
      curl: values.curl || null,
      thickness: parseDecimal(values.thickness),
      length_min_mm: parseDecimal(values.lengthMin),
      length_max_mm: parseDecimal(values.lengthMax),
      mapping_inner_mm: parseDecimal(values.mappingInner),
      mapping_middle_mm: parseDecimal(values.mappingMiddle),
      mapping_outer_mm: parseDecimal(values.mappingOuter),
      glue: values.glue || null,
      eye_shape: values.eyeShape || null,
      natural_lashes: values.naturalLashes || null,
      sensitive_eyes: values.sensitiveEyes,
      contact_lenses: values.contactLenses,
      patch_test_on: values.patchTestOn || null,
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
  const { supabase, userId } = await requireUser();

  // Photos : les fichiers ne sont pas supprimés automatiquement avec la base, on les efface d'abord.
  const folder = `${userId}/${clientId}`;
  const { data: files } = await supabase.storage.from(PHOTO_BUCKET).list(folder, { limit: 1000 });
  if (files?.length) {
    await supabase.storage.from(PHOTO_BUCKET).remove(files.map((f) => `${folder}/${f.name}`));
  }

  // La fiche, les rendez-vous et les photos (lignes) partent avec la cliente (on delete cascade).
  await supabase.from("clients").delete().eq("id", clientId);
  revalidatePath("/espace/clientes");
  redirect("/espace/clientes");
}

// --- Photos ---

export async function deletePhoto(clientId: string, photoId: string): Promise<{ error?: string }> {
  const { supabase } = await requireUser();
  const { data: photo } = await supabase.from("booking_photos").select("storage_path").eq("id", photoId).maybeSingle();
  if (!photo) return { error: "Cette photo n’existe plus. Recharge la page." };

  const { error: fileError } = await supabase.storage.from(PHOTO_BUCKET).remove([photo.storage_path]);
  const { error } = await supabase.from("booking_photos").delete().eq("id", photoId);
  if (fileError || error) return { error: "La suppression n’a pas marché. Réessaie dans un instant." };

  revalidatePath(`/espace/clientes/${clientId}`);
  return {};
}

export async function refreshClient(clientId: string) {
  revalidatePath(`/espace/clientes/${clientId}`);
}
