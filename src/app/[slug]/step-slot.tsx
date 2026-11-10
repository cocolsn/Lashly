"use client";

import { formatDuration, formatPrice } from "@/lib/format";
import { parisDayChip, parisTime, type SlotDay } from "@/lib/paris-time";
import { serviceTotals, type PublicService } from "@/lib/public-studio";

type Props = {
  service: PublicService;
  withAddon: boolean;
  days: SlotDay[] | null;
  dayKey: string | null;
  slot: string | null;
  notice: string | null;
  onDay: (key: string) => void;
  onSlot: (iso: string) => void;
  onBack: () => void;
  onNext: () => void;
};

export function StepSlot({ service, withAddon, days, dayKey, slot, notice, onDay, onSlot, onBack, onNext }: Props) {
  const { duration, priceCents } = serviceTotals(service, withAddon);
  const current = days?.find((d) => d.key === dayKey) ?? days?.[0];

  return (
    <>
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">Choisis ton créneau</h1>
      <p className="mb-3.5 text-sm text-mute">
        {service.name}
        {withAddon && service.addon_name && ` + ${service.addon_name}`} · {formatDuration(duration)} ·{" "}
        {formatPrice(priceCents)}
      </p>
      {notice && (
        <p role="alert" className="mb-3 text-sm text-err">
          {notice}
        </p>
      )}

      {days === null ? (
        <p className="text-mute" role="status">
          Recherche des créneaux…
        </p>
      ) : days.length === 0 ? (
        <p className="text-mute">Aucun créneau libre dans les 14 prochains jours. Reviens bientôt.</p>
      ) : (
        <>
          <div className="mb-3.5 flex gap-2 overflow-x-auto pb-1.5" role="group" aria-label="Jours disponibles">
            {days.map((d) => {
              const chip = parisDayChip(d.slots[0]);
              const selected = d.key === current?.key;
              return (
                <button
                  key={d.key}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onDay(d.key)}
                  className={`min-w-[62px] flex-none cursor-pointer rounded-[10px] border px-1.5 py-2 text-center ${
                    selected ? "border-acc bg-acc text-acc-ink" : "border-line bg-surface"
                  }`}
                >
                  <span className={`block text-xs ${selected ? "opacity-85" : "text-mute"}`}>{chip.weekday}</span>
                  <b className="text-lg font-semibold">{chip.day}</b>
                  <span className={`block text-xs ${selected ? "opacity-85" : "text-mute"}`}>{chip.month}</span>
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Heures disponibles">
            {current?.slots.map((iso) => (
              <button
                key={iso}
                type="button"
                aria-pressed={slot === iso}
                onClick={() => onSlot(iso)}
                className={`cursor-pointer rounded-btn border px-3.5 py-2 font-semibold tabular-nums ${
                  slot === iso ? "border-acc bg-acc text-acc-ink" : "border-line bg-ok text-ok-ink"
                }`}
              >
                {parisTime(iso)}
              </button>
            ))}
          </div>
        </>
      )}

      <div className="mt-[18px] flex gap-2.5">
        <button
          type="button"
          onClick={onBack}
          className="cursor-pointer rounded-[10px] border border-line bg-surface px-4 py-3 font-semibold"
        >
          Retour
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!slot}
          className="flex-1 cursor-pointer rounded-[10px] border border-acc bg-acc px-4 py-3 font-semibold text-acc-ink disabled:cursor-not-allowed disabled:opacity-40"
        >
          Continuer
        </button>
      </div>
    </>
  );
}
