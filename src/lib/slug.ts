// Doit rester aligné avec la contrainte sur pros.slug (supabase/migrations).
export const RESERVED_SLUGS = [
  "admin",
  "aide",
  "api",
  "auth",
  "cgu",
  "confidentialite",
  "connexion",
  "contact",
  "deconnexion",
  "espace",
  "inscription",
  "lashly",
  "mentions-legales",
  "reservation",
  "studio",
] as const;

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Transforme un nom de studio en adresse : « Cils d'Émilie » → « cils-d-emilie ». */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/, "");
}

/** Renvoie un message d'erreur en français, ou null si l'adresse est valide. */
export function slugError(slug: string): string | null {
  if (slug.length < 3) return "L’adresse doit faire au moins 3 caractères.";
  if (slug.length > 40) return "L’adresse doit faire 40 caractères maximum.";
  if (!SLUG_PATTERN.test(slug)) {
    return "Utilise seulement des lettres minuscules, des chiffres et des tirets.";
  }
  if ((RESERVED_SLUGS as readonly string[]).includes(slug)) {
    return "Cette adresse est réservée, choisis-en une autre.";
  }
  return null;
}
