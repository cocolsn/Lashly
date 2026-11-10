"use client";

import { useState } from "react";
import { addTime, isTime, type DayHours, type SlotMode, type TimeRange } from "@/lib/hours";

const timeInput = "w-full min-w-0 rounded-[10px] border border-line bg-bg px-1.5 py-2 text-ink";
const smallButton = "cursor-pointer rounded-btn border border-line bg-surface px-3 py-1.5 text-sm font-semibold";

type DayEditorProps = {
  day: DayHours;
  label: string;
  error?: string;
  onChange: (patch: Partial<DayHours>) => void;
  onCopy: () => void;
};

export function DayEditor({ day, label, error, onChange, onCopy }: DayEditorProps) {
  const id = `day-${day.weekday}`;
  return (
    <div className="border-b border-line py-3 last:border-0">
      <label className="flex items-center gap-2 font-semibold">
        <input
          type="checkbox"
          checked={day.isOpen}
          onChange={(e) => onChange({ isOpen: e.target.checked })}
          className="size-[18px] shrink-0 accent-acc"
        />
        {label}
        {!day.isOpen && <span className="ml-auto text-sm font-normal text-mute">Fermé</span>}
      </label>

      {day.isOpen && (
        <div className="mt-2 pl-[26px]">
          <ModePicker name={`${id}-mode`} mode={day.mode} onChange={(mode) => onChange({ mode })} />
          {day.mode === "auto" ? (
            <AutoHours day={day} label={label} onChange={onChange} />
          ) : (
            <FixedTimes
              times={day.fixedTimes}
              label={label}
              onChange={(fixedTimes) => onChange({ fixedTimes })}
            />
          )}
          {error && <p className="mt-2 text-sm text-err">{error}</p>}
          <button type="button" onClick={onCopy} className="mt-2 cursor-pointer text-sm text-mute underline">
            Copier ce réglage sur les autres jours ouverts
          </button>
        </div>
      )}
    </div>
  );
}

function ModePicker({ name, mode, onChange }: { name: string; mode: SlotMode; onChange: (m: SlotMode) => void }) {
  const options: { value: SlotMode; label: string }[] = [
    { value: "auto", label: "Créneaux automatiques" },
    { value: "fixed", label: "Heures fixes" },
  ];
  return (
    <fieldset className="mb-2 flex gap-1.5">
      <legend className="sr-only">Type de créneaux</legend>
      {options.map((o) => (
        <label
          key={o.value}
          className={`flex-1 cursor-pointer rounded-btn border px-2 py-1.5 text-center text-sm font-semibold has-focus-visible:outline-2 has-focus-visible:outline-acc ${
            mode === o.value ? "border-acc bg-acc text-acc-ink" : "border-line bg-ok text-ok-ink"
          }`}
        >
          <input
            type="radio"
            name={name}
            value={o.value}
            checked={mode === o.value}
            onChange={() => onChange(o.value)}
            className="sr-only"
          />
          {o.label}
        </label>
      ))}
    </fieldset>
  );
}

function AutoHours({
  day,
  label,
  onChange,
}: {
  day: DayHours;
  label: string;
  onChange: (patch: Partial<DayHours>) => void;
}) {
  const setBreak = (i: number, patch: Partial<TimeRange>) =>
    onChange({ breaks: day.breaks.map((b, j) => (j === i ? { ...b, ...patch } : b)) });

  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-sm text-mute">
          Ouverture
          <input
            type="time"
            value={day.start}
            onChange={(e) => onChange({ start: e.target.value })}
            className={`${timeInput} mt-1`}
          />
        </label>
        <label className="text-sm text-mute">
          Fermeture
          <input
            type="time"
            value={day.end}
            onChange={(e) => onChange({ end: e.target.value })}
            className={`${timeInput} mt-1`}
          />
        </label>
      </div>

      <p className="mt-3 mb-1 text-sm text-mute">Pauses</p>
      {day.breaks.length === 0 && <p className="text-sm text-mute">Aucune pause.</p>}
      {day.breaks.map((b, i) => (
        <div key={i} className="mb-1.5 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto] items-center gap-1.5">
          <input
            type="time"
            aria-label={`Début de la pause ${i + 1}, ${label}`}
            value={b.start}
            onChange={(e) => setBreak(i, { start: e.target.value })}
            className={timeInput}
          />
          <span className="text-sm text-mute">à</span>
          <input
            type="time"
            aria-label={`Fin de la pause ${i + 1}, ${label}`}
            value={b.end}
            onChange={(e) => setBreak(i, { end: e.target.value })}
            className={timeInput}
          />
          <button
            type="button"
            aria-label={`Retirer la pause ${i + 1}, ${label}`}
            onClick={() => onChange({ breaks: day.breaks.filter((_, j) => j !== i) })}
            className={`${smallButton} text-err`}
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange({ breaks: [...day.breaks, { start: "", end: "" }] })}
        className={smallButton}
      >
        + Ajouter une pause
      </button>
    </>
  );
}

function FixedTimes({
  times,
  label,
  onChange,
}: {
  times: string[];
  label: string;
  onChange: (times: string[]) => void;
}) {
  const [draft, setDraft] = useState("");
  const add = () => {
    if (!isTime(draft)) return;
    onChange(addTime(times, draft));
    setDraft("");
  };

  return (
    <>
      <p className="mb-1.5 text-sm text-mute">Tes clientes pourront réserver seulement à ces heures.</p>
      <ul className="mb-2 flex flex-wrap gap-1.5">
        {times.length === 0 && <li className="text-sm text-mute">Aucune heure pour l’instant.</li>}
        {times.map((t) => (
          <li
            key={t}
            className="flex items-center gap-1 rounded-btn border border-line bg-ok py-1 pr-1 pl-2.5 font-semibold text-ok-ink tabular-nums"
          >
            {t}
            <button
              type="button"
              aria-label={`Retirer ${t}, ${label}`}
              onClick={() => onChange(times.filter((x) => x !== t))}
              className="cursor-pointer rounded px-1.5 text-mute"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
      <div className="flex gap-1.5">
        <input
          type="time"
          aria-label={`Heure à ajouter, ${label}`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          className={`${timeInput} max-w-36`}
        />
        <button type="button" onClick={add} disabled={!isTime(draft)} className={`${smallButton} disabled:opacity-40`}>
          + Ajouter
        </button>
      </div>
    </>
  );
}
