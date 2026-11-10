import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { parisLongDate } from "@/lib/paris-time";
import { ClientSummary } from "../client-summary";
import { loadDossier } from "../dossier";
import { HistoryList } from "../history-list";
import { ContactForm } from "./contact-form";
import { DeleteClientButton } from "./delete-client-button";
import { RecordForm } from "./record-form";

export const metadata: Metadata = { title: "Fiche cliente · Lashly" };

const card = "mb-3 rounded-card border border-line bg-surface px-[18px] py-4 shadow-[0_1px_2px_rgba(31,23,38,.05)]";

export default async function ClientPage({ params }: PageProps<"/espace/clientes/[id]">) {
  const { id } = await params;
  const dossier = await loadDossier(id);
  if (!dossier) notFound();
  const { client, proId } = dossier;

  return (
    <>
      <Link href="/espace/clientes" className="mb-3 inline-block text-sm font-semibold text-mute">
        ← Toutes les clientes
      </Link>
      <section className={card}>
        <ClientSummary dossier={dossier} />
      </section>

      <section className={card}>
        <h3 className="font-semibold">Fiche</h3>
        <RecordForm clientId={client.id} initial={dossier.record} hasHealthConsent={Boolean(dossier.healthConsentAt)}
          healthConsentDate={dossier.healthConsentAt ? parisLongDate(dossier.healthConsentAt) : null} />
      </section>

      <section className={card}>
        <h3 className="mb-1 font-semibold">Historique et photos</h3>
        <p className="mb-1 text-sm text-mute">Demande l’accord de ta cliente avant de la prendre en photo.</p>
        <HistoryList proId={proId} clientId={client.id} items={dossier.history} />
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
