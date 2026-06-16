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

async function backfillEmailsFromAuth() {
  const admin = createSupabaseAdmin();
  const { data, error } = await admin.auth.admin.listUsers();
  if (error) throw error;

  const results: { name: string; email: string | undefined }[] = [];

  for (const user of data.users) {
    const email = user.email;
    const name =
      user.user_metadata?.full_name ??
      user.user_metadata?.name ??
      email ??
      user.id;

    const { error: updateError } = await admin
      .from("profiles")
      .update({ email })
      .eq("user_id", user.id);

    if (updateError) throw updateError;
    results.push({ name, email });
  }

  return results;
}

/** Aplica migration 004 (se possível) e copia email de auth.users → profiles. */
export async function POST(request: Request) {
  const authError = ensureCronAccess(request);
  if (authError) return authError;

  const admin = createSupabaseAdmin();
  const { error: probeError } = await admin
    .from("profiles")
    .select("email")
    .limit(1);

  if (probeError?.message.includes("email")) {
    const dbUrl =
      process.env.POSTGRES_URL_NON_POOLING ?? process.env.POSTGRES_URL;

    if (!dbUrl) {
      return NextResponse.json(
        {
          error: "Coluna email ainda não existe. Corre a migration no Supabase SQL Editor.",
          sql_file: "supabase/migrations/004_profile_email_location.sql",
        },
        { status: 409 }
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
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      return NextResponse.json({ error: message }, { status: 500 });
    } finally {
      await client.end();
    }
  }

  try {
    const synced = await backfillEmailsFromAuth();
    const { data: profiles } = await admin
      .from("profiles")
      .select("display_name, email, location, signup_country, preferred_lang")
      .order("created_at");

    return NextResponse.json({ ok: true, synced, profiles });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Lista perfis; inclui emails de auth.users para referência. */
export async function GET(request: Request) {
  const authError = ensureCronAccess(request);
  if (authError) return authError;

  const admin = createSupabaseAdmin();
  const { data: profiles, error } = await admin
    .from("profiles")
    .select("display_name, email, location, signup_country, preferred_lang, created_at")
    .order("created_at");

  const { data: authData } = await admin.auth.admin.listUsers();
  const users = (authData?.users ?? []).map((u) => ({
    name: u.user_metadata?.full_name ?? u.user_metadata?.name,
    email: u.email,
  }));

  if (error?.message.includes("email")) {
    return NextResponse.json({
      profiles,
      users,
      hint: "Coluna email em falta — corre migration 004 no Supabase SQL Editor.",
    });
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profiles, users });
}
