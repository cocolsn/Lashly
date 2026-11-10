"use client";

import { deleteService } from "./actions";

export function DeleteServiceButton({ id, name }: { id: string; name: string }) {
  return (
    <form
      action={deleteService.bind(null, id)}
      onSubmit={(e) => {
        if (!window.confirm(`Supprimer « ${name} » ?`)) e.preventDefault();
      }}
    >
      <button
        type="submit"
        className="cursor-pointer rounded-btn border border-line bg-surface px-3.5 py-2 font-semibold text-err"
      >
        Supprimer
      </button>
    </form>
  );
}
