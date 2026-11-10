"use client";

import { useActionState, useState } from "react";
import { Field } from "@/components/field";
import { SubmitButton } from "@/components/submit-button";
import { WEEK_DAYS, type DayHours, type Schedule } from "@/lib/hours";
import { saveHours } from "./actions";

const card = "mb-3 rounded-card border border-line bg-surface px-[18px] py-4 shadow-[0_1px_2px_rgba(31,23,38,.05)]";
const timeInput = "w-full min-w-0 rounded-[10px] border border-line bg-bg px-1.5 py-2 text-ink";

export function HoursForm({ initial }: { initial: Schedule }) {
  const [state, formAction] = useActionState(saveHours, { schedule: initial });
  const [days, setDays] = useState<DayHours[]>(initial.days);
  const errors = state.errors ?? {};
  const schedule = state.schedule ?? initial;

  const setDay = (weekday: number, patch: Partial<DayHours>) =>
    setDays((all) => all.map((d) => (d.weekday === weekday ? { ...d, ...patch } : d)));

  return (
    <form action={formAction} noValidate>
      <section className={card}>
        <h2 className="mb-1 font-semibold">Jours et heures d’ouverture</h2>
        {WEEK_DAYS.map(({ weekday, label }) => {
          const day = days.find((d) => d.weekday === weekday)!;
          const error = errors.days?.[weekday];
          return (
            <div key={weekday} className="border-b border-line py-2 last:border-0">
              <div className="grid grid-cols-[92px_minmax(0,1fr)_minmax(0,1fr)] items-center gap-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name={`open_${weekday}`}
                    checked={day.isOpen}
                    onChange={(e) => setDay(weekday, { isOpen: e.target.checked })}
                    className="size-[18px] shrink-0 accent-acc"
                  />
                  {label}
                </label>
                {day.isOpen ? (
                  <>
                    <input
                      type="time"
                      name={`start_${weekday}`}
                      aria-label={`Ouverture ${label}`}
                      value={day.start}
                      onChange={(e) => setDay(weekday, { start: e.target.value })}
                      className={timeInput}
                    />
                    <input
                      type="time"
                      name={`end_${weekday}`}
                      aria-label={`Fermeture ${label}`}
                      value={day.end}
                      onChange={(e) => setDay(weekday, { end: e.target.value })}
                      className={timeInput}
                    />
                  </>
                ) : (
                  <>
                    <span className="col-span-2 text-sm text-mute">Fermé</span>
                    <input type="hidden" name={`start_${weekday}`} value={day.start} />
                    <input type="hidden" name={`end_${weekday}`} value={day.end} />
                  </>
                )}
              </div>
              {error && day.isOpen && <p className="mt-1 text-sm text-err">{error}</p>}
            </div>
          );
        })}
      </section>

      <section className={card}>
        <h2 className="font-semibold">Pause et temps de préparation</h2>
        <div className="flex gap-2.5 *:flex-1">
          <Field
            name="pause_start"
            label="Pause début"
            type="time"
            defaultValue={schedule.pauseStart}
          />
          <Field name="pause_end" label="Pause fin" type="time" defaultValue={schedule.pauseEnd} />
        </div>
        <p className="mt-1 text-sm text-mute">Pas de pause ? Vide les deux champs.</p>
        {errors.pause && <p className="mt-1 text-sm text-err">{errors.pause}</p>}
        <Field
          name="buffer"
          label="Temps entre deux clientes (minutes)"
          type="number"
          inputMode="numeric"
          min={0}
          max={120}
          step={5}
          defaultValue={schedule.buffer}
          error={errors.buffer}
        />
      </section>

      <p role="alert" className="min-h-[1.5em] text-sm text-err">
        {state.error ?? (state.errors ? "Corrige les champs en rouge, puis enregistre." : "")}
      </p>
      {state.saved && (
        <p role="status" className="mb-3 rounded-btn bg-ok px-3 py-2 text-sm font-semibold text-ok-ink">
          Tes horaires sont enregistrés.
        </p>
      )}
      <SubmitButton pendingLabel="Enregistrement…">Enregistrer mes horaires</SubmitButton>
    </form>
  );
}
