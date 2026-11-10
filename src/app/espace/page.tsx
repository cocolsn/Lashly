import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { formatDuration, formatPrice } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { DeleteServiceButton } from "./delete-service-button";
import { ServiceForm } from "./service-form";

export const metadata: Metadata = { title: "Prestations · Lashly" };

const card = "rounded-card border border-line bg-surface px-[18px] py-4 shadow-[0_1px_2px_rgba(31,23,38,.05)]";

export default async function ServicesPage({ searchParams }: PageProps<"/espace">) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;
  if (!userId) redirect("/connexion");

  const [{ data: pro }, { data: services }] = await Promise.all([
    supabase.from("pros").select("id").eq("id", userId).maybeSingle(),
    supabase
      .from("services")
      .select("id, name, duration_min, price_cents, description, active")
      .order("position")
      .order("created_at"),
  ]);
  if (!pro) redirect("/espace/studio");

  const { modifier } = await searchParams;
  const editing = services?.find((s) => s.id === modifier) ?? null;

  return (
    <>
      {services?.length ? (
        <ul className="mb-3 space-y-3">
          {services.map((s) => (
            <li key={s.id} className={`${card} flex items-start justify-between gap-3`}>
              <div className="min-w-0">
                <p className="font-semibold">
                  {s.name}
                  {!s.active && (
                    <span className="ml-2 rounded-full bg-ok px-2 py-0.5 align-middle text-xs font-semibold text-ok-ink">
                      Masquée
                    </span>
                  )}
                </p>
                <p className="text-sm text-mute">{formatDuration(s.duration_min)}</p>
                {s.description && <p className="mt-1 max-w-[34ch] text-sm text-mute">{s.description}</p>}
              </div>
              <div className="shrink-0 text-right">
                <p className="text-lg font-semibold tabular-nums">{formatPrice(s.price_cents)}</p>
                <Link
                  href={`/espace?modifier=${s.id}`}
                  className="mt-1 inline-block rounded-btn border border-line bg-surface px-3.5 py-2 font-semibold no-underline"
                >
                  Modifier
                </Link>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="py-2 text-mute">Aucune prestation. Ajoute la première ci-dessous.</p>
      )}

      <section id="formulaire" className={card}>
        <h2 className="font-semibold">{editing ? "Modifier la prestation" : "Nouvelle prestation"}</h2>
        <ServiceForm key={editing?.id ?? "nouvelle"} service={editing} />
        {editing && (
          <div className="mt-2">
            <DeleteServiceButton id={editing.id} name={editing.name} />
          </div>
        )}
      </section>
    </>
  );
}
