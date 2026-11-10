import { describe, expect, it } from "vitest";
import { decimalToInput, parseDecimal, validateRecord, type RecordValues } from "./client-record";

const empty: RecordValues = { lashType: "", curl: "", length: "", thickness: "", glue: "", reactions: "", notes: "" };

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
    expect(
      validateRecord(
        { ...empty, lashType: "Hybride", curl: "CC", length: "11,5", thickness: "0,07", glue: "Sky S+" },
        false,
        false,
      ),
    ).toEqual({});
  });

  it("refuse une courbure inconnue et des mesures impossibles", () => {
    const errors = validateRecord({ ...empty, curl: "Z", length: "45", thickness: "2" }, false, false);
    expect(Object.keys(errors).sort()).toEqual(["curl", "length", "thickness"]);
  });

  it("exige l'accord de la cliente pour noter des réactions", () => {
    expect(validateRecord({ ...empty, reactions: "Yeux qui piquent" }, false, false).healthConsent).toBeDefined();
    expect(validateRecord({ ...empty, reactions: "Yeux qui piquent" }, false, true)).toEqual({});
    expect(validateRecord({ ...empty, reactions: "Yeux qui piquent" }, true, false)).toEqual({});
  });
});
