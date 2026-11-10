import { describe, expect, it } from "vitest";
import { DEFAULT_SCHEDULE, addTime, parseSchedule, toHHMM, validateSchedule, type DayHours, type Schedule } from "./hours";

const withDay = (weekday: number, patch: Partial<DayHours>): Schedule => ({
  ...DEFAULT_SCHEDULE,
  days: DEFAULT_SCHEDULE.days.map((d) => (d.weekday === weekday ? { ...d, ...patch } : d)),
});

const errorFor = (s: Schedule, weekday: number) => validateSchedule(s)?.days?.[weekday];

describe("validateSchedule — mode automatique", () => {
  it("accepte les réglages par défaut", () => {
    expect(validateSchedule(DEFAULT_SCHEDULE)).toBeNull();
  });

  it("refuse une fermeture avant l'ouverture", () => {
    expect(errorFor(withDay(1, { start: "18:00", end: "09:00" }), 1)).toBeDefined();
  });

  it("accepte aucune pause et plusieurs pauses", () => {
    expect(errorFor(withDay(1, { breaks: [] }), 1)).toBeUndefined();
    const two = [
      { start: "12:30", end: "13:30" },
      { start: "16:00", end: "16:15" },
    ];
    expect(errorFor(withDay(1, { breaks: two }), 1)).toBeUndefined();
  });

  it("refuse une pause à l'envers, hors horaires ou qui en chevauche une autre", () => {
    expect(errorFor(withDay(1, { breaks: [{ start: "14:00", end: "13:00" }] }), 1)).toBeDefined();
    expect(errorFor(withDay(1, { breaks: [{ start: "08:00", end: "09:30" }] }), 1)).toBeDefined();
    const overlap = [
      { start: "12:00", end: "13:00" },
      { start: "12:30", end: "14:00" },
    ];
    expect(errorFor(withDay(1, { breaks: overlap }), 1)).toBeDefined();
  });

  it("ne vérifie pas les jours fermés", () => {
    expect(errorFor(withDay(6, { isOpen: false, start: "18:00", end: "09:00" }), 6)).toBeUndefined();
  });
});

describe("validateSchedule — heures fixes", () => {
  it("accepte une liste d'heures", () => {
    expect(errorFor(withDay(1, { mode: "fixed", fixedTimes: ["10:00", "15:00", "17:00"] }), 1)).toBeUndefined();
  });

  it("refuse une liste vide ou une heure invalide", () => {
    expect(errorFor(withDay(1, { mode: "fixed", fixedTimes: [] }), 1)).toBeDefined();
    expect(errorFor(withDay(1, { mode: "fixed", fixedTimes: ["25:00"] }), 1)).toBeDefined();
  });
});

describe("temps entre deux clientes", () => {
  it("refuse un nombre négatif ou hors pas de 5", () => {
    expect(validateSchedule({ ...DEFAULT_SCHEDULE, buffer: "-5" })?.buffer).toBeDefined();
    expect(validateSchedule({ ...DEFAULT_SCHEDULE, buffer: "7" })?.buffer).toBeDefined();
    expect(validateSchedule({ ...DEFAULT_SCHEDULE, buffer: "0" })).toBeNull();
  });
});

describe("addTime", () => {
  it("trie et retire les doublons", () => {
    expect(addTime(["15:00", "10:00"], "10:00")).toEqual(["10:00", "15:00"]);
    expect(addTime(["15:00"], "09:30")).toEqual(["09:30", "15:00"]);
  });
});

describe("parseSchedule", () => {
  it("relit un planning sérialisé", () => {
    expect(parseSchedule(JSON.parse(JSON.stringify(DEFAULT_SCHEDULE)))).toEqual(DEFAULT_SCHEDULE);
  });

  it("refuse une donnée mal formée", () => {
    expect(parseSchedule(null)).toBeNull();
    expect(parseSchedule({ days: [], buffer: "10" })).toBeNull();
  });
});

describe("toHHMM", () => {
  it("retire les secondes renvoyées par Postgres", () => {
    expect(toHHMM("09:30:00")).toBe("09:30");
  });
});
