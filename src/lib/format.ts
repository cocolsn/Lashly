/** 150 → « 2 h 30 », 45 → « 45 min », 120 → « 2 h ». */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} min`;
  return m ? `${h} h ${String(m).padStart(2, "0")}` : `${h} h`;
}

const euros = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
const wholeEuros = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

/** 8000 → « 80 € », 4550 → « 45,50 € ». */
export function formatPrice(cents: number): string {
  return (cents % 100 === 0 ? wholeEuros : euros).format(cents / 100);
}

/** « 45,50 », « 45.5 », « 45 € » → 4550. Renvoie null si ce n'est pas un prix valide. */
export function parsePriceToCents(input: string): number | null {
  const cleaned = input.replace(/[€\s ]/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  return Math.round(Number(cleaned) * 100);
}

/** 4550 → « 45,50 », 8000 → « 80 » (pour pré-remplir un champ). */
export function centsToInput(cents: number): string {
  return cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2).replace(".", ",");
}
