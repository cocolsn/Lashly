// Fiche cliente : choix proposés et lecture des champs saisis par la pro.

export const LASH_TYPES = ["Cil à cil (classique)", "Hybride", "Volume russe", "Volume léger", "Méga volume", "Rehaussement"];
export const EFFECTS = ["Naturel", "Œil de biche", "Cat eye", "Poupée (doll eye)", "Écureuil (squirrel)", "Wispy", "Kim K", "Wet look"];
export const VOLUMES = ["1D", "2D", "3D", "4-6D", "Méga volume"];
export const CURLS = ["J", "B", "C", "CC", "D", "DD", "L", "L+", "M"];
export const THICKNESSES = ["0,03", "0,05", "0,07", "0,10", "0,12", "0,15", "0,18", "0,20"];
export const EYE_SHAPES = ["Amande", "Rond", "Tombant", "Bridé", "Enfoncé", "Globuleux", "Rapprochés", "Écartés"];
export const NATURAL_LASHES = ["Fins", "Normaux", "Épais", "Clairsemés", "Courts", "Fragiles"];

export type RecordValues = {
  lashType: string;
  effect: string;
  volume: string;
  curl: string;
  thickness: string;
  lengthMin: string;
  lengthMax: string;
  mappingInner: string;
  mappingMiddle: string;
  mappingOuter: string;
  glue: string;
  eyeShape: string;
  naturalLashes: string;
  sensitiveEyes: boolean;
  contactLenses: boolean;
  patchTestOn: string;
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

/** La fiche contient-elle une information de santé (qui demande l'accord de la cliente) ? */
export function hasHealthInfo(v: Pick<RecordValues, "reactions" | "sensitiveEyes" | "contactLenses">): boolean {
  return Boolean(v.reactions.trim()) || v.sensitiveEyes || v.contactLenses;
}

const LENGTH_FIELDS = ["lengthMin", "lengthMax", "mappingInner", "mappingMiddle", "mappingOuter"] as const;

export function validateRecord(v: RecordValues, hasHealthConsent: boolean, healthConsentGiven: boolean): RecordErrors {
  const errors: RecordErrors = {};
  for (const key of ["lashType", "effect", "glue"] as const) {
    if (v[key].length > 80) errors[key] = "80 caractères maximum.";
  }
  if (v.volume.length > 20) errors.volume = "20 caractères maximum.";
  if (v.naturalLashes.length > 40) errors.naturalLashes = "40 caractères maximum.";
  if (v.eyeShape.length > 40) errors.eyeShape = "40 caractères maximum.";
  if (v.curl && !CURLS.includes(v.curl)) errors.curl = "Choisis une courbure dans la liste.";

  for (const key of LENGTH_FIELDS) {
    const n = parseDecimal(v[key]);
    if (n !== null && (Number.isNaN(n) || n < 0 || n > 30)) errors[key] = "En mm, par exemple 11 ou 11,5.";
  }
  const min = parseDecimal(v.lengthMin);
  const max = parseDecimal(v.lengthMax);
  if (!errors.lengthMin && !errors.lengthMax && min !== null && max !== null && min > max) {
    errors.lengthMax = "La longueur maxi doit être plus grande que la mini.";
  }

  const thickness = parseDecimal(v.thickness);
  if (thickness !== null && (Number.isNaN(thickness) || thickness <= 0 || thickness >= 1)) {
    errors.thickness = "En mm, par exemple 0,07.";
  }
  if (v.patchTestOn && !/^\d{4}-\d{2}-\d{2}$/.test(v.patchTestOn)) errors.patchTestOn = "Indique une date.";
  if (v.reactions.length > 4000) errors.reactions = "4 000 caractères maximum.";
  if (v.notes.length > 5000) errors.notes = "5 000 caractères maximum.";
  if (hasHealthInfo(v) && !hasHealthConsent && !healthConsentGiven) {
    errors.healthConsent = "Coche la case : il faut l’accord de ta cliente pour noter ces informations de santé.";
  }
  return errors;
}
