import { NextResponse } from "next/server";
import { isSiteAdmin } from "@/lib/admin";
import { verifyCronAuth } from "@/lib/cron-auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { requireRouteUser } from "@/lib/supabase/route-auth";

async function backfillEmailsFromAuth(): Promise<number> {
  const admin = createSupabaseAdmin();
  const { data, error } = await admin.auth.admin.listUsers();
  if (error) throw error;

  let synced = 0;
  for (const user of data.users) {
    const { error: updateError } = await admin
      .from("profiles")
      .update({ email: user.email })
      .eq("user_id", user.id);

    if (updateError) throw updateError;
    synced++;
  }

  return synced;
}

/** Só o admin autenticado (sessão Google) — não expor emails via CRON_SECRET. */
export async function GET() {
  const auth = await requireRouteUser();
  if ("error" in auth) return auth.error;

  if (!isSiteAdmin(auth.user.id)) {
    return NextResponse.json({ error: "Proibido" }, { status: 403 });
  }

  const admin = createSupabaseAdmin();
  const { count, error } = await admin
    .from("profiles")
    .select("user_id", { count: "exact", head: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, profile_count: count ?? 0 });
}

/** Backfill email auth.users → profiles. Cron ou admin; resposta sem PII. */
export async function POST(request: Request) {
  const fromCron = verifyCronAuth(request);

  if (!fromCron) {
    const auth = await requireRouteUser();
    if ("error" in auth) return auth.error;
    if (!isSiteAdmin(auth.user.id)) {
      return NextResponse.json({ error: "Proibido" }, { status: 403 });
    }
  }

  try {
    const synced = await backfillEmailsFromAuth();
    return NextResponse.json({ ok: true, synced });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
