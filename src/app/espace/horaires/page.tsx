import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DEFAULT_SCHEDULE, toHHMM, type Schedule } from "@/lib/hours";
import { createClient } from "@/lib/supabase/server";
import { HoursForm } from "./hours-form";

export const metadata: Metadata = { title: "Horaires · Lashly" };

export default async function HoursPage() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims.sub;
  if (!userId) redirect("/connexion");

  const [{ data: pro }, { data: rows }, { data: breaks }] = await Promise.all([
    supabase.from("pros").select("buffer_minutes").eq("id", userId).maybeSingle(),
    supabase.from("opening_hours").select("weekday, is_open, slot_mode, start_time, end_time, fixed_times"),
    supabase.from("opening_breaks").select("weekday, start_time, end_time").order("start_time"),
  ]);
  if (!pro) redirect("/espace/studio");

  // Tant que rien n'est enregistré, on propose des horaires par défaut.
  const schedule: Schedule = rows?.length
    ? {
        days: DEFAULT_SCHEDULE.days.map((d) => {
          const row = rows.find((r) => r.weekday === d.weekday);
          if (!row) return { ...d, isOpen: false };
          return {
            weekday: d.weekday,
            isOpen: row.is_open,
            mode: row.slot_mode === "fixed" ? "fixed" : "auto",
            start: toHHMM(row.start_time),
            end: toHHMM(row.end_time),
            breaks: (breaks ?? [])
              .filter((b) => b.weekday === d.weekday)
              .map((b) => ({ start: toHHMM(b.start_time), end: toHHMM(b.end_time) })),
            fixedTimes: row.fixed_times.map(toHHMM),
          };
        }),
        buffer: String(pro.buffer_minutes),
      }
    : DEFAULT_SCHEDULE;

  return (
    <>
      {!rows?.length && (
        <p className="mb-3 rounded-btn bg-ok px-3 py-2 text-sm text-ok-ink">
          Voici des horaires de départ. Ajuste-les, puis enregistre.
        </p>
      )}
      <HoursForm initial={schedule} />
    </>
  );
}
