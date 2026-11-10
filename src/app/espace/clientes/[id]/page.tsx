import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { decimalToInput } from "@/lib/client-record";
import { formatPrice } from "@/lib/format";
import { parisLongDate, parisTime } from "@/lib/paris-time";
import { createClient } from "@/lib/supabase/server";
import { ContactForm } from "./contact-form";
import { DeleteClientButton } from "./delete-client-button";
import { RecordForm } from "./record-form";

export const metadata: Metadata = { title: "Fiche cliente · Lashly" };

const card = "mb-3 rounded-card border border-line bg-surface px-[18px] py-4 shadow-[0_1px_2px_rgba(31,23,38,.05)]";
const STATUS: Record<string, string> = { cancelled: "Annulé", done: "Fait", no_show: "Absente" };

export default async function ClientPage({ params }: PageProps<"/espace/clientes/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims.sub) redirect("/connexion");

  const { data: client } = await supabase
    .from("clients")
    .select(
      "id, full_name, phone, email, consent_at, client_records(lash_type, curl, length_mm, thickness, glue, reactions, health_consent_at, notes), bookings(id, starts_at, service_name, addon_name, price_cents, status)",
    )
    .eq("id", id)
    .order("starts_at", { referencedTable: "bookings", ascending: false })
    .maybeSingle();
  if (!client) notFound();

  const record = client.client_records;
  const history = client.bookings;
  const consentDate = record?.health_consent_at ? parisLongDate(record.health_consent_at) : null;

  return (
    <>
      <Link href="/espace/clientes" className="mb-3 inline-block text-sm font-semibold text-mute">
        ← Toutes les clientes
      </Link>
      <h2 className="mb-3 text-xl font-semibold">{client.full_name}</h2>

      <section className={card}>
        <h3 className="font-semibold">Fiche</h3>
        <RecordForm
          clientId={client.id}
          hasHealthConsent={Boolean(record?.health_consent_at)}
          healthConsentDate={consentDate}
          initial={{
            lashType: record?.lash_type ?? "",
            curl: record?.curl ?? "",
            length: decimalToInput(record?.length_mm ?? null),
            thickness: decimalToInput(record?.thickness ?? null, 2),
            glue: record?.glue ?? "",
            reactions: record?.reactions ?? "",
            notes: record?.notes ?? "",
          }}
        />
      </section>

      <section className={card}>
        <h3 className="mb-2 font-semibold">Historique des poses</h3>
        {history.length === 0 && <p className="text-mute">Aucun rendez-vous.</p>}
        <ul className="divide-y divide-line">
          {history.map((b) => (
            <li key={b.id} className={`flex justify-between gap-3 py-2 ${b.status === "cancelled" ? "text-mute" : ""}`}>
              <span>
                <span className="block font-semibold first-letter:uppercase">
                  {parisLongDate(b.starts_at)} à {parisTime(b.starts_at)}
                </span>
                <span className="text-sm text-mute">
                  {b.service_name}
                  {b.addon_name && ` + ${b.addon_name}`}
                  {STATUS[b.status] && ` · ${STATUS[b.status]}`}
                </span>
              </span>
              <span className="shrink-0 font-semibold tabular-nums">{formatPrice(b.price_cents)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className={card}>
        <h3 className="font-semibold">Coordonnées</h3>
        <ContactForm clientId={client.id} initial={{ fullName: client.full_name, phone: client.phone, email: client.email }} />
        <p className="mt-3 text-sm text-mute">
          Accord pour l’utilisation de ses données donné le {parisLongDate(client.consent_at)}.
        </p>
      </section>

      <section className={card}>
        <h3 className="font-semibold">Ses données (RGPD)</h3>
        <p className="mt-1 mb-3 text-sm text-mute">
          Ta cliente peut te demander une copie de ses données ou leur suppression.
        </p>
        <div className="flex flex-wrap gap-2">
          <a href={`/espace/clientes/${client.id}/export`}
            className="rounded-btn border border-line bg-surface px-3.5 py-2 text-sm font-semibold no-underline">
            Télécharger ses données
          </a>
          <DeleteClientButton id={client.id} name={client.full_name} />
        </div>
      </section>
    </>
  );
}
