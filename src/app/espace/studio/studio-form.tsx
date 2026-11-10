"use client";

import { useActionState, useState } from "react";
import { Field } from "@/components/field";
import { SubmitButton } from "@/components/submit-button";
import { slugify } from "@/lib/slug";
import { saveStudio, type StudioValues } from "./actions";

type StudioFormProps = {
  initial: StudioValues | null;
  siteHost: string;
};

export function StudioForm({ initial, siteHost }: StudioFormProps) {
  const [state, formAction] = useActionState(saveStudio, { values: initial ?? undefined });
  const values = state.values;
  const errors = state.fieldErrors ?? {};

  // Tant que la pro n'a pas modifié l'adresse elle-même, on la propose à partir du nom.
  const [slug, setSlug] = useState(values?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial));

  return (
    <form action={formAction} noValidate>
      {!initial && <input type="hidden" name="is_new" value="1" />}
      <Field
        name="studio_name"
        label="Nom du studio"
        autoComplete="organization"
        required
        placeholder="Ex. Les Cils d’Émilie"
        defaultValue={values?.studio_name}
        error={errors.studio_name}
        onChange={(e) => {
          if (!slugTouched) setSlug(slugify(e.target.value));
        }}
      />
      <Field
        name="city"
        label="Ville"
        autoComplete="address-level2"
        required
        placeholder="Ex. Melun"
        defaultValue={values?.city}
        error={errors.city}
      />
      <Field
        name="phone"
        label="Téléphone (facultatif)"
        type="tel"
        autoComplete="tel"
        placeholder="06 12 34 56 78"
        defaultValue={values?.phone}
        error={errors.phone}
      />
      <Field
        name="slug"
        label="Adresse de ta page de réservation"
        required
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        value={slug}
        onChange={(e) => {
          setSlugTouched(true);
          setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"));
        }}
        hint={`${siteHost}/${slug || "ton-studio"}`}
        error={errors.slug}
      />

      <p role="alert" className="mt-3 min-h-[1.5em] text-sm text-err">
        {state.error}
      </p>
      {state.saved && (
        <p role="status" className="mb-3 rounded-btn bg-ok px-3 py-2 text-sm font-semibold text-ok-ink">
          C’est enregistré.
        </p>
      )}
      <SubmitButton pendingLabel="Enregistrement…">
        {initial ? "Enregistrer" : "Créer mon studio"}
      </SubmitButton>
    </form>
  );
}
