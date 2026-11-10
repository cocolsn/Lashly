"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/espace/agenda", label: "Agenda" },
  { href: "/espace/clientes", label: "Clientes" },
  { href: "/espace", label: "Prestations" },
  { href: "/espace/horaires", label: "Horaires" },
  { href: "/espace/studio", label: "Mon studio" },
] as const;

export function Tabs() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Sections de l’espace pro"
      className="-mx-4 mb-5 flex gap-[18px] overflow-x-auto border-b border-line px-4 whitespace-nowrap"
    >
      {TABS.map((tab) => {
        const current = tab.href === "/espace" ? pathname === "/espace" : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={current ? "page" : undefined}
            className={`-mb-px shrink-0 border-b-2 px-0.5 py-2.5 font-semibold no-underline ${
              current ? "border-acc text-ink" : "border-transparent text-mute"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
