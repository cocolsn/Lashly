import { describe, expect, it } from "vitest";
import { slugError, slugify } from "./slug";

describe("slugify", () => {
  it("retire les accents, apostrophes et espaces", () => {
    expect(slugify("Les Cils d’Émilie")).toBe("les-cils-d-emilie");
  });

  it("supprime les tirets en début et en fin", () => {
    expect(slugify("  --Lash & Co!  ")).toBe("lash-co");
  });

  it("limite à 40 caractères sans finir par un tiret", () => {
    const slug = slugify("a".repeat(39) + " bcd");
    expect(slug.length).toBeLessThanOrEqual(40);
    expect(slug.endsWith("-")).toBe(false);
  });
});

describe("slugError", () => {
  it("accepte une adresse valide", () => {
    expect(slugError("studio-emilie-77")).toBeNull();
  });

  it("refuse les adresses trop courtes", () => {
    expect(slugError("ab")).not.toBeNull();
  });

  it("refuse les majuscules et caractères spéciaux", () => {
    expect(slugError("Studio")).not.toBeNull();
    expect(slugError("studio_emilie")).not.toBeNull();
    expect(slugError("studio--emilie")).not.toBeNull();
  });

  it("refuse les adresses réservées", () => {
    expect(slugError("connexion")).not.toBeNull();
    expect(slugError("espace")).not.toBeNull();
  });
});
