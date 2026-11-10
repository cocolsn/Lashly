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

export type DayHours = { weekday: number; isOpen: boolean; start: string; end: string };

export type Schedule = {
  days: DayHours[];
  pauseStart: string;
  pauseEnd: string;
  buffer: string;
};

// Réglages proposés tant que la pro n'a rien enregistré (repris du prototype).
export const DEFAULT_SCHEDULE: Schedule = {
  days: WEEK_DAYS.map(({ weekday }) => ({
    weekday,
    isOpen: weekday >= 1 && weekday <= 5,
    start: "09:00",
    end: weekday === 5 ? "17:00" : "18:00",
  })),
  pauseStart: "12:30",
  pauseEnd: "13:30",
  buffer: "10",
};

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

/** « 09:00:00 » (Postgres) → « 09:00 ». */
export function toHHMM(time: string): string {
  return time.slice(0, 5);
}

export type ScheduleErrors = {
  days?: Partial<Record<number, string>>;
  pause?: string;
  buffer?: string;
};

/** Renvoie les erreurs en français, ou null si tout est valide. */
export function validateSchedule(s: Schedule): ScheduleErrors | null {
  const errors: ScheduleErrors = {};

  for (const day of s.days) {
    if (!TIME.test(day.start) || !TIME.test(day.end)) {
      errors.days = { ...errors.days, [day.weekday]: "Indique une heure d’ouverture et de fermeture." };
    } else if (day.start >= day.end) {
      errors.days = { ...errors.days, [day.weekday]: "La fermeture doit être après l’ouverture." };
    }
  }

  const hasPause = s.pauseStart !== "" || s.pauseEnd !== "";
  if (hasPause) {
    if (!TIME.test(s.pauseStart) || !TIME.test(s.pauseEnd)) {
      errors.pause = "Indique le début et la fin de la pause, ou vide les deux.";
    } else if (s.pauseStart >= s.pauseEnd) {
      errors.pause = "La fin de la pause doit être après le début.";
    }
  }

  const buffer = Number(s.buffer);
  if (s.buffer === "" || !Number.isInteger(buffer) || buffer < 0 || buffer > 120 || buffer % 5 !== 0) {
    errors.buffer = "Indique de 0 à 120 minutes (par 5 minutes).";
  }

  return Object.keys(errors).length ? errors : null;
}
