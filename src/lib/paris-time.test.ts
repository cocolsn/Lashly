import { describe, expect, it } from "vitest";
import {
  addDays,
  dayKeyLongDate,
  groupSlotsByParisDay,
  isDayKey,
  mondayOf,
  parisDayKey,
  parisLongDate,
  parisMidnightIso,
  parisTime,
  todayParisKey,
} from "./paris-time";

describe("heure de Paris", () => {
  it("affiche l'heure locale en hiver (UTC+1) et en été (UTC+2)", () => {
    expect(parisTime("2026-11-12T08:30:00Z")).toBe("09:30");
    expect(parisTime("2026-07-01T08:30:00Z")).toBe("10:30");
  });

  it("rattache un créneau tardif en UTC au bon jour de Paris", () => {
    // 23:30 UTC le 11 = 00:30 à Paris le 12.
    expect(parisDayKey("2026-11-11T23:30:00Z")).toBe("2026-11-12");
  });

  it("écrit la date en toutes lettres", () => {
    expect(parisLongDate("2026-11-10T09:00:00Z")).toBe("mardi 10 novembre");
  });
});

describe("groupSlotsByParisDay", () => {
  it("regroupe par jour et trie", () => {
    const groups = groupSlotsByParisDay([
      "2026-11-13T09:00:00Z",
      "2026-11-12T13:00:00Z",
      "2026-11-12T08:00:00Z",
    ]);
    expect(groups).toEqual([
      { key: "2026-11-12", slots: ["2026-11-12T08:00:00Z", "2026-11-12T13:00:00Z"] },
      { key: "2026-11-13", slots: ["2026-11-13T09:00:00Z"] },
    ]);
  });

  it("renvoie une liste vide sans créneau", () => {
    expect(groupSlotsByParisDay([])).toEqual([]);
  });
});

describe("jours calendaires", () => {
  it("décale et trouve le lundi", () => {
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
    expect(mondayOf("2026-11-10")).toBe("2026-11-09"); // mardi → lundi
    expect(mondayOf("2026-11-15")).toBe("2026-11-09"); // dimanche → lundi précédent
    expect(mondayOf("2026-11-09")).toBe("2026-11-09");
  });

  it("calcule minuit à Paris en hiver, en été et les jours de changement d'heure", () => {
    expect(parisMidnightIso("2026-11-10")).toBe("2026-11-09T23:00:00.000Z");
    expect(parisMidnightIso("2026-07-01")).toBe("2026-06-30T22:00:00.000Z");
    expect(parisMidnightIso("2026-03-29")).toBe("2026-03-28T23:00:00.000Z"); // passage à l'heure d'été
    expect(parisMidnightIso("2026-10-25")).toBe("2026-10-24T22:00:00.000Z"); // passage à l'heure d'hiver
  });

  it("donne le jour de Paris même tard le soir en UTC", () => {
    expect(todayParisKey(new Date("2026-11-10T23:30:00Z"))).toBe("2026-11-11");
  });

  it("valide une clé de jour", () => {
    expect(isDayKey("2026-11-10")).toBe(true);
    expect(isDayKey("2026-13-40")).toBe(false);
    expect(isDayKey("2026-02-30")).toBe(false);
    expect(isDayKey("demain")).toBe(false);
  });

  it("écrit un jour en toutes lettres", () => {
    expect(dayKeyLongDate("2026-11-10")).toBe("mardi 10 novembre");
  });
});
