import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";
import pg from "pg";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

function ensureCronAccess(request: Request) {
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

  return null;
}

/** Aplica migration 004 (se necessário) e copia email de auth.users → profiles. */
export async function POST(request: Request) {
  const authError = ensureCronAccess(request);
  if (authError) return authError;

  const dbUrl =
    process.env.POSTGRES_URL_NON_POOLING ?? process.env.POSTGRES_URL;
  if (!dbUrl) {
    return NextResponse.json(
      { error: "POSTGRES_URL não configurado" },
      { status: 500 }
    );
  }

  const sql = readFileSync(
    join(process.cwd(), "supabase/migrations/004_profile_email_location.sql"),
    "utf8"
  );

  const client = new pg.Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    await client.query(sql);

    const { rows } = await client.query<{
      display_name: string | null;
      email: string | null;
      location: string | null;
      signup_country: string | null;
    }>(`
      SELECT display_name, email, location, signup_country
      FROM profiles
      ORDER BY created_at
    `);

    return NextResponse.json({ ok: true, profiles: rows });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  } finally {
    await client.end();
  }
}

/** Lista perfis com email (após migration). */
export async function GET(request: Request) {
  const authError = ensureCronAccess(request);
  if (authError) return authError;

  const admin = createSupabaseAdmin();
  const { data: profiles, error } = await admin
    .from("profiles")
    .select("display_name, email, location, signup_country, preferred_lang, created_at")
    .order("created_at");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: authData } = await admin.auth.admin.listUsers();
  const authEmails = Object.fromEntries(
    (authData?.users ?? []).map((u) => [
      u.id,
      { email: u.email, name: u.user_metadata?.full_name ?? u.user_metadata?.name },
    ])
  );

  return NextResponse.json({ profiles, auth: authEmails });
}
