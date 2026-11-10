"use client";

import { deleteClient } from "./actions";

export function DeleteClientButton({ id, name }: { id: string; name: string }) {
  return (
    <form
      action={deleteClient.bind(null, id)}
      onSubmit={(e) => {
        const ok = window.confirm(
          `Supprimer définitivement ${name} ? Sa fiche et tout son historique de rendez-vous seront effacés. C’est irréversible.`,
        );
        if (!ok) e.preventDefault();
      }}
    >
      <button type="submit" className="cursor-pointer rounded-btn border border-line bg-surface px-3.5 py-2 text-sm font-semibold text-err">
        Supprimer la cliente
      </button>
    </form>
  );
}
