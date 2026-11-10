import Link from "next/link";
import { parisLongDate, parisTime } from "@/lib/paris-time";
import type { Dossier } from "./dossier";

type Props = { dossier: NonNullable<Dossier>; linkToFile?: boolean };

/** En-tête du dossier : coordonnées, visites, et alerte santé bien visible. */
export function ClientSummary({ dossier, linkToFile }: Props) {
  const { client, visits, next, record } = dossier;
  const health = [
    record.reactions && `Allergies / réactions : ${record.reactions}`,
    record.sensitiveEyes && "Yeux sensibles",
    record.contactLenses && "Porte des lentilles",
  ].filter(Boolean);

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-xl font-semibold">{client.full_name}</h2>
        {linkToFile && (
          <Link href={`/espace/clientes/${client.id}`} className="shrink-0 text-sm font-semibold">
            Fiche complète →
          </Link>
        )}
      </div>
      <p className="mt-1 flex flex-col text-sm">
        <a href={`mailto:${client.email}`} className="font-semibold break-all">{client.email}</a>
        <a href={`tel:${client.phone.replace(/[^\d+]/g, "")}`} className="font-semibold">{client.phone}</a>
      </p>
      <p className="mt-2 text-sm text-mute">
        {visits.count === 0
          ? "Première visite"
          : `Venue ${visits.count} fois · première visite le ${parisLongDate(visits.first!)} · dernière le ${parisLongDate(visits.last!)}`}
        {next && ` · prochain rendez-vous le ${parisLongDate(next)} à ${parisTime(next)}`}
      </p>
      {health.length > 0 && (
        <ul className="mt-3 rounded-btn border border-err px-3 py-2 text-sm text-err" aria-label="Informations de santé">
          {health.map((h) => (
            <li key={String(h)} className="font-semibold">⚠ {h}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
