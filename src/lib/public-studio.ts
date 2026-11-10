// Forme des données renvoyées par la fonction Supabase get_public_studio.
export type PublicService = {
  id: string;
  name: string;
  duration_min: number;
  price_cents: number;
  description: string | null;
  addon_name: string | null;
  addon_price_cents: number | null;
  addon_duration_min: number | null;
};

export type PublicStudio = {
  slug: string;
  studio_name: string;
  city: string;
  services: PublicService[];
};

/** Durée et prix d'une prestation, avec ou sans son option. */
export function serviceTotals(service: PublicService, withAddon: boolean) {
  const addon = withAddon && service.addon_name !== null;
  return {
    duration: service.duration_min + (addon ? (service.addon_duration_min ?? 0) : 0),
    priceCents: service.price_cents + (addon ? (service.addon_price_cents ?? 0) : 0),
  };
}
