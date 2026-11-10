"use client";

import { useState, useTransition } from "react";
import { cancelBooking } from "./actions";

export function CancelButton({ id, label }: { id: string; label: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!window.confirm(`Annuler le rendez-vous de ${label} ? Le créneau redeviendra disponible.`)) return;
          startTransition(async () => setError((await cancelBooking(id)).error ?? null));
        }}
        className="cursor-pointer rounded-btn border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-err disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? "Annulation…" : "Annuler le rendez-vous"}
      </button>
      {error && (
        <p role="alert" className="mt-1 text-sm text-err">
          {error}
        </p>
      )}
    </>
  );
}
