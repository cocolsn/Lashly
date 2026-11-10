import "server-only";
import { decimalToInput, type RecordValues } from "@/lib/client-record";
import { PHOTO_BUCKET, type PhotoKind } from "@/lib/photos";
import { createClient } from "@/lib/supabase/server";
import type { Photo } from "./[id]/booking-photos";

export type HistoryItem = {
  id: string;
  starts_at: string;
  service_name: string;
  addon_name: string | null;
  price_cents: number;
  status: string;
  photos: Photo[];
};

export type Dossier = Awaited<ReturnType<typeof loadDossier>>;

/** Tout le dossier d'une cliente : coordonnées, fiche, historique avec photos, et résumé des visites. */
export async function loadDossier(clientId: string) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const proId = claims?.claims.sub;
  if (!proId) return null;

  const { data: client } = await supabase
    .from("clients")
    .select(
      `id, full_name, phone, email, consent_at,
       client_records(lash_type, effect, volume, curl, thickness, length_min_mm, length_max_mm, mapping_inner_mm,
         mapping_middle_mm, mapping_outer_mm, glue, eye_shape, natural_lashes, sensitive_eyes, contact_lenses,
         patch_test_on, reactions, health_consent_at, notes),
       bookings(id, starts_at, service_name, addon_name, price_cents, status, booking_photos(id, kind, storage_path, created_at))`,
    )
    .eq("id", clientId)
    .order("starts_at", { referencedTable: "bookings", ascending: false })
    .maybeSingle();
  if (!client) return null;

  // Adresses temporaires (1 h) pour afficher les photos privées.
  const paths = client.bookings.flatMap((b) => b.booking_photos.map((p) => p.storage_path));
  const { data: signed } = paths.length
    ? await supabase.storage.from(PHOTO_BUCKET).createSignedUrls(paths, 3600)
    : { data: [] };
  const urlOf = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]));

  const history: HistoryItem[] = client.bookings.map((b) => ({
    id: b.id,
    starts_at: b.starts_at,
    service_name: b.service_name,
    addon_name: b.addon_name,
    price_cents: b.price_cents,
    status: b.status,
    photos: [...b.booking_photos]
      .sort((a, b2) => a.created_at.localeCompare(b2.created_at))
      .map((p) => ({ id: p.id, kind: p.kind as PhotoKind, url: urlOf.get(p.storage_path) ?? null })),
  }));

  const now = Date.now();
  const past = history.filter((b) => b.status !== "cancelled" && b.status !== "no_show" && Date.parse(b.starts_at) <= now);
  const upcoming = history
    .filter((b) => b.status === "confirmed" && Date.parse(b.starts_at) > now)
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));

  const r = client.client_records;
  const record: RecordValues = {
    lashType: r?.lash_type ?? "",
    effect: r?.effect ?? "",
    volume: r?.volume ?? "",
    curl: r?.curl ?? "",
    thickness: decimalToInput(r?.thickness ?? null, 2),
    lengthMin: decimalToInput(r?.length_min_mm ?? null),
    lengthMax: decimalToInput(r?.length_max_mm ?? null),
    mappingInner: decimalToInput(r?.mapping_inner_mm ?? null),
    mappingMiddle: decimalToInput(r?.mapping_middle_mm ?? null),
    mappingOuter: decimalToInput(r?.mapping_outer_mm ?? null),
    glue: r?.glue ?? "",
    eyeShape: r?.eye_shape ?? "",
    naturalLashes: r?.natural_lashes ?? "",
    sensitiveEyes: r?.sensitive_eyes ?? false,
    contactLenses: r?.contact_lenses ?? false,
    patchTestOn: r?.patch_test_on ?? "",
    reactions: r?.reactions ?? "",
    notes: r?.notes ?? "",
  };

  return {
    proId,
    client: { id: client.id, full_name: client.full_name, phone: client.phone, email: client.email, consent_at: client.consent_at },
    record,
    healthConsentAt: r?.health_consent_at ?? null,
    history,
    visits: { count: past.length, first: past.at(-1)?.starts_at ?? null, last: past[0]?.starts_at ?? null },
    next: upcoming[0]?.starts_at ?? null,
  };
}
