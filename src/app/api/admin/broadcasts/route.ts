import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { fixture_id, channels, notes } = body;

  if (!fixture_id || !Array.isArray(channels)) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }

  const admin = createSupabaseAdmin();
  const { error } = await admin.from("broadcasts").upsert({
    fixture_id,
    channels,
    notes: notes ?? null,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const admin = createSupabaseAdmin();
  const { data: matches } = await admin
    .from("matches")
    .select("fixture_id, home_team_name, away_team_name, match_date, kickoff_utc")
    .order("kickoff_utc", { ascending: true });

  const { data: broadcasts } = await admin.from("broadcasts").select("*");

  const broadcastMap = new Map(
    (broadcasts ?? []).map((b) => [b.fixture_id, b.channels])
  );

  const result = (matches ?? []).map((m) => ({
    ...m,
    channels: broadcastMap.get(m.fixture_id) ?? [],
  }));

  return NextResponse.json(result);
}
