/**
 * Investiga um utilizador suspeito: quem é, quando entrou, que páginas visitou
 * e o que activou (favoritos, push). Ajuda a decidir se é humano ou bot.
 *
 * Uso (a partir da raiz do projeto):
 *   node scripts/inspect-user.mjs botebotas23@gmail.com
 *   node scripts/inspect-user.mjs --id <user_uuid>
 *
 * Variáveis necessárias (em .env.production.local ou .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   (lê auth.users e ignora RLS — só leitura)
 *
 * Apenas LÊ dados. Nunca altera nem apaga nada.
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
    /* opcional */
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
const serviceKey = env("SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY");

if (!url || !serviceKey) {
  console.error(
    "✗ Faltam NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_SERVICE_ROLE_KEY.\n" +
      "  Cola a service-role key (Supabase → Settings → API) em .env.production.local."
  );
  process.exit(1);
}

// ---- argumentos ----
const args = process.argv.slice(2);
let byId = null;
let email = null;
if (args[0] === "--id") byId = args[1];
else email = args[0];

if (!email && !byId) {
  console.error("Uso: node scripts/inspect-user.mjs <email> | --id <uuid>");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ---- helpers ----
const fmt = (d) => (d ? new Date(d).toISOString().replace("T", " ").slice(0, 19) : "—");

async function findUserByEmail(target) {
  const wanted = target.toLowerCase();
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const hit = data.users.find((u) => (u.email ?? "").toLowerCase() === wanted);
    if (hit) return hit;
    if (data.users.length < 1000) break; // última página
  }
  return null;
}

async function safeSelect(table, builder) {
  try {
    const { data, error } = await builder;
    if (error) {
      console.log(`  (aviso: ${table}: ${error.message})`);
      return [];
    }
    return data ?? [];
  } catch (e) {
    console.log(`  (aviso: ${table}: ${e.message})`);
    return [];
  }
}

// ---- heurística humano vs bot ----
function assess({ user, visits }) {
  const signals = [];
  let botScore = 0;

  if (visits.length === 0) {
    signals.push("• 0 páginas registadas — entrou mas não navegou (ou só usou a API).");
    botScore += 1;
  }

  // Cadência: muitos pedidos em pouco tempo = automatizado.
  if (visits.length >= 5) {
    const times = visits.map((v) => new Date(v.created_at).getTime()).sort((a, b) => a - b);
    const gaps = times.slice(1).map((t, i) => (t - times[i]) / 1000);
    const fast = gaps.filter((g) => g < 1).length;
    const ratio = fast / gaps.length;
    if (ratio > 0.6) {
      signals.push(
        `• ${Math.round(ratio * 100)}% das visitas a <1s de intervalo — cadência de máquina.`
      );
      botScore += 2;
    } else {
      signals.push("• Intervalos entre páginas compatíveis com navegação humana.");
    }
  }

  const sessions = new Set(visits.map((v) => v.session_id).filter(Boolean));
  if (sessions.size > 0) signals.push(`• ${sessions.size} sessão(ões) distinta(s).`);

  // Sinais humanos: activou funcionalidades.
  if (assess.activated) {
    signals.push("• Activou favoritos/notificações — comportamento tipicamente humano.");
    botScore -= 1;
  }

  // Login OAuth Google = email verificado por uma pessoa.
  const provider = user.app_metadata?.provider ?? "—";
  signals.push(`• Login via "${provider}" (email verificado pelo fornecedor).`);

  const verdict =
    botScore >= 3 ? "PROVÁVEL BOT/automatizado" : botScore <= 0 ? "PROVÁVEL HUMANO" : "INCONCLUSIVO";
  return { signals, verdict, botScore };
}

// ---- main ----
(async () => {
  const user = byId
    ? (await admin.auth.admin.getUserById(byId)).data.user
    : await findUserByEmail(email);

  if (!user) {
    console.log(`\n✗ Nenhum utilizador com ${byId ? `id ${byId}` : `email ${email}`}.`);
    console.log("  (Pode ter sido apagado, ou o email está escrito de forma diferente.)\n");
    process.exit(0);
  }

  console.log("\n══════════════════════════════════════════════");
  console.log("  IDENTIDADE");
  console.log("══════════════════════════════════════════════");
  console.log(`  user_id     : ${user.id}`);
  console.log(`  email       : ${user.email}  ${user.email_confirmed_at ? "(confirmado)" : "(NÃO confirmado)"}`);
  console.log(`  nome Google : ${user.user_metadata?.full_name ?? user.user_metadata?.name ?? "—"}`);
  console.log(`  provider    : ${user.app_metadata?.provider ?? "—"}`);
  console.log(`  registo     : ${fmt(user.created_at)}`);
  console.log(`  último login: ${fmt(user.last_sign_in_at)}`);

  const [profile] = await safeSelect(
    "profiles",
    admin.from("profiles").select("display_name, last_seen_at, created_at").eq("user_id", user.id)
  );
  if (profile) {
    console.log(`  display_name: ${profile.display_name ?? "—"}`);
    console.log(`  last_seen_at: ${fmt(profile.last_seen_at)}`);
  }

  const visits = await safeSelect(
    "page_visits",
    admin
      .from("page_visits")
      .select("page, session_id, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(500)
  );

  const favourites = await safeSelect(
    "favourite_teams",
    admin.from("favourite_teams").select("team_name, created_at").eq("user_id", user.id)
  );
  const pushSubs = await safeSelect(
    "push_subscriptions",
    admin.from("push_subscriptions").select("endpoint").eq("user_id", user.id)
  );
  assess.activated = favourites.length > 0 || pushSubs.length > 0;

  console.log("\n══════════════════════════════════════════════");
  console.log(`  ACTIVIDADE — ${visits.length} página(s) registada(s)`);
  console.log("══════════════════════════════════════════════");
  const byPage = {};
  for (const v of visits) byPage[v.page] = (byPage[v.page] ?? 0) + 1;
  for (const [page, n] of Object.entries(byPage).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(n).padStart(4)} × ${page}`);
  }
  if (visits.length) {
    console.log(`\n  primeira: ${fmt(visits[visits.length - 1].created_at)}`);
    console.log(`  última  : ${fmt(visits[0].created_at)}`);
    console.log("\n  últimas 10 visitas:");
    for (const v of visits.slice(0, 10)) console.log(`    ${fmt(v.created_at)}  ${v.page}`);
  }

  console.log("\n══════════════════════════════════════════════");
  console.log("  O QUE ACTIVOU");
  console.log("══════════════════════════════════════════════");
  console.log(`  favoritos   : ${favourites.length ? favourites.map((f) => f.team_name).join(", ") : "—"}`);
  console.log(`  push subs   : ${pushSubs.length}`);

  const { signals, verdict, botScore } = assess({ user, visits });
  console.log("\n══════════════════════════════════════════════");
  console.log(`  AVALIAÇÃO: ${verdict}  (score ${botScore})`);
  console.log("══════════════════════════════════════════════");
  for (const s of signals) console.log(`  ${s}`);
  console.log(
    "\n  Nota: o IP não é guardado na BD. Para o IP, ver os logs da Vercel\n" +
      "  (Observability → Logs) à volta dos timestamps acima.\n"
  );
})().catch((e) => {
  console.error("\n✗ Erro:", e.message);
  process.exit(1);
});
