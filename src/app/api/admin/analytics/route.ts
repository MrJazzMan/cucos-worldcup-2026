import { NextResponse } from "next/server";
import { getTodayStartLisbonIso, type AdminAnalyticsData } from "@/lib/admin-analytics";
import { requireAdminOrCron } from "@/lib/admin-auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { noStoreJson } from "@/lib/supabase/route-auth";

export async function GET(request: Request) {
  const authError = await requireAdminOrCron(request);
  if (authError) return authError;

  try {
    const admin = createSupabaseAdmin();
    const todayStart = getTodayStartLisbonIso();

    const { data, error } = await admin.rpc("get_admin_analytics", {
      today_start: todayStart,
    });

    if (error) {
      console.error("[admin/analytics]", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return noStoreJson(data as AdminAnalyticsData);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    console.error("[admin/analytics]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
