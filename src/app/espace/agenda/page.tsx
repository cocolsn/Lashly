import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { formatPrice } from "@/lib/format";
import {
  addDays,
  dayKeyLongDate,
  isDayKey,
  mondayOf,
  parisDayKey,
  parisMidnightIso,
  parisTime,
  todayParisKey,
} from "@/lib/paris-time";
import { createClient } from "@/lib/supabase/server";
import { CancelButton } from "./cancel-button";

export const metadata: Metadata = { title: "Agenda · Lashly" };

const card = "rounded-card border border-line bg-surface px-[18px] py-3.5 shadow-[0_1px_2px_rgba(31,23,38,.05)]";
/** Un rendez-vous passé ne s'annule plus (il sera marqué fait ou absente plus tard). */
function isUpcoming(iso: string): boolean {
  return Date.parse(iso) > Date.now();
}

const pill = "rounded-btn border px-3 py-1.5 text-sm font-semibold no-underline";

export default async function AgendaPage({ searchParams }: PageProps<"/espace/agenda">) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;
  if (!userId) redirect("/connexion");

  const params = await searchParams;
  const view = params.vue === "semaine" ? "semaine" : "jour";
  const today = todayParisKey();
  const asked = typeof params.jour === "string" && isDayKey(params.jour) ? params.jour : today;
  const first = view === "semaine" ? mondayOf(asked) : asked;
  const span = view === "semaine" ? 7 : 1;
  const days = Array.from({ length: span }, (_, i) => addDays(first, i));

  const [{ data: pro }, { data: bookings, error }] = await Promise.all([
    supabase.from("pros").select("id").eq("id", userId).maybeSingle(),
    supabase
      .from("bookings")
      .select("id, starts_at, ends_at, status, service_name, addon_name, price_cents, clients(full_name, phone)")
      .gte("starts_at", parisMidnightIso(first))
      .lt("starts_at", parisMidnightIso(addDays(first, span)))
      .order("starts_at"),
  ]);
  if (!pro) redirect("/espace/studio");

  const confirmed = (bookings ?? []).filter((b) => b.status !== "cancelled");
  const total = confirmed.reduce((sum, b) => sum + b.price_cents, 0);
  const href = (jour: string, vue = view) => `/espace/agenda?vue=${vue}&jour=${jour}`;

  return (
    <>
      <form role="search" action="/espace/clientes" className="mb-3 flex gap-2">
        <label htmlFor="q" className="sr-only">Chercher une cliente</label>
        <input id="q" name="q" type="search" placeholder="Chercher une cliente…"
          className="min-w-0 flex-1 rounded-[10px] border border-line bg-surface px-3 py-2.5 text-ink" />
        <button type="submit" className="cursor-pointer rounded-btn border border-line bg-surface px-3.5 font-semibold">
          Chercher
        </button>
      </form>
      <div className="mb-3 flex gap-1.5" role="group" aria-label="Affichage">
        {(["jour", "semaine"] as const).map((v) => (
          <Link
            key={v}
            href={href(asked, v)}
            aria-current={view === v ? "page" : undefined}
            className={`${pill} flex-1 text-center ${view === v ? "border-acc bg-acc text-acc-ink" : "border-line bg-ok text-ok-ink"}`}
          >
            {v === "jour" ? "Jour" : "Semaine"}
          </Link>
        ))}
      </div>

      <div className="mb-1 flex items-center justify-between gap-2">
        <Link href={href(addDays(first, -span))} className={`${pill} border-line bg-surface`} aria-label={view === "jour" ? "Jour précédent" : "Semaine précédente"}>
          ←
        </Link>
        <h2 className="text-center font-semibold first-letter:uppercase">
          {view === "jour" ? dayKeyLongDate(first) : `Semaine du ${dayKeyLongDate(first).replace(/^\S+ /, "")}`}
        </h2>
        <Link href={href(addDays(first, span))} className={`${pill} border-line bg-surface`} aria-label={view === "jour" ? "Jour suivant" : "Semaine suivante"}>
          →
        </Link>
      </div>
      <p className="mb-4 text-center text-sm text-mute">
        {confirmed.length} rendez-vous{confirmed.length ? ` · ${formatPrice(total)}` : ""}
        {!days.includes(today) && (
          <>
            {" · "}
            <Link href={href(today)} className="font-semibold text-ink">
              Revenir à aujourd’hui
            </Link>
          </>
        )}
      </p>

      {error && <p role="alert" className="mb-3 text-sm text-err">Impossible de charger l’agenda. Recharge la page.</p>}

      {days.map((day) => {
        const list = (bookings ?? []).filter((b) => parisDayKey(b.starts_at) === day);
        if (view === "semaine" && !list.length) return null;
        return (
          <section key={day} className="mb-4">
            {view === "semaine" && <h3 className="mb-2 font-semibold first-letter:uppercase">{dayKeyLongDate(day)}</h3>}
            {list.length === 0 && <p className="text-mute">Aucun rendez-vous ce jour-là.</p>}
            <ul className="space-y-2.5">
              {list.map((b) => {
                const cancelled = b.status === "cancelled";
                const client = b.clients;
                return (
                  <li key={b.id} className={`${card} ${cancelled ? "opacity-60" : ""}`}>
                    <Link href={`/espace/agenda/${b.id}`} className="flex items-start justify-between gap-3 no-underline">
                      <div className="min-w-0">
                        <p className={`font-semibold tabular-nums ${cancelled ? "line-through" : ""}`}>
                          {parisTime(b.starts_at)} – {parisTime(b.ends_at)}
                        </p>
                        <p className="font-semibold">{client?.full_name}</p>
                        <p className="text-sm text-mute">
                          {b.service_name}
                          {b.addon_name && ` + ${b.addon_name}`}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="font-semibold tabular-nums">{formatPrice(b.price_cents)}</p>
                        {cancelled ? (
                          <span className="mt-1 inline-block rounded-full bg-ok px-2 py-0.5 text-xs font-semibold text-ok-ink">
                            Annulé
                          </span>
                        ) : (
                          <span className="mt-1 block text-sm text-mute">Voir →</span>
                        )}
                      </div>
                    </Link>
                    {client?.phone && (
                      <a href={`tel:${client.phone.replace(/[^\d+]/g, "")}`} className="text-sm font-semibold">
                        {client.phone}
                      </a>
                    )}
                    {b.status === "confirmed" && isUpcoming(b.starts_at) && (
                      <div className="mt-2.5">
                        <CancelButton id={b.id} label={client?.full_name ?? "cette cliente"} />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
      {view === "semaine" && !bookings?.length && <p className="text-mute">Aucun rendez-vous cette semaine.</p>}
    </>
  );
}
