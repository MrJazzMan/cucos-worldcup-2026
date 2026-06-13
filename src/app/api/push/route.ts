import webpush from "web-push";
import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServer } from "@/lib/supabase/server";
import type { NotificationType } from "@/types";

function setupVapid() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:admin@cucos.pt";

  if (!publicKey || !privateKey) return false;

  webpush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

interface NotificationWindow {
  type: NotificationType;
  prefKey: keyof NotificationPrefsRow;
  minutesBefore: number | null;
}

interface NotificationPrefsRow {
  before_24h: boolean;
  before_1h: boolean;
  before_15m: boolean;
  match_started: boolean;
  final_result: boolean;
}

const WINDOWS: NotificationWindow[] = [
  { type: "before_24h", prefKey: "before_24h", minutesBefore: 24 * 60 },
  { type: "before_1h", prefKey: "before_1h", minutesBefore: 60 },
  { type: "before_15m", prefKey: "before_15m", minutesBefore: 15 },
  { type: "match_started", prefKey: "match_started", minutesBefore: 0 },
  { type: "final_result", prefKey: "final_result", minutesBefore: null },
];

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET não configurado" },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  if (!setupVapid()) {
    return NextResponse.json({ ok: true, sent: 0, reason: "VAPID não configurado" });
  }

  const admin = createSupabaseAdmin();
  const now = Date.now();
  let sent = 0;

  const { data: users } = await admin
    .from("push_subscriptions")
    .select("user_id, endpoint, p256dh, auth");

  if (!users?.length) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  const userIds = [...new Set(users.map((u) => u.user_id))];

  for (const userId of userIds) {
    const { data: prefs } = await admin
      .from("notification_prefs")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!prefs) continue;

    const { data: favourites } = await admin
      .from("favourite_teams")
      .select("team_id")
      .eq("user_id", userId);

    const favIds = (favourites ?? []).map((f) => f.team_id);
    if (!favIds.length) continue;

    const { data: matches } = await admin
      .from("matches")
      .select("*")
      .or(
        `home_team_id.in.(${favIds.join(",")}),away_team_id.in.(${favIds.join(",")})`
      );

    const subs = users.filter((u) => u.user_id === userId);

    for (const match of matches ?? []) {
      const kickoff = new Date(match.kickoff_utc).getTime();
      const minutesUntil = (kickoff - now) / 60000;

      for (const window of WINDOWS) {
        if (!prefs[window.prefKey]) continue;

        let shouldSend = false;
        let title = "";
        let body = "";

        if (window.type === "final_result" && match.status === "finished") {
          shouldSend = true;
          title = "Resultado final";
          body = `${match.home_team_name} ${match.home_score}–${match.away_score} ${match.away_team_name}`;
        } else if (window.type === "match_started" && match.status === "live") {
          shouldSend = true;
          title = "Jogo começou!";
          body = `${match.home_team_name} vs ${match.away_team_name}`;
        } else if (
          window.minutesBefore != null &&
          match.status === "upcoming" &&
          minutesUntil <= window.minutesBefore &&
          minutesUntil > window.minutesBefore - 2
        ) {
          shouldSend = true;
          title =
            window.type === "before_24h"
              ? "Jogo amanhã"
              : window.type === "before_1h"
                ? "Jogo em 1 hora"
                : "Jogo em 15 minutos";
          body = `${match.home_team_name} vs ${match.away_team_name}`;
        }

        if (!shouldSend) continue;

        const { data: existing } = await admin
          .from("notification_log")
          .select("id")
          .eq("user_id", userId)
          .eq("fixture_id", match.fixture_id)
          .eq("notification_type", window.type)
          .maybeSingle();

        if (existing) continue;

        const payload = JSON.stringify({ title, body, data: { fixture_id: match.fixture_id } });

        for (const sub of subs) {
          try {
            await webpush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth },
              },
              payload
            );
            sent++;
          } catch {
            await admin
              .from("push_subscriptions")
              .delete()
              .eq("endpoint", sub.endpoint);
          }
        }

        await admin.from("notification_log").insert({
          user_id: userId,
          fixture_id: match.fixture_id,
          notification_type: window.type,
        });
      }
    }
  }

  return NextResponse.json({ ok: true, sent });
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServer();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase não configurado" }, { status: 500 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await request.json();
  const { endpoint, p256dh, auth } = body;

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
  }

  const admin = createSupabaseAdmin();
  const { error } = await admin.from("push_subscriptions").upsert(
    { user_id: user.id, endpoint, p256dh, auth },
    { onConflict: "user_id,endpoint" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
