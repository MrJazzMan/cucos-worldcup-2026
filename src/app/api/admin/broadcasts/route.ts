import { NextResponse } from "next/server";
import { isRelevantAdminBroadcastMatch } from "@/lib/admin-broadcasts";
import { requireAdminOrCron } from "@/lib/admin-auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const authError = await requireAdminOrCron(request);
  if (authError) return authError;

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

export async function GET(request: Request) {
  const authError = await requireAdminOrCron(request);
  if (authError) return authError;

  const admin = createSupabaseAdmin();
  const { data: matches } = await admin
    .from("matches")
    .select(
      "fixture_id, home_team_name, away_team_name, match_date, kickoff_utc, status, round"
    )
    .order("kickoff_utc", { ascending: true });

  const { data: broadcasts } = await admin.from("broadcasts").select("*");

  const broadcastMap = new Map(
    (broadcasts ?? []).map((b) => [b.fixture_id, b.channels])
  );

  const result = (matches ?? [])
    .filter((m) => isRelevantAdminBroadcastMatch(m))
    .map((m) => ({
      ...m,
      channels: broadcastMap.get(m.fixture_id) ?? [],
    }));

  return NextResponse.json(result);
}
