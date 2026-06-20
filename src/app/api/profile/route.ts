import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServer } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase não configurado" }, { status: 500 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("display_name, location")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    display_name: data?.display_name ?? "",
    location: data?.location ?? "",
  });
}

export async function PATCH(request: Request) {
  const supabase = await createSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase não configurado" }, { status: 500 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  let body: { display_name?: string; location?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const display_name =
    typeof body.display_name === "string" ? body.display_name.trim() || null : null;
  const location =
    typeof body.location === "string" ? body.location.trim() || null : null;

  const admin = createSupabaseAdmin();

  const { data: existing } = await admin
    .from("profiles")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const row = {
    display_name,
    location,
    updated_at: new Date().toISOString(),
  };

  const { error } = existing
    ? await admin.from("profiles").update(row).eq("user_id", user.id)
    : await admin.from("profiles").insert({
        user_id: user.id,
        email: user.email ?? null,
        ...row,
      });

  if (error) {
    console.error("[api/profile PATCH]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, display_name: display_name ?? "", location: location ?? "" });
}
