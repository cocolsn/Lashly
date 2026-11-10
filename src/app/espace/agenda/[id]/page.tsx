import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDuration, formatPrice } from "@/lib/format";
import { parisDayKey, parisLongDate, parisTime } from "@/lib/paris-time";
import { createClient } from "@/lib/supabase/server";
import { BookingPhotos } from "../../clientes/[id]/booking-photos";
import { RecordForm } from "../../clientes/[id]/record-form";
import { ClientSummary } from "../../clientes/client-summary";
import { loadDossier } from "../../clientes/dossier";
import { HistoryList } from "../../clientes/history-list";
import { CancelButton } from "../cancel-button";

export const metadata: Metadata = { title: "Rendez-vous · Lashly" };

const card = "mb-3 rounded-card border border-line bg-surface px-[18px] py-4 shadow-[0_1px_2px_rgba(31,23,38,.05)]";
const STATUS: Record<string, string> = { confirmed: "Confirmé", cancelled: "Annulé", done: "Fait", no_show: "Absente" };

function isUpcoming(iso: string): boolean {
  return Date.parse(iso) > Date.now();
}

export default async function BookingPage({ params }: PageProps<"/espace/agenda/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select("id, client_id, starts_at, ends_at, status, service_name, addon_name, price_cents")
    .eq("id", id)
    .maybeSingle();
  if (!booking) notFound();

  const dossier = await loadDossier(booking.client_id);
  if (!dossier) notFound();
  const current = dossier.history.find((h) => h.id === booking.id);
  const others = dossier.history.filter((h) => h.id !== booking.id);
  const minutes = Math.round((Date.parse(booking.ends_at) - Date.parse(booking.starts_at)) / 60000);

  return (
    <>
      <Link href={`/espace/agenda?vue=jour&jour=${parisDayKey(booking.starts_at)}`}
        className="mb-3 inline-block text-sm font-semibold text-mute">
        ← Agenda du {parisLongDate(booking.starts_at)}
      </Link>

      <section className={card}>
        <p className="text-sm text-mute first-letter:uppercase">{parisLongDate(booking.starts_at)}</p>
        <div className="flex items-start justify-between gap-3">
          <h2 className={`text-xl font-semibold tabular-nums ${booking.status === "cancelled" ? "line-through" : ""}`}>
            {parisTime(booking.starts_at)} – {parisTime(booking.ends_at)}
          </h2>
          <span className="rounded-full bg-ok px-2.5 py-0.5 text-sm font-semibold text-ok-ink">{STATUS[booking.status]}</span>
        </div>
        <p className="mt-1">
          {booking.service_name}
          {booking.addon_name && ` + ${booking.addon_name}`}
        </p>
        <p className="text-sm text-mute">
          {formatDuration(minutes)} · {formatPrice(booking.price_cents)}
        </p>
        {booking.status !== "cancelled" && current && (
          <>
            <p className="mt-3 text-sm font-semibold">Photos de ce rendez-vous</p>
            <BookingPhotos proId={dossier.proId} clientId={dossier.client.id} bookingId={booking.id} photos={current.photos} />
          </>
        )}
        {booking.status === "confirmed" && isUpcoming(booking.starts_at) && (
          <div className="mt-3">
            <CancelButton id={booking.id} label={dossier.client.full_name} />
          </div>
        )}
      </section>

      <section className={card}>
        <ClientSummary dossier={dossier} linkToFile />
      </section>

      <section className={card}>
        <h3 className="font-semibold">Fiche (à compléter pendant la prestation)</h3>
        <RecordForm clientId={dossier.client.id} initial={dossier.record} hasHealthConsent={Boolean(dossier.healthConsentAt)}
          healthConsentDate={dossier.healthConsentAt ? parisLongDate(dossier.healthConsentAt) : null} />
      </section>

      <section className={card}>
        <h3 className="mb-1 font-semibold">Ses autres rendez-vous</h3>
        <HistoryList proId={dossier.proId} clientId={dossier.client.id} items={others} withPhotos={false} />
      </section>
    </>
  );
}
