"use server";

import { createClient } from "@/lib/supabase/server";

export async function getSlots(slug: string, serviceId: string, withAddon: boolean): Promise<string[] | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_available_slots", {
    p_slug: slug,
    p_service_id: serviceId,
    p_with_addon: withAddon,
  });
  return error ? null : (data ?? []);
}

export type BookingInput = {
  slug: string;
  serviceId: string;
  withAddon: boolean;
  startsAt: string;
  fullName: string;
  phone: string;
  email: string;
  reactions: string;
  consent: boolean;
  healthConsent: boolean;
};

export type BookingField = "fullName" | "phone" | "email" | "reactions" | "consent" | "healthConsent";

export type BookingResult =
  | { ok: true }
  | { ok: false; message: string; field?: BookingField; slotLost?: boolean };

// Codes renvoyés par la fonction create_booking (voir supabase/migrations).
const ERRORS: Record<string, { message: string; field?: BookingField; slotLost?: boolean }> = {
  consent_required: { field: "consent", message: "Coche la case pour accepter l’utilisation de tes données." },
  health_consent_required: {
    field: "healthConsent",
    message: "Coche la case pour que le studio puisse garder tes allergies, ou vide ce champ.",
  },
  invalid_name: { field: "fullName", message: "Indique ton prénom et ton nom." },
  invalid_phone: { field: "phone", message: "Indique un numéro de téléphone valide, par exemple 06 12 34 56 78." },
  invalid_email: { field: "email", message: "Indique une adresse email valide." },
  invalid_reactions: { field: "reactions", message: "Raccourcis le texte sur tes allergies (1 000 caractères maximum)." },
  slot_unavailable: { slotLost: true, message: "Ce créneau vient d’être pris ou n’est plus disponible. Choisis-en un autre." },
  slot_taken: { slotLost: true, message: "Ce créneau vient d’être pris par une autre cliente. Choisis-en un autre." },
  service_not_found: { message: "Cette prestation n’est plus proposée. Recharge la page." },
  studio_not_found: { message: "Ce studio n’existe plus. Vérifie l’adresse de la page." },
};

export async function createBooking(input: BookingInput): Promise<BookingResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("create_booking", {
    p_slug: input.slug,
    p_service_id: input.serviceId,
    p_with_addon: input.withAddon,
    p_starts_at: input.startsAt,
    p_full_name: input.fullName,
    p_phone: input.phone,
    p_email: input.email,
    p_reactions: input.reactions,
    p_consent: input.consent,
    p_health_consent: input.healthConsent,
  });

  if (!error) return { ok: true };
  return {
    ok: false,
    ...(ERRORS[error.message] ?? { message: "La réservation n’a pas marché. Réessaie dans un instant." }),
  };
}
