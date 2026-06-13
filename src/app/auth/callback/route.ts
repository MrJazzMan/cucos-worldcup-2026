import { createSupabaseServer } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.redirect(`${new URL(request.url).origin}/conta`);
  }

  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/conta";

  if (code) {
    const supabase = await createSupabaseServer();
    if (!supabase) {
      return NextResponse.redirect(`${origin}/conta?error=auth`);
    }
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/conta?error=auth`);
}
