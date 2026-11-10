import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Lien reçu par email après l'inscription : on ouvre la session puis on va dans l'espace pro.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL("/espace", request.url));
  }

  return NextResponse.redirect(new URL("/connexion", request.url));
}
