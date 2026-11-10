import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { LogoMark } from "@/components/logo-mark";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./actions";
import { StudioForm } from "./studio-form";

export const metadata: Metadata = { title: "Mon espace pro · Lashly" };

export default async function EspacePage() {
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
    <main className="mx-auto w-full max-w-[640px] px-4 pt-5 pb-12">
      <header className="mt-1.5 mb-1.5 flex items-center gap-3">
        <LogoMark />
        <h1 className="flex-1 text-2xl font-semibold tracking-tight">Mon espace pro</h1>
        <form action={signOut}>
          <button
            type="submit"
            className="cursor-pointer rounded-btn border border-line bg-surface px-3.5 py-2 text-sm font-semibold"
          >
            Me déconnecter
          </button>
        </form>
      </header>
      <p className="mb-5 text-mute">
        {pro
          ? "Ton profil de studio. Tes clientes verront ces informations."
          : "Bienvenue ! Commence par présenter ton studio."}
      </p>

      <section className="rounded-card border border-line bg-surface px-[18px] py-4 shadow-[0_1px_2px_rgba(31,23,38,.05)]">
        <h2 className="font-semibold">{pro ? "Mon studio" : "Ton studio"}</h2>
        <StudioForm
          initial={pro ? { ...pro, phone: pro.phone ?? "" } : null}
          siteHost={siteHost}
        />
      </section>
    </main>
  );
}
