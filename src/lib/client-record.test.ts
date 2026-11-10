import { describe, expect, it } from "vitest";
import { decimalToInput, hasHealthInfo, parseDecimal, validateRecord, type RecordValues } from "./client-record";

const empty: RecordValues = {
  lashType: "",
  effect: "",
  volume: "",
  curl: "",
  thickness: "",
  lengthMin: "",
  lengthMax: "",
  mappingInner: "",
  mappingMiddle: "",
  mappingOuter: "",
  glue: "",
  eyeShape: "",
  naturalLashes: "",
  sensitiveEyes: false,
  contactLenses: false,
  patchTestOn: "",
  reactions: "",
  notes: "",
};

describe("parseDecimal", () => {
  it("accepte virgule, point et « mm »", () => {
    expect(parseDecimal("11,5")).toBe(11.5);
    expect(parseDecimal("0.07")).toBe(0.07);
    expect(parseDecimal("12 mm")).toBe(12);
  });

  it("renvoie null si vide, NaN si invalide", () => {
    expect(parseDecimal("  ")).toBeNull();
    expect(parseDecimal("abc")).toBeNaN();
  });
});

describe("decimalToInput", () => {
  it("écrit à la française", () => {
    expect(decimalToInput(11.5)).toBe("11,5");
    expect(decimalToInput(0.07, 2)).toBe("0,07");
    expect(decimalToInput(null)).toBe("");
  });
});

describe("validateRecord", () => {
  it("accepte une fiche vide ou complète", () => {
    expect(validateRecord(empty, false, false)).toEqual({});
    const full: RecordValues = {
      ...empty,
      lashType: "Hybride",
      effect: "Cat eye",
      volume: "3D",
      curl: "CC",
      thickness: "0,07",
      lengthMin: "8",
      lengthMax: "12",
      mappingInner: "8",
      mappingMiddle: "10",
      mappingOuter: "12",
      glue: "Sky S+",
      eyeShape: "Amande",
      naturalLashes: "Fins",
      patchTestOn: "2026-11-01",
    };
    expect(validateRecord(full, false, false)).toEqual({});
  });

  it("refuse une courbure inconnue et des mesures impossibles", () => {
    const errors = validateRecord({ ...empty, curl: "Z", lengthMin: "45", thickness: "2", mappingOuter: "abc" }, false, false);
    expect(Object.keys(errors).sort()).toEqual(["curl", "lengthMin", "mappingOuter", "thickness"]);
  });

  it("refuse une longueur mini plus grande que la maxi", () => {
    expect(validateRecord({ ...empty, lengthMin: "13", lengthMax: "9" }, false, false).lengthMax).toBeDefined();
  });

  it("exige l'accord de la cliente pour toute information de santé", () => {
    for (const health of [{ reactions: "Yeux qui piquent" }, { sensitiveEyes: true }, { contactLenses: true }]) {
      const v = { ...empty, ...health };
      expect(validateRecord(v, false, false).healthConsent).toBeDefined();
      expect(validateRecord(v, false, true)).toEqual({});
      expect(validateRecord(v, true, false)).toEqual({});
    }
  });
});

describe("hasHealthInfo", () => {
  it("détecte réactions, yeux sensibles et lentilles", () => {
    expect(hasHealthInfo(empty)).toBe(false);
    expect(hasHealthInfo({ ...empty, reactions: " " })).toBe(false);
    expect(hasHealthInfo({ ...empty, contactLenses: true })).toBe(true);
  });
});
