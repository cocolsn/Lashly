"use client";

import { useActionState, useState } from "react";
import { Field } from "@/components/field";
import { SubmitButton } from "@/components/submit-button";
import { WEEK_DAYS, type DayHours, type Schedule } from "@/lib/hours";
import { saveHours } from "./actions";
import { DayEditor } from "./day-editor";

const card = "mb-3 rounded-card border border-line bg-surface px-[18px] py-4 shadow-[0_1px_2px_rgba(31,23,38,.05)]";

export function HoursForm({ initial }: { initial: Schedule }) {
  const [state, formAction] = useActionState(saveHours, { schedule: initial });
  const [schedule, setSchedule] = useState<Schedule>(initial);
  const errors = state.errors ?? {};

  const setDay = (weekday: number, patch: Partial<DayHours>) =>
    setSchedule((s) => ({ ...s, days: s.days.map((d) => (d.weekday === weekday ? { ...d, ...patch } : d)) }));

  const copyToOpenDays = (source: DayHours) =>
    setSchedule((s) => ({
      ...s,
      days: s.days.map((d) =>
        d.isOpen && d.weekday !== source.weekday
          ? { ...source, weekday: d.weekday, breaks: source.breaks.map((b) => ({ ...b })), fixedTimes: [...source.fixedTimes] }
          : d,
      ),
    }));

  return (
    <form action={formAction} noValidate>
      <input type="hidden" name="schedule" value={JSON.stringify(schedule)} />

      <section className={card}>
        <h2 className="font-semibold">Jours et heures d’ouverture</h2>
        <p className="mt-1 text-sm text-mute">
          Pour chaque jour : des créneaux automatiques entre l’ouverture et la fermeture (toutes les 30 min, hors
          pauses), ou seulement des heures fixes que tu choisis.
        </p>
        {WEEK_DAYS.map(({ weekday, label }) => {
          const day = schedule.days.find((d) => d.weekday === weekday)!;
          return (
            <DayEditor
              key={weekday}
              day={day}
              label={label}
              error={errors.days?.[weekday]}
              onChange={(patch) => setDay(weekday, patch)}
              onCopy={() => copyToOpenDays(day)}
            />
          );
        })}
      </section>

      <section className={card}>
        <h2 className="font-semibold">Temps de préparation</h2>
        <Field
          name="buffer"
          label="Temps entre deux clientes (minutes)"
          type="number"
          inputMode="numeric"
          min={0}
          max={120}
          step={5}
          value={schedule.buffer}
          onChange={(e) => setSchedule((s) => ({ ...s, buffer: e.target.value }))}
          error={errors.buffer}
        />
      </section>

      <p role="alert" className="min-h-[1.5em] text-sm text-err">
        {state.error ?? (state.errors ? "Corrige les éléments en rouge, puis enregistre." : "")}
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
