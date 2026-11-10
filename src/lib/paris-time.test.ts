import { describe, expect, it } from "vitest";
import { groupSlotsByParisDay, parisDayKey, parisLongDate, parisTime } from "./paris-time";

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
