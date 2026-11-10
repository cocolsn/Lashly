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
