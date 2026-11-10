"use client";

import { useState } from "react";
import { groupSlotsByParisDay, type SlotDay } from "@/lib/paris-time";
import type { PublicService, PublicStudio } from "@/lib/public-studio";
import { getSlots } from "./actions";
import { BookingSummary } from "./booking-summary";
import { EMPTY_DETAILS, StepDetails, type Details } from "./step-details";
import { StepService } from "./step-service";
import { StepSlot } from "./step-slot";

type Step = 1 | 2 | 3 | 4;

export function BookingFlow({ studio }: { studio: PublicStudio }) {
  const [step, setStep] = useState<Step>(1);
  const [service, setService] = useState<PublicService | null>(null);
  const [withAddon, setWithAddon] = useState(false);
  const [days, setDays] = useState<SlotDay[] | null>(null);
  const [dayKey, setDayKey] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [details, setDetails] = useState<Details>(EMPTY_DETAILS);

  const go = (next: Step) => {
    setStep(next);
    window.scrollTo(0, 0);
  };

  const loadSlots = async (s: PublicService, addon: boolean, message: string | null = null) => {
    setDays(null);
    setSlot(null);
    setNotice(message);
    const slots = await getSlots(studio.slug, s.id, addon);
    if (slots === null) {
      setNotice("Impossible de charger les créneaux. Vérifie ta connexion, puis réessaie.");
      setDays([]);
      return;
    }
    const grouped = groupSlotsByParisDay(slots);
    setDays(grouped);
    setDayKey((key) => (grouped.some((d) => d.key === key) ? key : (grouped[0]?.key ?? null)));
  };

  const restart = () => {
    setService(null);
    setSlot(null);
    setDetails(EMPTY_DETAILS);
    go(1);
  };

  return (
    <>
      {step < 4 && (
        <div className="mb-5 flex gap-1.5" aria-label={`Étape ${step} sur 3`}>
          {[1, 2, 3].map((i) => (
            <i key={i} className={`h-1 flex-1 rounded ${step >= i ? "bg-acc" : "bg-line"}`} />
          ))}
        </div>
      )}

      {step === 1 && (
        <StepService
          services={studio.services}
          onChoose={(s, addon) => {
            setService(s);
            setWithAddon(addon);
            setDayKey(null);
            void loadSlots(s, addon);
            go(2);
          }}
        />
      )}

      {step === 2 && service && (
        <StepSlot
          service={service}
          withAddon={withAddon}
          days={days}
          dayKey={dayKey}
          slot={slot}
          notice={notice}
          onDay={(key) => {
            setDayKey(key);
            setSlot(null);
          }}
          onSlot={setSlot}
          onBack={() => go(1)}
          onNext={() => go(3)}
        />
      )}

      {step === 3 && service && slot && (
        <StepDetails
          slug={studio.slug}
          service={service}
          withAddon={withAddon}
          startsAt={slot}
          details={details}
          onDetails={setDetails}
          onBack={() => go(2)}
          onDone={() => go(4)}
          onSlotLost={(message) => {
            void loadSlots(service, withAddon, message);
            go(2);
          }}
        />
      )}

      {step === 4 && service && slot && (
        <>
          <div className="py-2.5 text-center">
            <div aria-hidden="true" className="mx-auto mb-3.5 grid size-14 place-items-center rounded-full bg-acc text-2xl text-acc-ink">
              ✓
            </div>
            <h1 className="mb-3.5 text-2xl font-semibold tracking-tight">Rendez-vous confirmé</h1>
          </div>
          <BookingSummary service={service} withAddon={withAddon} startsAt={slot} />
          <p className="text-sm text-mute">
            Merci {details.fullName.trim().split(" ")[0]}. {studio.studio_name} a bien reçu ta réservation. Tu vas
            recevoir un email de confirmation, puis un rappel la veille de ton rendez-vous.
          </p>
          <button type="button" onClick={restart}
            className="mt-[18px] w-full cursor-pointer rounded-[10px] border border-line bg-surface px-4 py-3 font-semibold">
            Nouvelle réservation
          </button>
        </>
      )}
    </>
  );
}
