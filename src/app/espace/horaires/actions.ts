"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { WEEK_DAYS, validateSchedule, type Schedule, type ScheduleErrors } from "@/lib/hours";
import { createClient } from "@/lib/supabase/server";

export type HoursState = {
  schedule?: Schedule;
  errors?: ScheduleErrors;
  error?: string;
  saved?: boolean;
};

function readSchedule(formData: FormData): Schedule {
  const text = (key: string) => String(formData.get(key) ?? "").trim();
  return {
    days: WEEK_DAYS.map(({ weekday }) => ({
      weekday,
      isOpen: formData.get(`open_${weekday}`) === "on",
      start: text(`start_${weekday}`),
      end: text(`end_${weekday}`),
    })),
    pauseStart: text("pause_start"),
    pauseEnd: text("pause_end"),
    buffer: text("buffer"),
  };
}

export async function saveHours(_prev: HoursState, formData: FormData): Promise<HoursState> {
  const schedule = readSchedule(formData);
  const errors = validateSchedule(schedule);
  if (errors) return { schedule, errors };

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) redirect("/connexion");

  const [hours, pro] = await Promise.all([
    supabase.from("opening_hours").upsert(
      schedule.days.map((d) => ({
        pro_id: userId,
        weekday: d.weekday,
        is_open: d.isOpen,
        start_time: d.start,
        end_time: d.end,
      })),
      { onConflict: "pro_id,weekday" },
    ),
    supabase
      .from("pros")
      .update({
        pause_start: schedule.pauseStart || null,
        pause_end: schedule.pauseEnd || null,
        buffer_minutes: Number(schedule.buffer),
      })
      .eq("id", userId),
  ]);

  if (hours.error || pro.error) {
    return { schedule, error: "L’enregistrement n’a pas marché. Réessaie dans un instant." };
  }

  revalidatePath("/espace/horaires");
  return { schedule, saved: true };
}
