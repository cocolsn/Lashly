import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { parisLongDate } from "@/lib/paris-time";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Clientes · Lashly" };

export default async function ClientsPage({ searchParams }: PageProps<"/espace/clientes">) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims.sub) redirect("/connexion");

  const { q } = await searchParams;
  const search = typeof q === "string" ? q.trim().slice(0, 80) : "";

  let query = supabase
    .from("clients")
    .select("id, full_name, email, phone, bookings(starts_at, status)")
    .order("full_name");
  // Recherche sur le nom, l'email ou le téléphone. Les caractères qui ont un sens pour la base
  // (virgule, parenthèses, %, _, \, *, ") sont retirés pour qu'une saisie ne puisse rien détourner.
  const term = search.replace(/[,()%_\\*"]/g, " ").trim();
  if (term) query = query.or(`full_name.ilike.*${term}*,email.ilike.*${term}*,phone.ilike.*${term}*`);
  const { data: clients } = await query;

  return (
    <>
      <form role="search" className="mb-4 flex gap-2">
        <label htmlFor="q" className="sr-only">Chercher une cliente</label>
        <input id="q" name="q" type="search" defaultValue={search} placeholder="Nom, email ou téléphone…"
          className="min-w-0 flex-1 rounded-[10px] border border-line bg-surface px-3 py-2.5 text-ink" />
        <button type="submit" className="cursor-pointer rounded-btn border border-acc bg-acc px-4 font-semibold text-acc-ink">
          Chercher
        </button>
      </form>

      {!clients?.length ? (
        <p className="text-mute">
          {search
            ? "Aucune cliente ne correspond à ta recherche."
            : "Pas encore de cliente. Elles apparaissent ici dès leur première réservation."}
        </p>
      ) : (
        <ul className="space-y-2.5">
          {clients.map((c) => {
            const visits = c.bookings.filter((b) => b.status !== "cancelled").map((b) => b.starts_at).sort();
            const last = visits.filter((d) => Date.parse(d) <= Date.now()).at(-1);
            return (
              <li key={c.id}>
                <Link href={`/espace/clientes/${c.id}`}
                  className="flex items-center justify-between gap-3 rounded-card border border-line bg-surface px-[18px] py-3.5 no-underline shadow-[0_1px_2px_rgba(31,23,38,.05)] hover:border-acc">
                  <span className="min-w-0">
                    <span className="block font-semibold">{c.full_name}</span>
                    <span className="block text-sm break-all">{c.email}</span>
                    <span className="text-sm text-mute">
                      {visits.length} rendez-vous{last ? ` · dernier le ${parisLongDate(last)}` : ""}
                    </span>
                  </span>
                  <span aria-hidden="true" className="text-mute">→</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
