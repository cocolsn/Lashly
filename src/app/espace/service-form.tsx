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
  addon_name: string | null;
  addon_price_cents: number | null;
  addon_duration_min: number | null;
};

function toValues(service: EditableService | null): ServiceValues {
  if (!service) {
    return {
      name: "",
      duration: "60",
      price: "",
      description: "",
      active: true,
      hasAddon: false,
      addonName: "",
      addonPrice: "",
      addonDuration: "15",
    };
  }
  return {
    name: service.name,
    duration: String(service.duration_min),
    price: centsToInput(service.price_cents),
    description: service.description ?? "",
    active: service.active,
    hasAddon: service.addon_name !== null,
    addonName: service.addon_name ?? "",
    addonPrice: service.addon_price_cents === null ? "" : centsToInput(service.addon_price_cents),
    addonDuration: String(service.addon_duration_min ?? 15),
  };
}

export function ServiceForm({ service }: { service: EditableService | null }) {
  const [state, formAction] = useActionState(saveService, {});
  const [values, setValues] = useState<ServiceValues>(() => toValues(service));
  const [preset, setPreset] = useState<string | null>(null);
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
            {SERVICE_PRESETS.map((p) => {
              const selected = preset === p.name;
              return (
                <button
                  key={p.name}
                  type="button"
                  aria-pressed={selected}
                  className={`cursor-pointer rounded-full border bg-ok px-3 py-1.5 text-sm text-ok-ink ${
                    selected ? "border-ink ring-1 ring-ink" : "border-line"
                  }`}
                  onClick={() => {
                    setPreset(p.name);
                    setValues((v) => ({
                      ...v,
                      name: p.name,
                      duration: String(p.duration),
                      description: p.description,
                      price: "",
                      hasAddon: Boolean(p.addon),
                      addonName: p.addon?.name ?? "",
                      addonPrice: "",
                      addonDuration: String(p.addon?.duration ?? 15),
                    }));
                    priceRef.current?.focus();
                  }}
                >
                  {p.name}
                </button>
              );
            })}
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
      <fieldset className="mt-4 rounded-card border border-line px-3 pb-3">
        <legend className="px-1 text-sm text-mute">Option (facultatif)</legend>
        <label className="flex items-center gap-2.5">
          <input
            type="checkbox"
            name="has_addon"
            checked={values.hasAddon}
            onChange={(e) => set("hasAddon", e.target.checked)}
            className="size-[18px] accent-acc"
          />
          Proposer une option en plus, ex. + teinture de cils
        </label>
        {values.hasAddon && (
          <>
            <Field
              name="addon_name"
              label="Nom de l’option"
              required
              placeholder="Ex. Teinture de cils"
              value={values.addonName}
              onChange={(e) => set("addonName", e.target.value)}
              error={errors.addonName}
            />
            <div className="flex gap-2.5 *:flex-1">
              <Field
                name="addon_price"
                label="Prix en plus (€)"
                inputMode="decimal"
                required
                placeholder="Ex. 15"
                value={values.addonPrice}
                onChange={(e) => set("addonPrice", e.target.value)}
                error={errors.addonPrice}
              />
              <Field
                name="addon_duration"
                label="Temps en plus (min)"
                type="number"
                inputMode="numeric"
                min={0}
                max={120}
                step={5}
                required
                value={values.addonDuration}
                onChange={(e) => set("addonDuration", e.target.value)}
                error={errors.addonDuration}
              />
            </div>
          </>
        )}
      </fieldset>

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
