"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isTime, parseSchedule, validateSchedule, type Schedule, type ScheduleErrors } from "@/lib/hours";
import { createClient } from "@/lib/supabase/server";

export type HoursState = {
  schedule?: Schedule;
  errors?: ScheduleErrors;
  error?: string;
  saved?: boolean;
};

const SAVE_FAILED = "L’enregistrement n’a pas marché. Réessaie dans un instant.";

export async function saveHours(prev: HoursState, formData: FormData): Promise<HoursState> {
  let schedule: Schedule | null = null;
  try {
    schedule = parseSchedule(JSON.parse(String(formData.get("schedule") ?? "")));
  } catch {
    // Donnée illisible : traitée comme une erreur ci-dessous.
  }
  if (!schedule) return { schedule: prev.schedule, error: SAVE_FAILED };

  const errors = validateSchedule(schedule);
  if (errors) return { schedule, errors };

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) redirect("/connexion");

  // Un jour fermé garde ses réglages, sauf des heures incohérentes (non vérifiées car masquées).
  const hoursRows = schedule.days.map((d) => {
    const validRange = isTime(d.start) && isTime(d.end) && d.start < d.end;
    return {
      pro_id: userId,
      weekday: d.weekday,
      is_open: d.isOpen,
      slot_mode: d.mode,
      start_time: validRange ? d.start : "09:00",
      end_time: validRange ? d.end : "18:00",
      fixed_times: d.fixedTimes.filter(isTime),
    };
  });
  const breakRows = schedule.days.flatMap((d) =>
    d.breaks
      .filter((b) => isTime(b.start) && isTime(b.end) && b.start < b.end)
      .map((b) => ({ pro_id: userId, weekday: d.weekday, start_time: b.start, end_time: b.end })),
  );

  const [hours, pro, cleared] = await Promise.all([
    supabase.from("opening_hours").upsert(hoursRows, { onConflict: "pro_id,weekday" }),
    supabase.from("pros").update({ buffer_minutes: Number(schedule.buffer) }).eq("id", userId),
    supabase.from("opening_breaks").delete().eq("pro_id", userId),
  ]);
  if (hours.error || pro.error || cleared.error) return { schedule, error: SAVE_FAILED };

  if (breakRows.length) {
    const { error } = await supabase.from("opening_breaks").insert(breakRows);
    if (error) return { schedule, error: SAVE_FAILED };
  }

  revalidatePath("/espace/horaires");
  return { schedule, saved: true };
}
