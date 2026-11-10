"use client";

import { useActionState, useState } from "react";
import { Field, TextAreaField } from "@/components/field";
import { SubmitButton } from "@/components/submit-button";
import { CURLS, LASH_TYPES, THICKNESSES, type RecordValues } from "@/lib/client-record";
import { saveRecord } from "./actions";

type Props = { clientId: string; initial: RecordValues; hasHealthConsent: boolean; healthConsentDate: string | null };

export function RecordForm({ clientId, initial, hasHealthConsent, healthConsentDate }: Props) {
  const [state, formAction] = useActionState(saveRecord.bind(null, clientId, hasHealthConsent), { values: initial });
  const v = state.values ?? initial;
  const e = state.errors ?? {};
  const [reactions, setReactions] = useState(v.reactions);

  return (
    <form action={formAction} noValidate>
      <Field name="lashType" label="Type de pose" list="lash-types" defaultValue={v.lashType} error={e.lashType} />
      <datalist id="lash-types">
        {LASH_TYPES.map((t) => (
          <option key={t} value={t} />
        ))}
      </datalist>

      <div className="flex items-end gap-2.5 *:min-w-0 *:flex-1">
        <div className="mt-3">
          <label htmlFor="curl" className="mb-1 block text-sm text-mute">Courbure</label>
          <select id="curl" name="curl" defaultValue={v.curl} aria-invalid={e.curl ? true : undefined}
            className="w-full rounded-[10px] border border-line bg-bg px-3 py-2.5 text-ink">
            <option value="">—</option>
            {CURLS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {e.curl && <p className="mt-1 text-sm text-err">{e.curl}</p>}
        </div>
        <Field name="length" label="Longueur (mm)" inputMode="decimal" placeholder="Ex. 11" defaultValue={v.length} error={e.length} />
        <Field name="thickness" label="Épaisseur (mm)" inputMode="decimal" list="thicknesses" placeholder="Ex. 0,07"
          defaultValue={v.thickness} error={e.thickness} />
        <datalist id="thicknesses">
          {THICKNESSES.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
      </div>

      <Field name="glue" label="Colle" placeholder="Marque, référence…" defaultValue={v.glue} error={e.glue} />

      <TextAreaField name="reactions" label="Allergies et réactions (donnée de santé)" value={reactions}
        onChange={(ev) => setReactions(ev.target.value)} error={e.reactions} />
      {hasHealthConsent ? (
        <p className="mt-1 text-sm text-mute">
          Accord de la cliente enregistré{healthConsentDate ? ` le ${healthConsentDate}` : ""}.
        </p>
      ) : (
        reactions.trim() && (
          <label className="mt-2 flex items-start gap-2.5 text-sm">
            <input type="checkbox" name="healthConsent" className="mt-0.5 size-5 shrink-0 accent-acc"
              aria-invalid={e.healthConsent ? true : undefined} />
            <span>Ma cliente est d’accord pour que je note ses allergies et réactions.</span>
          </label>
        )
      )}
      {e.healthConsent && <p className="mt-1 text-sm text-err">{e.healthConsent}</p>}

      <TextAreaField name="notes" label="Notes" placeholder="Préférences, remarques…" defaultValue={v.notes} error={e.notes} />

      <p role="alert" className="mt-2 min-h-[1.2em] text-sm text-err">{state.error}</p>
      {state.saved && <p role="status" className="mb-2 text-sm font-semibold text-ok-ink">La fiche est enregistrée.</p>}
      <SubmitButton pendingLabel="Enregistrement…">Enregistrer la fiche</SubmitButton>
    </form>
  );
}
