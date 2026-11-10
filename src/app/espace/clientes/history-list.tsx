import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { parisLongDate, parisTime } from "@/lib/paris-time";
import { BookingPhotos } from "./[id]/booking-photos";
import type { HistoryItem } from "./dossier";

const STATUS: Record<string, string> = { cancelled: "Annulé", done: "Fait", no_show: "Absente" };

type Props = { proId: string; clientId: string; items: HistoryItem[]; withPhotos?: boolean };

/** Historique des rendez-vous d'une cliente, du plus récent au plus ancien, avec photos avant/après. */
export function HistoryList({ proId, clientId, items, withPhotos = true }: Props) {
  if (!items.length) return <p className="text-mute">Aucun rendez-vous.</p>;
  return (
    <ul className="divide-y divide-line">
      {items.map((b) => (
        <li key={b.id} className={`py-2.5 ${b.status === "cancelled" ? "text-mute" : ""}`}>
          <div className="flex justify-between gap-3">
            <Link href={`/espace/agenda/${b.id}`} className="no-underline">
              <span className="block font-semibold first-letter:uppercase">
                {parisLongDate(b.starts_at)} à {parisTime(b.starts_at)}
              </span>
              <span className="text-sm text-mute">
                {b.service_name}
                {b.addon_name && ` + ${b.addon_name}`}
                {STATUS[b.status] && ` · ${STATUS[b.status]}`}
              </span>
            </Link>
            <span className="shrink-0 font-semibold tabular-nums">{formatPrice(b.price_cents)}</span>
          </div>
          {withPhotos && b.status !== "cancelled" && (
            <BookingPhotos proId={proId} clientId={clientId} bookingId={b.id} photos={b.photos} />
          )}
        </li>
      ))}
    </ul>
  );
}
