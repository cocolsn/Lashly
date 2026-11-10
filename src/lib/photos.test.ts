import { describe, expect, it } from "vitest";
import { fitWithin } from "./photos";

describe("fitWithin", () => {
  it("réduit une grande photo en gardant les proportions", () => {
    expect(fitWithin(4032, 3024)).toEqual({ width: 1600, height: 1200 });
    expect(fitWithin(3024, 4032)).toEqual({ width: 1200, height: 1600 });
  });

  it("n'agrandit jamais une petite photo", () => {
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 });
  });
});
