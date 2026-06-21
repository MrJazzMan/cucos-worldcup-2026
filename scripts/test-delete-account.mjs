/**
 * Testa eliminação de conta: cria utilizador temporário, semeia dados,
 * chama DELETE /api/account (Bearer) e confirma que não ficam órfãos.
 *
 * Uso:
 *   npm run dev   # noutro terminal
 *   node scripts/test-delete-account.mjs
 *
 * Variáveis: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_ANON_KEY ou
 * NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY,
 * opcional SITE_URL (default http://localhost:3000)
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
const siteUrl = (env("SITE_URL", "NEXT_PUBLIC_SITE_URL") ?? "http://localhost:3000").replace(
  /\/$/,
  ""
);

if (!url || !anonKey || !serviceKey) {
  console.error("Faltam variáveis Supabase (URL, anon, service role).");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const testEmail = `delete-test-${Date.now()}@example.com`;
const testPassword = `DelTest!${Date.now()}Aa1`;
let userId = null;

async function countUserRows(table) {
  const { count, error } = await admin
    .from(table)
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);
  if (error) throw new Error(`${table}: ${error.message}`);
  return count ?? 0;
}

async function verifyNoOrphans() {
  const tables = [
    "profiles",
    "favourite_teams",
    "notification_prefs",
    "push_subscriptions",
    "notification_log",
  ];
  for (const table of tables) {
    const n = await countUserRows(table);
    if (n > 0) throw new Error(`Órfãos em ${table}: ${n} linha(s)`);
  }
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (!error && data?.user) {
    throw new Error("auth.users ainda existe");
  }
}

try {
  console.log("A criar utilizador de teste…");
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true,
    user_metadata: { full_name: "Delete Test User" },
  });
  if (createErr || !created.user) {
    throw new Error(createErr?.message ?? "createUser falhou");
  }
  userId = created.user.id;
  console.log(`✓ Utilizador ${userId}`);

  await new Promise((r) => setTimeout(r, 600));

  await admin.from("favourite_teams").insert({
    user_id: userId,
    team_id: 27,
    team_name: "Portugal",
  });
  console.log("✓ Dados de teste (favourite_teams)");

  const client = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: signIn, error: signInErr } = await client.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });
  if (signInErr || !signIn.session) {
    throw new Error(signInErr?.message ?? "signIn sem sessão");
  }
  console.log("✓ Sessão autenticada");

  const apiRes = await fetch(`${siteUrl}/api/account`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${signIn.session.access_token}`,
    },
  });

  if (!apiRes.ok) {
    const body = await apiRes.text();
    throw new Error(`API DELETE falhou (${apiRes.status}): ${body}`);
  }
  console.log(`✓ DELETE /api/account → ${apiRes.status}`);

  await verifyNoOrphans();
  console.log("✓ Sem órfãos (CASCADE + auth.users)");

  userId = null;
  console.log("\nRESULTADO: PASSOU");
  process.exit(0);
} catch (err) {
  console.error("\n✗ FALHOU:", err.message ?? err);
  process.exitCode = 1;
} finally {
  if (userId) {
    await admin.auth.admin.deleteUser(userId).catch(() => {});
    console.log("Cleanup: utilizador de teste removido.");
  }
  process.exit(process.exitCode ?? 1);
}
