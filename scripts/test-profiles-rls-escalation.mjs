/**
 * Prova reproduzível: utilizador autenticado normal NÃO consegue escalar
 * privilégios alterando profiles.role para 'admin' via chave anónima.
 *
 * Uso (a partir da raiz do projeto):
 *   node scripts/test-profiles-rls-escalation.mjs
 *
 * Variáveis necessárias (em .env.production.local ou .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Cria um utilizador temporário, executa o teste e remove-o no fim.
 * Nunca toca em utilizadores reais.
 */
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv(path) {
  try {
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (!m) continue;
      const value = m[2].trim().replace(/^"|"$/g, "");
      if (value) process.env[m[1].trim()] = value;
    }
  } catch {
    /* optional */
  }
}

function env(...keys) {
  for (const key of keys) {
    const value = process.env[key];
    if (value) return value;
  }
  return undefined;
}

const root = join(__dirname, "..");
for (const file of [".env.production.local", ".env.local", ".env.vercel"]) {
  loadEnv(join(root, file));
}

const url = env("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL");
const anonKey = env(
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
);
const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY");

if (!url || !anonKey || !serviceKey) {
  console.error("Faltam variáveis Supabase.");
  if (!url) console.error("  — URL: NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_URL");
  if (!anonKey) {
    console.error(
      "  — Chave anónima: NEXT_PUBLIC_SUPABASE_ANON_KEY ou SUPABASE_ANON_KEY"
    );
  }
  if (!serviceKey) {
    console.error(
      "  — Service role: SUPABASE_SERVICE_ROLE_KEY (Supabase → Project Settings → API)"
    );
  }
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const testEmail = `rls-test-${Date.now()}@cucos-wc26-test.invalid`;
const testPassword = `TmpRls!${Date.now()}Aa1`;

let userId = null;
let passed = true;

function fail(msg) {
  console.error(`✗ FALHOU: ${msg}`);
  passed = false;
}

function ok(msg) {
  console.log(`✓ ${msg}`);
}

async function cleanup() {
  if (!userId) return;
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    console.warn(`Aviso: não foi possível apagar utilizador de teste ${userId}:`, error.message);
  } else {
    console.log(`Utilizador de teste ${userId} removido.`);
  }
}

try {
  console.log("A criar utilizador de teste temporário…");
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true,
    user_metadata: { full_name: "RLS Test User" },
  });
  if (createErr || !created.user) {
    throw new Error(createErr?.message ?? "createUser sem utilizador");
  }
  userId = created.user.id;
  ok(`Utilizador criado: ${userId}`);

  // Garantir perfil (trigger on_auth_user_created)
  await new Promise((r) => setTimeout(r, 500));

  const client = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error: signInErr } = await client.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });
  if (signInErr) {
    throw new Error(`Sign-in falhou: ${signInErr.message}`);
  }
  ok("Sessão autenticada com chave anónima");

  const { data: before, error: beforeErr } = await client
    .from("profiles")
    .select("role")
    .eq("user_id", userId)
    .single();

  if (beforeErr || !before) {
    fail(`Perfil não legível: ${beforeErr?.message ?? "sem dados"}`);
  } else {
    ok(`Role inicial: ${before.role ?? "(null)"}`);
  }

  console.log("A tentar UPDATE profiles SET role = 'admin'…");
  const { data: updated, error: updateErr } = await client
    .from("profiles")
    .update({ role: "admin" })
    .eq("user_id", userId)
    .select("role");

  if (updateErr) {
    ok(`UPDATE recusado pela API/RLS: ${updateErr.message}`);
  } else if (!updated || updated.length === 0) {
    ok("UPDATE não devolveu linhas (sem efeito visível ao cliente)");
  } else {
    console.log("UPDATE aparentemente aceite; a verificar persistência…");
  }

  const { data: after } = await client
    .from("profiles")
    .select("role")
    .eq("user_id", userId)
    .single();

  if (after?.role === "admin") {
    fail(`Role escalou para 'admin' — vulnerabilidade ainda presente`);
  } else {
    ok(`Role após tentativa: ${after?.role ?? "(null)"} (não escalou)`);
  }

  // Verificação via service role (estado real na BD)
  const { data: dbRow } = await admin
    .from("profiles")
    .select("role")
    .eq("user_id", userId)
    .single();

  if (dbRow?.role === "admin") {
    fail("Role na base de dados é 'admin' após tentativa de escalonamento");
  } else {
    ok(`Role na BD (service role): ${dbRow?.role ?? "(null)"}`);
  }

  // Tentativa extra: calendar_token (também protegido)
  const { error: tokenErr } = await client
    .from("profiles")
    .update({ calendar_token: "fake-token-escalation-test" })
    .eq("user_id", userId);

  const { data: tokenRow } = await admin
    .from("profiles")
    .select("calendar_token")
    .eq("user_id", userId)
    .single();

  if (tokenRow?.calendar_token === "fake-token-escalation-test") {
    fail("calendar_token foi alterado por utilizador normal");
  } else if (tokenErr) {
    ok(`UPDATE calendar_token recusado: ${tokenErr.message}`);
  } else {
    ok("calendar_token não foi alterado (trigger/coluna protegida)");
  }

  console.log("");
  if (passed) {
    console.log("RESULTADO: PASSOU — escalonamento de role bloqueado.");
    process.exitCode = 0;
  } else {
    console.log("RESULTADO: FALHOU — rever políticas RLS e migration 015.");
    process.exitCode = 1;
  }
} catch (err) {
  console.error("Erro durante o teste:", err.message ?? err);
  process.exitCode = 1;
} finally {
  await cleanup();
  process.exit(process.exitCode ?? 1);
}
