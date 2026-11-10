"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { slugError } from "@/lib/slug";
import { createClient } from "@/lib/supabase/server";

export type StudioValues = {
  studio_name: string;
  city: string;
  phone: string;
  slug: string;
};

export type StudioState = {
  values?: StudioValues;
  fieldErrors?: Partial<Record<keyof StudioValues, string>>;
  error?: string;
  saved?: boolean;
};

function readValues(formData: FormData): StudioValues {
  const text = (key: keyof StudioValues) => String(formData.get(key) ?? "").trim();
  return {
    studio_name: text("studio_name").replace(/\s+/g, " "),
    city: text("city").replace(/\s+/g, " "),
    phone: text("phone"),
    slug: text("slug").toLowerCase(),
  };
}

function validate(values: StudioValues): StudioState["fieldErrors"] {
  const errors: StudioState["fieldErrors"] = {};
  if (values.studio_name.length < 2 || values.studio_name.length > 80) {
    errors.studio_name = "Indique le nom de ton studio (2 à 80 caractères).";
  }
  if (values.city.length < 2 || values.city.length > 80) {
    errors.city = "Indique la ville de ton studio.";
  }
  const digits = values.phone.replace(/\D/g, "");
  if (values.phone && (!/^[+\d\s.()-]+$/.test(values.phone) || digits.length < 9 || digits.length > 15)) {
    errors.phone = "Indique un numéro valide, par exemple 06 12 34 56 78.";
  }
  const slug = slugError(values.slug);
  if (slug) errors.slug = slug;
  return errors;
}

export async function saveStudio(_prev: StudioState, formData: FormData): Promise<StudioState> {
  const values = readValues(formData);
  const fieldErrors = validate(values);
  if (fieldErrors && Object.keys(fieldErrors).length > 0) return { values, fieldErrors };

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;
  if (!userId) redirect("/connexion");

  const { error } = await supabase.from("pros").upsert({
    id: userId,
    studio_name: values.studio_name,
    city: values.city,
    phone: values.phone || null,
    slug: values.slug,
  });

  if (error?.code === "23505") {
    return {
      values,
      fieldErrors: { slug: "Cette adresse est déjà prise. Ajoute ta ville ou ton prénom, par exemple." },
    };
  }
  if (error) return { values, error: "L’enregistrement n’a pas marché. Réessaie dans un instant." };

  revalidatePath("/espace");
  return { values, saved: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/connexion");
}
