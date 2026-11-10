"use client";

import { useActionState } from "react";
import { Field } from "@/components/field";
import { SubmitButton } from "@/components/submit-button";
import { saveContact, type ContactValues } from "./actions";

export function ContactForm({ clientId, initial }: { clientId: string; initial: ContactValues }) {
  const [state, formAction] = useActionState(saveContact.bind(null, clientId), { values: initial });
  const v = state.values ?? initial;
  const e = state.errors ?? {};
  return (
    <form action={formAction} noValidate>
      <Field name="fullName" label="Prénom et nom" autoComplete="off" defaultValue={v.fullName} error={e.fullName} />
      <div className="flex flex-wrap gap-x-2.5 *:min-w-[180px] *:flex-1">
        <Field name="phone" label="Téléphone" type="tel" defaultValue={v.phone} error={e.phone} />
        <Field name="email" label="Email" type="email" defaultValue={v.email} error={e.email} />
      </div>
      <p role="alert" className="mt-2 min-h-[1.2em] text-sm text-err">{state.error}</p>
      {state.saved && <p role="status" className="mb-2 text-sm font-semibold text-ok-ink">C’est enregistré.</p>}
      <SubmitButton pendingLabel="Enregistrement…">Enregistrer les coordonnées</SubmitButton>
    </form>
  );
}
