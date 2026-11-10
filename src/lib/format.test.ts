import { describe, expect, it } from "vitest";
import { centsToInput, formatDuration, formatPrice, parsePriceToCents } from "./format";

const nbsp = (s: string) => s.replace(/[  ]/g, " ");

describe("formatDuration", () => {
  it("affiche les minutes seules, les heures seules et les deux", () => {
    expect(formatDuration(45)).toBe("45 min");
    expect(formatDuration(120)).toBe("2 h");
    expect(formatDuration(150)).toBe("2 h 30");
    expect(formatDuration(65)).toBe("1 h 05");
  });
});

describe("formatPrice", () => {
  it("n'affiche les centimes que s'il y en a", () => {
    expect(nbsp(formatPrice(8000))).toBe("80 €");
    expect(nbsp(formatPrice(4550))).toBe("45,50 €");
  });
});

describe("parsePriceToCents", () => {
  it("accepte la virgule, le point et le symbole euro", () => {
    expect(parsePriceToCents("45,50")).toBe(4550);
    expect(parsePriceToCents("45.5")).toBe(4550);
    expect(parsePriceToCents("80 €")).toBe(8000);
    expect(parsePriceToCents("0")).toBe(0);
  });

  it("refuse le vide, le négatif et le texte", () => {
    expect(parsePriceToCents("")).toBeNull();
    expect(parsePriceToCents("-5")).toBeNull();
    expect(parsePriceToCents("abc")).toBeNull();
    expect(parsePriceToCents("12,345")).toBeNull();
  });
});

describe("centsToInput", () => {
  it("fait l'aller-retour avec parsePriceToCents", () => {
    for (const cents of [0, 2500, 4550, 11000]) {
      expect(parsePriceToCents(centsToInput(cents))).toBe(cents);
    }
  });
});
