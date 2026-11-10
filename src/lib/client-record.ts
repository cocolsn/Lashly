// Fiche cliente : choix proposés et lecture des champs saisis par la pro.

export const LASH_TYPES = ["Cil à cil (classique)", "Hybride", "Volume russe", "Volume léger", "Méga volume", "Wispy", "Rehaussement"];
export const CURLS = ["J", "B", "C", "CC", "D", "DD", "L", "L+", "M"];
export const THICKNESSES = ["0,03", "0,05", "0,07", "0,10", "0,12", "0,15", "0,18", "0,20"];

export type RecordValues = {
  lashType: string;
  curl: string;
  length: string;
  thickness: string;
  glue: string;
  reactions: string;
  notes: string;
};

export type RecordErrors = Partial<Record<keyof RecordValues | "healthConsent", string>>;

/** « 11,5 » ou « 11.5 » → 11.5 ; vide → null ; invalide → NaN. */
export function parseDecimal(input: string): number | null {
  const cleaned = input.trim().replace(",", ".").replace(/\s*mm$/i, "");
  if (!cleaned) return null;
  return /^\d+(\.\d+)?$/.test(cleaned) ? Number(cleaned) : Number.NaN;
}

/** Nombre → texte à la française pour pré-remplir un champ (11.5 → « 11,5 »). */
export function decimalToInput(value: number | null, digits?: number): string {
  if (value === null) return "";
  return (digits === undefined ? String(value) : value.toFixed(digits)).replace(".", ",");
}

export function validateRecord(v: RecordValues, hasHealthConsent: boolean, healthConsentGiven: boolean): RecordErrors {
  const errors: RecordErrors = {};
  if (v.lashType.length > 80) errors.lashType = "80 caractères maximum.";
  if (v.curl && !CURLS.includes(v.curl)) errors.curl = "Choisis une courbure dans la liste.";
  const length = parseDecimal(v.length);
  if (length !== null && (Number.isNaN(length) || length < 0 || length > 30)) {
    errors.length = "Indique une longueur en mm, par exemple 11 ou 11,5.";
  }
  const thickness = parseDecimal(v.thickness);
  if (thickness !== null && (Number.isNaN(thickness) || thickness <= 0 || thickness >= 1)) {
    errors.thickness = "Indique une épaisseur en mm, par exemple 0,07.";
  }
  if (v.glue.length > 80) errors.glue = "80 caractères maximum.";
  if (v.reactions.length > 4000) errors.reactions = "4 000 caractères maximum.";
  if (v.notes.length > 5000) errors.notes = "5 000 caractères maximum.";
  if (v.reactions.trim() && !hasHealthConsent && !healthConsentGiven) {
    errors.healthConsent = "Coche la case : il faut l’accord de ta cliente pour noter ses réactions.";
  }
  return errors;
}
