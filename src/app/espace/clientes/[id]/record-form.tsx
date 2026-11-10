"use client";

import { useActionState, useState, type ReactNode } from "react";
import { Field, TextAreaField } from "@/components/field";
import { SubmitButton } from "@/components/submit-button";
import {
  CURLS,
  EFFECTS,
  EYE_SHAPES,
  LASH_TYPES,
  NATURAL_LASHES,
  THICKNESSES,
  VOLUMES,
  hasHealthInfo,
  type RecordValues,
} from "@/lib/client-record";
import { saveRecord } from "./actions";

type Props = { clientId: string; initial: RecordValues; hasHealthConsent: boolean; healthConsentDate: string | null };

const selectClass = "w-full rounded-[10px] border border-line bg-bg px-3 py-2.5 text-ink";
const row = "flex items-end gap-2.5 *:min-w-0 *:flex-1";

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="mt-4 border-t border-line pt-2">
      <legend className="pr-2 text-sm font-semibold">{title}</legend>
      {children}
    </fieldset>
  );
}

function Select({ name, label, options, value, error }: {
  name: string; label: string; options: readonly string[]; value: string; error?: string;
}) {
  return (
    <div className="mt-3">
      <label htmlFor={name} className="mb-1 block text-sm text-mute">{label}</label>
      <select id={name} name={name} defaultValue={value} aria-invalid={error ? true : undefined} className={selectClass}>
        <option value="">—</option>
        {/* Une ancienne valeur hors liste reste visible. */}
        {value && !options.includes(value) && <option value={value}>{value}</option>}
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-err">{error}</p>}
    </div>
  );
}

function Suggestions({ id, options }: { id: string; options: readonly string[] }) {
  return (
    <datalist id={id}>
      {options.map((o) => (
        <option key={o} value={o} />
      ))}
    </datalist>
  );
}

export function RecordForm({ clientId, initial, hasHealthConsent, healthConsentDate }: Props) {
  const [state, formAction] = useActionState(saveRecord.bind(null, clientId, hasHealthConsent), { values: initial });
  const v = state.values ?? initial;
  const e = state.errors ?? {};
  const [health, setHealth] = useState({ reactions: v.reactions, sensitiveEyes: v.sensitiveEyes, contactLenses: v.contactLenses });
  const mm = { inputMode: "decimal" as const, placeholder: "mm" };

  return (
    <form action={formAction} noValidate>
      <Group title="La pose">
        <Field name="eyeShape" label="Forme de l’œil" list="eye-shapes" defaultValue={v.eyeShape} error={e.eyeShape} />
        <Suggestions id="eye-shapes" options={EYE_SHAPES} />
        <div className={row}>
          <Field name="lashType" label="Technique" list="lash-types" defaultValue={v.lashType} error={e.lashType} />
          <Field name="effect" label="Effet" list="effects" defaultValue={v.effect} error={e.effect} />
        </div>
        <Suggestions id="lash-types" options={LASH_TYPES} />
        <Suggestions id="effects" options={EFFECTS} />
        <div className={row}>
          <Select name="volume" label="Volume" options={VOLUMES} value={v.volume} error={e.volume} />
          <Select name="curl" label="Courbure" options={CURLS} value={v.curl} error={e.curl} />
          <Field name="thickness" label="Épaisseur" list="thicknesses" inputMode="decimal" placeholder="0,07"
            defaultValue={v.thickness} error={e.thickness} />
        </div>
        <Suggestions id="thicknesses" options={THICKNESSES} />
        <div className={row}>
          <Field name="lengthMin" label="Longueur mini" {...mm} defaultValue={v.lengthMin} error={e.lengthMin} />
          <Field name="lengthMax" label="Longueur maxi" {...mm} defaultValue={v.lengthMax} error={e.lengthMax} />
        </div>
        <Field name="glue" label="Colle" placeholder="Marque, référence…" defaultValue={v.glue} error={e.glue} />
      </Group>

      <Group title="Mapping (longueur par zone, en mm)">
        <div className={row}>
          <Field name="mappingInner" label="Coin interne" {...mm} defaultValue={v.mappingInner} error={e.mappingInner} />
          <Field name="mappingMiddle" label="Milieu" {...mm} defaultValue={v.mappingMiddle} error={e.mappingMiddle} />
          <Field name="mappingOuter" label="Coin externe" {...mm} defaultValue={v.mappingOuter} error={e.mappingOuter} />
        </div>
      </Group>

      <Group title="Cils naturels et santé">
        <div className={row}>
          <Field name="naturalLashes" label="Cils naturels" list="natural-lashes" defaultValue={v.naturalLashes}
            error={e.naturalLashes} />
          <Field name="patchTestOn" label="Test d’allergie fait le" type="date" defaultValue={v.patchTestOn}
            error={e.patchTestOn} />
        </div>
        <Suggestions id="natural-lashes" options={NATURAL_LASHES} />
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="sensitiveEyes" checked={health.sensitiveEyes}
              onChange={(ev) => setHealth((h) => ({ ...h, sensitiveEyes: ev.target.checked }))}
              className="size-[18px] accent-acc" />
            Yeux sensibles
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="contactLenses" checked={health.contactLenses}
              onChange={(ev) => setHealth((h) => ({ ...h, contactLenses: ev.target.checked }))}
              className="size-[18px] accent-acc" />
            Porte des lentilles
          </label>
        </div>
        <TextAreaField name="reactions" label="Allergies et réactions" value={health.reactions}
          onChange={(ev) => setHealth((h) => ({ ...h, reactions: ev.target.value }))} error={e.reactions} />
        {hasHealthConsent ? (
          <p className="mt-1 text-sm text-mute">
            Accord de la cliente pour ses informations de santé{healthConsentDate ? ` : ${healthConsentDate}` : ""}.
          </p>
        ) : (
          hasHealthInfo(health) && (
            <label className="mt-2 flex items-start gap-2.5 text-sm">
              <input type="checkbox" name="healthConsent" className="mt-0.5 size-5 shrink-0 accent-acc"
                aria-invalid={e.healthConsent ? true : undefined} />
              <span>Ma cliente est d’accord pour que je note ces informations de santé.</span>
            </label>
          )
        )}
        {e.healthConsent && <p className="mt-1 text-sm text-err">{e.healthConsent}</p>}
      </Group>

      <Group title="Notes">
        <TextAreaField name="notes" label="Préférences, remarques…" defaultValue={v.notes} error={e.notes} />
      </Group>

      <p role="alert" className="mt-2 min-h-[1.2em] text-sm text-err">
        {state.error ?? (state.errors && Object.keys(state.errors).length ? "Corrige les champs en rouge, puis enregistre." : "")}
      </p>
      {state.saved && <p role="status" className="mb-2 text-sm font-semibold text-ok-ink">La fiche est enregistrée.</p>}
      <SubmitButton pendingLabel="Enregistrement…">Enregistrer la fiche</SubmitButton>
    </form>
  );
}
