// Les dates sont stockées en UTC et toujours affichées à l'heure de Paris.
const TZ = "Europe/Paris";

const dayKeyFormat = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" });
const timeFormat = new Intl.DateTimeFormat("fr-FR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
const longDateFormat = new Intl.DateTimeFormat("fr-FR", { timeZone: TZ, weekday: "long", day: "numeric", month: "long" });
const weekdayShort = new Intl.DateTimeFormat("fr-FR", { timeZone: TZ, weekday: "short" });
const monthShort = new Intl.DateTimeFormat("fr-FR", { timeZone: TZ, month: "short" });
const dayNumber = new Intl.DateTimeFormat("fr-FR", { timeZone: TZ, day: "numeric" });

/** Jour à Paris au format AAAA-MM-JJ (clé de regroupement). */
export function parisDayKey(iso: string): string {
  return dayKeyFormat.format(new Date(iso));
}

/** « 09:30 » à Paris. */
export function parisTime(iso: string): string {
  return timeFormat.format(new Date(iso));
}

/** « mardi 12 novembre » à Paris. */
export function parisLongDate(iso: string): string {
  return longDateFormat.format(new Date(iso));
}

/** Morceaux pour une pastille de jour : « mar. », « 12 », « nov. ». */
export function parisDayChip(iso: string) {
  const date = new Date(iso);
  return { weekday: weekdayShort.format(date), day: dayNumber.format(date), month: monthShort.format(date) };
}

export type SlotDay = { key: string; slots: string[] };

/** Regroupe des créneaux (ISO, triés ou non) par jour de Paris, dans l'ordre chronologique. */
export function groupSlotsByParisDay(slots: string[]): SlotDay[] {
  const days = new Map<string, string[]>();
  for (const iso of [...slots].sort((a, b) => Date.parse(a) - Date.parse(b))) {
    const key = parisDayKey(iso);
    days.set(key, [...(days.get(key) ?? []), iso]);
  }
  return [...days].map(([key, list]) => ({ key, slots: list }));
}

// --- Jours calendaires (clé AAAA-MM-JJ, heure de Paris) ---

const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;

export function isDayKey(value: string): boolean {
  if (!DAY_KEY.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/** Aujourd'hui à Paris. */
export function todayParisKey(now: Date = new Date()): string {
  return dayKeyFormat.format(now);
}

/** Décale un jour calendaire de n jours. */
export function addDays(key: string, n: number): string {
  const date = new Date(`${key}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + n);
  return date.toISOString().slice(0, 10);
}

/** Lundi de la semaine du jour donné. */
export function mondayOf(key: string): string {
  const weekday = new Date(`${key}T00:00:00Z`).getUTCDay(); // 0 = dimanche
  return addDays(key, -((weekday + 6) % 7));
}

const offsetParts = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

/** Instant UTC (ISO) correspondant à minuit, heure de Paris, au jour donné (gère l'heure d'été). */
export function parisMidnightIso(key: string): string {
  const guess = Date.parse(`${key}T00:00:00Z`);
  const parts = Object.fromEntries(offsetParts.formatToParts(new Date(guess)).map((p) => [p.type, p.value]));
  const asParis = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute);
  return new Date(guess - (asParis - guess)).toISOString();
}

/** « mardi 10 novembre » pour un jour calendaire. */
export function dayKeyLongDate(key: string): string {
  return parisLongDate(`${key}T12:00:00Z`);
}
