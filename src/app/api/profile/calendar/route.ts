import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/site-url";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { noStoreJson, requireRouteUser } from "@/lib/supabase/route-auth";

export const dynamic = "force-dynamic";

function newCalendarToken(): string {
  return randomBytes(32).toString("hex");
}

function calendarUrls(token: string) {
  const origin = getSiteUrl();
  const httpsUrl = `${origin}/calendar/${token}.ics`;
  return {
    token,
    httpsUrl,
    webcalUrl: httpsUrl.replace(/^https?:/, "webcal:"),
    googleUrl: `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(httpsUrl)}`,
  };
}

function adminOr500() {
  try {
    return { admin: createSupabaseAdmin() };
  } catch (err) {
    console.error("[api/profile/calendar] admin não configurado", err);
    return {
      error: NextResponse.json({ error: "Servidor não configurado" }, { status: 500 }),
    };
  }
}

async function requireUser() {
  const auth = await requireRouteUser();
  if ("error" in auth) return { error: auth.error };
  return { user: auth.user };
}

async function saveCalendarToken(userId: string, email: string | undefined, token: string) {
  const adminResult = adminOr500();
  if ("error" in adminResult && adminResult.error) return { error: adminResult.error };
  const admin = adminResult.admin!;

  const { data: existing } = await admin
    .from("profiles")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  const { error } = existing
    ? await admin
        .from("profiles")
        .update({ calendar_token: token, updated_at: new Date().toISOString() })
        .eq("user_id", userId)
    : await admin.from("profiles").insert({
        user_id: userId,
        email: email ?? null,
        calendar_token: token,
      });

  if (error) {
    console.error("[api/profile/calendar save]", error.message);
    return { error: NextResponse.json({ error: error.message }, { status: 500 }) };
  }

  return { token };
}

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth && auth.error) return auth.error;
  const { user } = auth;

  const adminResult = adminOr500();
  if ("error" in adminResult && adminResult.error) return adminResult.error;
  const admin = adminResult.admin!;

  const { data, error: selectError } = await admin
    .from("profiles")
    .select("calendar_token")
    .eq("user_id", user!.id)
    .maybeSingle();

  if (selectError) {
    console.error("[api/profile/calendar GET]", selectError.message);
    return NextResponse.json({ error: selectError.message }, { status: 500 });
  }

  if (data?.calendar_token) {
    return noStoreJson(calendarUrls(data.calendar_token as string));
  }

  const fresh = newCalendarToken();
  const saved = await saveCalendarToken(user!.id, user!.email, fresh);
  if ("error" in saved && saved.error) return saved.error;

  return noStoreJson(calendarUrls(fresh));
}

export async function POST() {
  const auth = await requireUser();
  if ("error" in auth && auth.error) return auth.error;
  const { user } = auth;

  const fresh = newCalendarToken();
  const saved = await saveCalendarToken(user!.id, user!.email, fresh);
  if ("error" in saved && saved.error) return saved.error;

  return noStoreJson(calendarUrls(fresh));
}
