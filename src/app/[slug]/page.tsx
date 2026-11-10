import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { LogoMark } from "@/components/logo-mark";
import type { PublicStudio } from "@/lib/public-studio";
import { createClient } from "@/lib/supabase/server";
import { BookingFlow } from "./booking-flow";

const getStudio = cache(async (slug: string): Promise<PublicStudio | null> => {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_public_studio", { p_slug: slug });
  return (data as PublicStudio | null) ?? null;
});

export async function generateMetadata({ params }: PageProps<"/[slug]">): Promise<Metadata> {
  const studio = await getStudio((await params).slug);
  return { title: studio ? `Réserver · ${studio.studio_name}` : "Studio introuvable · Lashly" };
}

export default async function StudioBookingPage({ params }: PageProps<"/[slug]">) {
  const studio = await getStudio((await params).slug);
  if (!studio) notFound();

  return (
    <main className="mx-auto w-full max-w-[560px] px-4 pt-[18px] pb-10">
      <header className="mb-[18px] flex items-center gap-3">
        <LogoMark size="md" />
        <div>
          <p className="leading-tight font-semibold">{studio.studio_name}</p>
          <p className="text-sm text-mute">Extensions de cils · {studio.city}</p>
        </div>
      </header>
      {studio.services.length ? (
        <BookingFlow studio={studio} />
      ) : (
        <p className="text-mute">Ce studio n’a pas encore ouvert ses réservations en ligne. Reviens bientôt.</p>
      )}
    </main>
  );
}
