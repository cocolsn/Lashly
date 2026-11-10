"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { PHOTO_BUCKET, PHOTO_KINDS, fitWithin, type PhotoKind } from "@/lib/photos";
import { createClient } from "@/lib/supabase/browser";
import { deletePhoto } from "./actions";

export type Photo = { id: string; kind: PhotoKind; url: string | null };

type Props = { proId: string; clientId: string; bookingId: string; photos: Photo[] };

/** Réduit la photo dans le navigateur (≈ 300 Ko au lieu de plusieurs Mo) et la convertit en JPEG. */
async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const { width, height } = fitWithin(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("conversion"))), "image/jpeg", 0.85),
  );
}

export function BookingPhotos({ proId, clientId, bookingId, photos }: Props) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<PhotoKind>("before");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const pick = (k: PhotoKind) => {
    setKind(k);
    input.current?.click();
  };

  const upload = async (file: File) => {
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const path = `${proId}/${clientId}/${crypto.randomUUID()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from(PHOTO_BUCKET)
        .upload(path, await shrink(file), { contentType: "image/jpeg" });
      if (uploadError) throw uploadError;
      const { error: rowError } = await supabase
        .from("booking_photos")
        .insert({ pro_id: proId, booking_id: bookingId, storage_path: path, kind });
      if (rowError) {
        await supabase.storage.from(PHOTO_BUCKET).remove([path]);
        throw rowError;
      }
      startTransition(() => router.refresh());
    } catch {
      setError("La photo n’a pas pu être ajoutée. Vérifie ta connexion et réessaie (image JPEG ou PNG).");
    } finally {
      setBusy(false);
    }
  };

  const remove = (photo: Photo) => {
    if (!window.confirm(`Supprimer cette photo « ${PHOTO_KINDS[photo.kind].toLowerCase()} » ?`)) return;
    startTransition(async () => {
      const result = await deletePhoto(clientId, photo.id);
      if (result.error) setError(result.error);
    });
  };

  return (
    <div className="mt-2">
      {photos.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-2">
          {photos.map((p) => (
            <li key={p.id} className="relative">
              <a href={p.url ?? undefined} target="_blank" rel="noreferrer" className="block">
                {/* Photo privée servie par une adresse temporaire : pas d'optimisation Next/Image. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url ?? ""} alt={`Photo ${PHOTO_KINDS[p.kind].toLowerCase()}`}
                  className="size-20 rounded-btn border border-line bg-bg object-cover" />
              </a>
              <span className="absolute bottom-1 left-1 rounded bg-surface/90 px-1 text-xs font-semibold">
                {PHOTO_KINDS[p.kind]}
              </span>
              <button type="button" onClick={() => remove(p)} aria-label={`Supprimer la photo ${PHOTO_KINDS[p.kind].toLowerCase()}`}
                className="absolute -top-2 -right-2 grid size-6 cursor-pointer place-items-center rounded-full border border-line bg-surface text-xs text-err">
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
      <input ref={input} type="file" accept="image/*" className="hidden"
        onChange={(ev) => {
          const file = ev.target.files?.[0];
          ev.target.value = "";
          if (file) void upload(file);
        }} />
      <div className="flex gap-2">
        {(Object.keys(PHOTO_KINDS) as PhotoKind[]).map((k) => (
          <button key={k} type="button" disabled={busy} onClick={() => pick(k)}
            className="cursor-pointer rounded-btn border border-line bg-ok px-2.5 py-1 text-sm font-semibold text-ok-ink disabled:cursor-wait disabled:opacity-60">
            {busy && kind === k ? "Envoi…" : `+ Photo ${PHOTO_KINDS[k].toLowerCase()}`}
          </button>
        ))}
      </div>
      {error && <p role="alert" className="mt-1 text-sm text-err">{error}</p>}
    </div>
  );
}
