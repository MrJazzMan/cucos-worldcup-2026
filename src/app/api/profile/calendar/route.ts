import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/site-url";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServer } from "@/lib/supabase/server";

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

async function requireUser() {
  const supabase = await createSupabaseServer();
  if (!supabase) return { error: NextResponse.json({ error: "Supabase não configurado" }, { status: 500 }) };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Não autorizado" }, { status: 401 }) };
  }

  return { user };
}

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth && auth.error) return auth.error;
  const { user } = auth;

  const admin = createSupabaseAdmin();
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
    return NextResponse.json(calendarUrls(data.calendar_token as string));
  }

  const fresh = newCalendarToken();
  const { error: insertError } = await admin.from("profiles").upsert(
    {
      user_id: user!.id,
      calendar_token: fresh,
      email: user!.email ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (insertError) {
    console.error("[api/profile/calendar GET create]", insertError.message);
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json(calendarUrls(fresh));
}

export async function POST() {
  const auth = await requireUser();
  if ("error" in auth && auth.error) return auth.error;
  const { user } = auth;

  const fresh = newCalendarToken();
  const admin = createSupabaseAdmin();

  const { data: existing } = await admin
    .from("profiles")
    .select("user_id")
    .eq("user_id", user!.id)
    .maybeSingle();

  const { error } = existing
    ? await admin
        .from("profiles")
        .update({ calendar_token: fresh, updated_at: new Date().toISOString() })
        .eq("user_id", user!.id)
    : await admin.from("profiles").insert({
        user_id: user!.id,
        email: user!.email ?? null,
        calendar_token: fresh,
      });

  if (error) {
    console.error("[api/profile/calendar POST]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(calendarUrls(fresh));
}
