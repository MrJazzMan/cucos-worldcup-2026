import { isSiteAdmin } from "@/lib/admin";
import { deleteUserAccount } from "@/lib/delete-account";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { noStoreJson, requireRouteUser } from "@/lib/supabase/route-auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function DELETE(request: Request) {
  const auth = await requireRouteUser(request);
  if ("error" in auth) return auth.error;

  const { user } = auth;

  if (isSiteAdmin(user.id)) {
    return NextResponse.json(
      { error: "A conta de administrador do site não pode ser apagada por aqui." },
      { status: 403 }
    );
  }

  let admin;
  try {
    admin = createSupabaseAdmin();
  } catch (err) {
    console.error("[api/account DELETE] admin não configurado", err);
    return NextResponse.json({ error: "Servidor não configurado" }, { status: 500 });
  }

  const result = await deleteUserAccount(admin, user.id);
  if (!result.ok) {
    console.error("[api/account DELETE]", result.message);
    return NextResponse.json({ error: result.message }, { status: 500 });
  }

  return noStoreJson({ ok: true });
}
