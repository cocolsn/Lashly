"use client";

import { useState, useTransition } from "react";
import { Field, TextAreaField } from "@/components/field";
import type { PublicService } from "@/lib/public-studio";
import { createBooking, type BookingField, type BookingInput, type BookingResult } from "./actions";
import { BookingSummary } from "./booking-summary";

export type Details = Pick<
  BookingInput,
  "fullName" | "phone" | "email" | "reactions" | "consent" | "healthConsent"
>;

export const EMPTY_DETAILS: Details = {
  fullName: "",
  phone: "",
  email: "",
  reactions: "",
  consent: false,
  healthConsent: false,
};

type Props = {
  slug: string;
  service: PublicService;
  withAddon: boolean;
  startsAt: string;
  details: Details;
  onDetails: (details: Details) => void;
  onBack: () => void;
  onDone: () => void;
  onSlotLost: (message: string) => void;
};

/** Vérifications immédiates, avant l'envoi (la base revérifie tout). */
function checkDetails(d: Details): { field: BookingField; message: string } | null {
  if (d.fullName.trim().length < 2) return { field: "fullName", message: "Indique ton prénom et ton nom." };
  if (d.phone.replace(/\D/g, "").length < 9) {
    return { field: "phone", message: "Indique un numéro de téléphone valide, par exemple 06 12 34 56 78." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) return { field: "email", message: "Indique une adresse email valide." };
  if (d.reactions.trim() && !d.healthConsent) {
    return {
      field: "healthConsent",
      message: "Coche la case pour que le studio puisse garder tes allergies, ou vide ce champ.",
    };
  }
  if (!d.consent) return { field: "consent", message: "Coche la case pour accepter l’utilisation de tes données." };
  return null;
}

export function StepDetails(props: Props) {
  const { slug, service, withAddon, startsAt, details: d, onDetails, onBack, onDone, onSlotLost } = props;
  const [error, setError] = useState<{ field?: BookingField; message: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const set = <K extends keyof Details>(key: K, value: Details[K]) => onDetails({ ...d, [key]: value });
  const fieldError = (field: BookingField) => (error?.field === field ? error.message : undefined);

  const submit = () => {
    const local = checkDetails(d);
    if (local) return setError(local);
    setError(null);
    startTransition(async () => {
      const result: BookingResult = await createBooking({
        slug,
        serviceId: service.id,
        withAddon,
        startsAt,
        ...d,
        reactions: d.reactions.trim(),
        healthConsent: d.reactions.trim() ? d.healthConsent : false,
      });
      if (result.ok) return onDone();
      if (result.slotLost) return onSlotLost(result.message);
      setError(result);
    });
  };

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <h1 className="mb-3.5 text-2xl font-semibold tracking-tight">Tes coordonnées</h1>
      <BookingSummary service={service} withAddon={withAddon} startsAt={startsAt} />

      <Field name="fullName" label="Prénom et nom" autoComplete="name" value={d.fullName}
        onChange={(e) => set("fullName", e.target.value)} error={fieldError("fullName")} />
      <Field name="phone" label="Téléphone" type="tel" autoComplete="tel" value={d.phone}
        onChange={(e) => set("phone", e.target.value)} error={fieldError("phone")} />
      <Field name="email" label="Email" type="email" autoComplete="email" value={d.email}
        onChange={(e) => set("email", e.target.value)} error={fieldError("email")} />
      <TextAreaField name="reactions" label="Allergies ou réactions connues (colle, patchs). Facultatif"
        maxLength={1000} value={d.reactions} onChange={(e) => set("reactions", e.target.value)}
        error={fieldError("reactions")} />

      {d.reactions.trim() && (
        <label className="mt-4 flex items-start gap-2.5 text-sm">
          <input type="checkbox" checked={d.healthConsent} onChange={(e) => set("healthConsent", e.target.checked)}
            aria-invalid={error?.field === "healthConsent" || undefined}
            className="mt-0.5 size-5 shrink-0 accent-acc" />
          <span>
            J’accepte que le studio conserve ces informations sur mes allergies, pour ma sécurité pendant la
            prestation.
          </span>
        </label>
      )}
      <label className="mt-4 flex items-start gap-2.5 text-sm">
        <input type="checkbox" checked={d.consent} onChange={(e) => set("consent", e.target.checked)}
          aria-invalid={error?.field === "consent" || undefined}
          className="mt-0.5 size-5 shrink-0 accent-acc" />
        <span>J’accepte que mes données soient utilisées par le studio pour gérer mon rendez-vous.</span>
      </label>

      <p role="alert" className="mt-2.5 min-h-[1.2em] text-sm text-err">
        {error && (!error.field || error.field === "consent" || error.field === "healthConsent") ? error.message : ""}
      </p>
      <div className="mt-[18px] flex gap-2.5">
        <button type="button" onClick={onBack}
          className="cursor-pointer rounded-[10px] border border-line bg-surface px-4 py-3 font-semibold">
          Retour
        </button>
        <button type="submit" disabled={pending}
          className="flex-1 cursor-pointer rounded-[10px] border border-acc bg-acc px-4 py-3 font-semibold text-acc-ink disabled:cursor-wait disabled:opacity-60">
          {pending ? "Réservation…" : "Confirmer la réservation"}
        </button>
      </div>
    </form>
  );
}
