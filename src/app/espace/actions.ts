"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parsePriceToCents } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export type ServiceValues = {
  name: string;
  duration: string;
  price: string;
  description: string;
  active: boolean;
  hasAddon: boolean;
  addonName: string;
  addonPrice: string;
  addonDuration: string;
};

export type ServiceState = {
  values?: ServiceValues;
  fieldErrors?: Partial<Record<keyof ServiceValues, string>>;
  error?: string;
};

async function requireUserId() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) redirect("/connexion");
  return { supabase, userId };
}

export async function saveService(_prev: ServiceState, formData: FormData): Promise<ServiceState> {
  const id = String(formData.get("id") ?? "");
  const values: ServiceValues = {
    name: String(formData.get("name") ?? "").trim().replace(/\s+/g, " "),
    duration: String(formData.get("duration") ?? "").trim(),
    price: String(formData.get("price") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    active: formData.get("active") === "on",
    hasAddon: formData.get("has_addon") === "on",
    addonName: String(formData.get("addon_name") ?? "").trim().replace(/\s+/g, " "),
    addonPrice: String(formData.get("addon_price") ?? "").trim(),
    addonDuration: String(formData.get("addon_duration") ?? "").trim(),
  };

  const fieldErrors: ServiceState["fieldErrors"] = {};
  if (values.name.length < 2 || values.name.length > 80) {
    fieldErrors.name = "Indique le nom de la prestation (2 à 80 caractères).";
  }
  const duration = Number(values.duration);
  if (!Number.isInteger(duration) || duration < 15 || duration > 600 || duration % 5 !== 0) {
    fieldErrors.duration = "Indique une durée de 15 à 600 minutes (par 5 minutes).";
  }
  const priceCents = parsePriceToCents(values.price);
  if (priceCents === null || priceCents > 100000) {
    fieldErrors.price = "Indique un prix en euros, par exemple 80 ou 45,50.";
  }
  if (values.description.length > 1000) {
    fieldErrors.description = "La description doit faire 1 000 caractères maximum.";
  }
  const addonPriceCents = values.hasAddon ? parsePriceToCents(values.addonPrice) : null;
  const addonDuration = Number(values.addonDuration);
  if (values.hasAddon) {
    if (values.addonName.length < 2 || values.addonName.length > 80) {
      fieldErrors.addonName = "Indique le nom de l’option (2 à 80 caractères).";
    }
    if (addonPriceCents === null || addonPriceCents > 100000) {
      fieldErrors.addonPrice = "Indique le prix de l’option en euros, par exemple 15.";
    }
    if (!Number.isInteger(addonDuration) || addonDuration < 0 || addonDuration > 120 || addonDuration % 5 !== 0) {
      fieldErrors.addonDuration = "Indique de 0 à 120 minutes (par 5 minutes).";
    }
  }
  if (Object.keys(fieldErrors).length > 0 || priceCents === null) return { values, fieldErrors };

  const { supabase, userId } = await requireUserId();
  const row = {
    name: values.name,
    duration_min: duration,
    price_cents: priceCents,
    description: values.description || null,
    active: values.active,
    addon_name: values.hasAddon ? values.addonName : null,
    addon_price_cents: values.hasAddon ? addonPriceCents : null,
    addon_duration_min: values.hasAddon ? addonDuration : null,
  };

  let error;
  if (id) {
    ({ error } = await supabase.from("services").update(row).eq("id", id));
  } else {
    const { data: last } = await supabase
      .from("services")
      .select("position")
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();
    ({ error } = await supabase
      .from("services")
      .insert({ ...row, pro_id: userId, position: (last?.position ?? 0) + 1 }));
  }

  if (error) return { values, error: "L’enregistrement n’a pas marché. Réessaie dans un instant." };

  revalidatePath("/espace");
  redirect("/espace");
}

export async function deleteService(id: string) {
  const { supabase } = await requireUserId();
  await supabase.from("services").delete().eq("id", id);
  revalidatePath("/espace");
  redirect("/espace");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/connexion");
}
