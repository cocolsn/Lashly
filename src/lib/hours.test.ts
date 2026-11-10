import { describe, expect, it } from "vitest";
import { DEFAULT_SCHEDULE, toHHMM, validateSchedule, type Schedule } from "./hours";

const withDay = (weekday: number, patch: Partial<Schedule["days"][number]>): Schedule => ({
  ...DEFAULT_SCHEDULE,
  days: DEFAULT_SCHEDULE.days.map((d) => (d.weekday === weekday ? { ...d, ...patch } : d)),
});

describe("validateSchedule", () => {
  it("accepte les réglages par défaut", () => {
    expect(validateSchedule(DEFAULT_SCHEDULE)).toBeNull();
  });

  it("refuse une fermeture avant l'ouverture", () => {
    expect(validateSchedule(withDay(1, { start: "18:00", end: "09:00" }))?.days?.[1]).toBeDefined();
  });

  it("accepte une journée sans pause (les deux champs vides)", () => {
    expect(validateSchedule({ ...DEFAULT_SCHEDULE, pauseStart: "", pauseEnd: "" })).toBeNull();
  });

  it("refuse une pause à moitié remplie ou à l'envers", () => {
    expect(validateSchedule({ ...DEFAULT_SCHEDULE, pauseEnd: "" })?.pause).toBeDefined();
    expect(
      validateSchedule({ ...DEFAULT_SCHEDULE, pauseStart: "14:00", pauseEnd: "13:00" })?.pause,
    ).toBeDefined();
  });

  it("refuse un temps de préparation négatif ou hors pas de 5", () => {
    expect(validateSchedule({ ...DEFAULT_SCHEDULE, buffer: "-5" })?.buffer).toBeDefined();
    expect(validateSchedule({ ...DEFAULT_SCHEDULE, buffer: "7" })?.buffer).toBeDefined();
    expect(validateSchedule({ ...DEFAULT_SCHEDULE, buffer: "0" })).toBeNull();
  });
});

describe("toHHMM", () => {
  it("retire les secondes renvoyées par Postgres", () => {
    expect(toHHMM("09:30:00")).toBe("09:30");
  });
});
