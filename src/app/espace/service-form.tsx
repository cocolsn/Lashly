"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { Field, TextAreaField } from "@/components/field";
import { SubmitButton } from "@/components/submit-button";
import { centsToInput } from "@/lib/format";
import { SERVICE_PRESETS } from "@/lib/service-presets";
import { saveService, type ServiceValues } from "./actions";

export type EditableService = {
  id: string;
  name: string;
  duration_min: number;
  price_cents: number;
  description: string | null;
  active: boolean;
};

function toValues(service: EditableService | null): ServiceValues {
  if (!service) return { name: "", duration: "60", price: "", description: "", active: true };
  return {
    name: service.name,
    duration: String(service.duration_min),
    price: centsToInput(service.price_cents),
    description: service.description ?? "",
    active: service.active,
  };
}

export function ServiceForm({ service }: { service: EditableService | null }) {
  const [state, formAction] = useActionState(saveService, {});
  const [values, setValues] = useState<ServiceValues>(() => toValues(service));
  const priceRef = useRef<HTMLInputElement>(null);
  const errors = state.fieldErrors ?? {};

  const set = <K extends keyof ServiceValues>(key: K, value: ServiceValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  return (
    <form action={formAction} noValidate>
      {service && <input type="hidden" name="id" value={service.id} />}

      {!service && (
        <>
          <p className="mt-1 mb-2 text-sm text-mute">Ajouter rapidement, puis ajuste le prix :</p>
          <div className="mb-1 flex flex-wrap gap-1.5">
            {SERVICE_PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                className="cursor-pointer rounded-full border border-line bg-ok px-3 py-1.5 text-sm text-ok-ink"
                onClick={() => {
                  setValues((v) => ({
                    ...v,
                    name: preset.name,
                    duration: String(preset.duration),
                    description: preset.description,
                    price: "",
                  }));
                  priceRef.current?.focus();
                }}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </>
      )}

      <Field
        name="name"
        label="Nom"
        required
        placeholder="Ex. Volume mixte"
        value={values.name}
        onChange={(e) => set("name", e.target.value)}
        error={errors.name}
      />
      <div className="flex gap-2.5 *:flex-1">
        <Field
          name="duration"
          label="Durée (minutes)"
          type="number"
          inputMode="numeric"
          min={15}
          max={600}
          step={5}
          required
          value={values.duration}
          onChange={(e) => set("duration", e.target.value)}
          error={errors.duration}
        />
        <Field
          ref={priceRef}
          name="price"
          label="Prix (€)"
          inputMode="decimal"
          required
          placeholder="Ex. 80"
          value={values.price}
          onChange={(e) => set("price", e.target.value)}
          error={errors.price}
        />
      </div>
      <TextAreaField
        name="description"
        label="Description visible par la cliente"
        placeholder="Ex. Pose naturelle, effet mascara…"
        value={values.description}
        onChange={(e) => set("description", e.target.value)}
        error={errors.description}
      />
      <label className="mt-3 flex items-center gap-2.5">
        <input
          type="checkbox"
          name="active"
          checked={values.active}
          onChange={(e) => set("active", e.target.checked)}
          className="size-[18px] accent-acc"
        />
        Visible par les clientes
      </label>

      <p role="alert" className="mt-3 min-h-[1.5em] text-sm text-err">
        {state.error}
      </p>
      <div className="flex flex-wrap gap-2">
        <div className="flex-1">
          <SubmitButton pendingLabel="Enregistrement…">
            {service ? "Enregistrer" : "Ajouter la prestation"}
          </SubmitButton>
        </div>
        {service && (
          <Link
            href="/espace"
            className="rounded-btn border border-line bg-surface px-4 py-3 font-semibold no-underline"
          >
            Annuler
          </Link>
        )}
      </div>
    </form>
  );
}
