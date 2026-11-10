// Photos avant/après : stockage privé Supabase « lash-photos », dossier {pro}/{cliente}/.
export const PHOTO_BUCKET = "lash-photos";
export const PHOTO_KINDS = { before: "Avant", after: "Après" } as const;
export type PhotoKind = keyof typeof PHOTO_KINDS;

/** Taille maximale (côté le plus long) après réduction dans le navigateur. */
export const PHOTO_MAX_SIDE = 1600;

/** Dimensions réduites en gardant les proportions (jamais agrandies). */
export function fitWithin(width: number, height: number, maxSide = PHOTO_MAX_SIDE) {
  const scale = Math.min(1, maxSide / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}
