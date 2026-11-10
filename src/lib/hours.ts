// Jours affichés du lundi au dimanche ; weekday suit Postgres/JS (0 = dimanche).
export const WEEK_DAYS = [
  { weekday: 1, label: "Lundi" },
  { weekday: 2, label: "Mardi" },
  { weekday: 3, label: "Mercredi" },
  { weekday: 4, label: "Jeudi" },
  { weekday: 5, label: "Vendredi" },
  { weekday: 6, label: "Samedi" },
  { weekday: 0, label: "Dimanche" },
] as const;

export type TimeRange = { start: string; end: string };

/**
 * « auto » : créneaux réguliers (intervalle choisi par la pro) entre ouverture et fermeture, hors pauses.
 * « fixed » : seulement les heures de début choisies par la pro.
 */
export type SlotMode = "auto" | "fixed";

export type DayHours = {
  weekday: number;
  isOpen: boolean;
  mode: SlotMode;
  start: string;
  end: string;
  breaks: TimeRange[];
  fixedTimes: string[];
};

/** step : minutes entre deux débuts de créneau (mode auto) ; buffer : temps entre deux clientes. */
export type Schedule = { days: DayHours[]; step: string; buffer: string };

// Réglages proposés tant que la pro n'a rien enregistré (repris du prototype).
export const DEFAULT_SCHEDULE: Schedule = {
  days: WEEK_DAYS.map(({ weekday }) => ({
    weekday,
    isOpen: weekday >= 1 && weekday <= 5,
    mode: "auto",
    start: "09:00",
    end: weekday === 5 ? "17:00" : "18:00",
    breaks: [{ start: "12:30", end: "13:30" }],
    fixedTimes: [],
  })),
  step: "30",
  buffer: "10",
};

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isTime(value: string): boolean {
  return TIME.test(value);
}

/** « 09:00:00 » (Postgres) → « 09:00 ». */
export function toHHMM(time: string): string {
  return time.slice(0, 5);
}

/** Ajoute une heure à une liste triée, sans doublon. */
export function addTime(times: string[], time: string): string[] {
  return [...new Set([...times, time])].sort();
}

export type ScheduleErrors = {
  days?: Partial<Record<number, string>>;
  step?: string;
  buffer?: string;
};

function dayError(day: DayHours): string | null {
  if (day.mode === "fixed") {
    if (day.fixedTimes.length === 0) return "Ajoute au moins une heure, ou ferme ce jour.";
    if (day.fixedTimes.length > 24) return "24 heures maximum par jour.";
    if (!day.fixedTimes.every(isTime)) return "Une des heures n’est pas valide.";
    return null;
  }

  if (!isTime(day.start) || !isTime(day.end)) return "Indique une heure d’ouverture et de fermeture.";
  if (day.start >= day.end) return "La fermeture doit être après l’ouverture.";

  const breaks = [...day.breaks].sort((a, b) => a.start.localeCompare(b.start));
  for (const [i, b] of breaks.entries()) {
    if (!isTime(b.start) || !isTime(b.end)) return "Indique le début et la fin de chaque pause.";
    if (b.start >= b.end) return "La fin d’une pause doit être après son début.";
    if (b.start < day.start || b.end > day.end) return "Les pauses doivent être pendant les heures d’ouverture.";
    if (i > 0 && b.start < breaks[i - 1].end) return "Deux pauses se chevauchent.";
  }
  return null;
}

/** Renvoie les erreurs en français, ou null si tout est valide. Les jours fermés ne sont pas vérifiés. */
export function validateSchedule(s: Schedule): ScheduleErrors | null {
  const errors: ScheduleErrors = {};

  for (const day of s.days) {
    const error = day.isOpen ? dayError(day) : null;
    if (error) errors.days = { ...errors.days, [day.weekday]: error };
  }

  const step = Number(s.step);
  if (s.step === "" || !Number.isInteger(step) || step < 5 || step > 240 || step % 5 !== 0) {
    errors.step = "Indique de 5 à 240 minutes (par 5 minutes).";
  }

  const buffer = Number(s.buffer);
  if (s.buffer === "" || !Number.isInteger(buffer) || buffer < 0 || buffer > 120 || buffer % 5 !== 0) {
    errors.buffer = "Indique de 0 à 120 minutes (par 5 minutes).";
  }

  return Object.keys(errors).length ? errors : null;
}

/** Lit un planning envoyé en JSON par le formulaire ; renvoie null s'il est mal formé. */
export function parseSchedule(raw: unknown): Schedule | null {
  if (typeof raw !== "object" || raw === null) return null;
  const { days, step, buffer } = raw as Record<string, unknown>;
  if (!Array.isArray(days) || typeof step !== "string" || typeof buffer !== "string") return null;

  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const parsed: DayHours[] = [];
  for (const { weekday } of WEEK_DAYS) {
    const d = days.find((x) => (x as DayHours | null)?.weekday === weekday) as Record<string, unknown> | undefined;
    if (!d) return null;
    parsed.push({
      weekday,
      isOpen: d.isOpen === true,
      mode: d.mode === "fixed" ? "fixed" : "auto",
      start: str(d.start),
      end: str(d.end),
      breaks: Array.isArray(d.breaks)
        ? d.breaks.map((b) => ({ start: str((b as TimeRange).start), end: str((b as TimeRange).end) }))
        : [],
      fixedTimes: Array.isArray(d.fixedTimes) ? d.fixedTimes.map(str) : [],
    });
  }
  return { days: parsed, step, buffer };
}
