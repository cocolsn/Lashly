"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function cancelBooking(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims.sub) redirect("/connexion");

  // RLS : la pro ne peut modifier que ses propres rendez-vous.
  const { data: updated, error } = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", id)
    .eq("status", "confirmed")
    .select("id");

  if (error || !updated?.length) return { error: "L’annulation n’a pas marché. Recharge la page et réessaie." };
  revalidatePath("/espace/agenda");
  return {};
}
