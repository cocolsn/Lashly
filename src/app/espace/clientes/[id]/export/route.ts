import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Droit d'accès (RGPD) : toutes les données d'une cliente dans un fichier à lui transmettre.
export async function GET(_request: NextRequest, { params }: RouteContext<"/espace/clientes/[id]/export">) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: client } = await supabase
    .from("clients")
    .select(
      "full_name, phone, email, consent_at, created_at, client_records(*), bookings(starts_at, ends_at, service_name, addon_name, price_cents, status, booking_photos(kind, created_at))",
    )
    .eq("id", id)
    .maybeSingle();

  if (!client) return new NextResponse("Cliente introuvable.", { status: 404 });

  const fileName = `donnees-${client.full_name.normalize("NFD").replace(/[^\w]+/g, "-").toLowerCase()}.json`;
  return new NextResponse(JSON.stringify({ exporte_le: new Date().toISOString(), cliente: client }, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
