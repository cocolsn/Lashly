// Valeurs publiques (pas des secrets) : elles sont visibles dans le navigateur.
// Les variables d'environnement permettent de pointer vers un autre projet.
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://hkkkibjustiwtbuctffi.supabase.co";

export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  "sb_publishable_E5jy-Iqv8nIA1Bb3UzVNcA_Ausaj5eB";
