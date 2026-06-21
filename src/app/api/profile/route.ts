import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { noStoreJson, requireRouteUser } from "@/lib/supabase/route-auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const MAX_DISPLAY_NAME = 80;
const MAX_LOCATION = 120;

function adminOr500() {
  try {
    return { admin: createSupabaseAdmin() };
  } catch (err) {
    console.error("[api/profile] admin não configurado", err);
    return {
      error: NextResponse.json({ error: "Servidor não configurado" }, { status: 500 }),
    };
  }
}

export async function GET() {
  const auth = await requireRouteUser();
  if ("error" in auth) return auth.error;
  const { user } = auth;

  const adminResult = adminOr500();
  if ("error" in adminResult && adminResult.error) return adminResult.error;

  const { data, error } = await adminResult.admin!
    .from("profiles")
    .select("display_name, location")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[api/profile GET]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const fallbackName =
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email?.split("@")[0] ??
    "";

  return noStoreJson({
    display_name: data?.display_name?.trim() || fallbackName,
    location: data?.location ?? "",
  });
}

export async function PATCH(request: Request) {
  const auth = await requireRouteUser();
  if ("error" in auth) return auth.error;
  const { user } = auth;

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

  if (display_name && display_name.length > MAX_DISPLAY_NAME) {
    return NextResponse.json(
      { error: `Nome demasiado longo (máx. ${MAX_DISPLAY_NAME} caracteres).` },
      { status: 400 }
    );
  }
  if (location && location.length > MAX_LOCATION) {
    return NextResponse.json(
      { error: `Localização demasiado longa (máx. ${MAX_LOCATION} caracteres).` },
      { status: 400 }
    );
  }

  const adminResult = adminOr500();
  if ("error" in adminResult && adminResult.error) return adminResult.error;
  const admin = adminResult.admin!;

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

  return noStoreJson({ ok: true, display_name: display_name ?? "", location: location ?? "" });
}
