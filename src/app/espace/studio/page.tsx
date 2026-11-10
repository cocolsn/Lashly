import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StudioForm } from "./studio-form";

export const metadata: Metadata = { title: "Mon studio · Lashly" };

export default async function StudioPage() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;
  if (!userId) redirect("/connexion");

  const { data: pro } = await supabase
    .from("pros")
    .select("studio_name, city, phone, slug")
    .eq("id", userId)
    .maybeSingle();

  const siteHost = (await headers()).get("host") ?? "lashly";

  return (
    <section className="rounded-card border border-line bg-surface px-[18px] py-4 shadow-[0_1px_2px_rgba(31,23,38,.05)]">
      <h2 className="font-semibold">{pro ? "Mon studio" : "Bienvenue ! Présente ton studio"}</h2>
      {!pro && <p className="mt-1 text-sm text-mute">Ensuite, tu ajouteras tes prestations.</p>}
      <StudioForm initial={pro ? { ...pro, phone: pro.phone ?? "" } : null} siteHost={siteHost} />
    </section>
  );
}
