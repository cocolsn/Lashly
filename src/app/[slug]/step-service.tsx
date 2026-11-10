"use client";

import { useState } from "react";
import { formatDuration, formatPrice } from "@/lib/format";
import type { PublicService } from "@/lib/public-studio";

type Props = {
  services: PublicService[];
  onChoose: (service: PublicService, withAddon: boolean) => void;
};

export function StepService({ services, onChoose }: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [withAddon, setWithAddon] = useState(false);

  return (
    <>
      <h1 className="mb-3.5 text-2xl font-semibold tracking-tight">Choisis ta prestation</h1>
      {services.map((s) => {
        const open = openId === s.id;
        return (
          <div key={s.id} className="mb-2.5">
            <button
              type="button"
              aria-expanded={open}
              onClick={() => {
                setOpenId(open ? null : s.id);
                setWithAddon(false);
              }}
              className={`flex w-full cursor-pointer items-center justify-between gap-3 border bg-surface px-4 py-3.5 text-left shadow-[0_1px_2px_rgba(31,23,38,.05)] hover:border-acc ${
                open ? "rounded-t-card border-acc" : "rounded-card border-line"
              }`}
            >
              <span>
                <b className="block font-semibold">{s.name}</b>
                <span className="text-sm text-mute">{formatDuration(s.duration_min)}</span>
              </span>
              <span className="font-semibold tabular-nums">{formatPrice(s.price_cents)}</span>
            </button>
            {open && (
              <div className="rounded-b-card border border-t-0 border-acc bg-surface px-4 pt-0.5 pb-4">
                {s.description && <p className="mb-3.5 text-mute">{s.description}</p>}
                {s.addon_name && s.addon_price_cents !== null && (
                  <label className="mb-3.5 flex items-start gap-2.5 rounded-btn border border-line bg-ok px-3 py-2.5 text-ok-ink">
                    <input
                      type="checkbox"
                      checked={withAddon}
                      onChange={(e) => setWithAddon(e.target.checked)}
                      className="mt-0.5 size-5 shrink-0 accent-acc"
                    />
                    <span>
                      Ajouter : <b className="font-semibold">{s.addon_name}</b>
                      <span className="block text-sm">
                        +{formatPrice(s.addon_price_cents)}
                        {s.addon_duration_min ? ` · +${formatDuration(s.addon_duration_min)}` : ""}
                      </span>
                    </span>
                  </label>
                )}
                <button
                  type="button"
                  onClick={() => onChoose(s, withAddon)}
                  className="w-full cursor-pointer rounded-[10px] border border-acc bg-acc px-4 py-3 font-semibold text-acc-ink"
                >
                  Choisir cette prestation
                </button>
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}
