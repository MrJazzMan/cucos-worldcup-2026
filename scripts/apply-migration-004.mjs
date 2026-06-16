/**
 * Aplica migration 004 e mostra profiles com email.
 * Uso: node scripts/apply-migration-004.mjs
 * Requer POSTGRES_URL_NON_POOLING em .env.vercel (vercel env pull)
 */
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv(path) {
  try {
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) process.env[m[1].trim()] = m[2].trim().replace(/^"|"$/g, "");
    }
  } catch {
    /* optional */
  }
}

loadEnv(join(__dirname, "../.env.vercel"));

const url =
  process.env.POSTGRES_URL_NON_POOLING ?? process.env.POSTGRES_URL;
if (!url) {
  console.error("Missing POSTGRES_URL — run: npx vercel env pull .env.vercel --environment=production");
  process.exit(1);
}

const sql = readFileSync(
  join(__dirname, "../supabase/migrations/004_profile_email_location.sql"),
  "utf8"
);

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });

await client.connect();
try {
  await client.query(sql);
  const { rows } = await client.query(`
    SELECT display_name, email, location, signup_country, preferred_lang
    FROM profiles
    ORDER BY created_at
  `);
  console.log("Migration applied. Profiles:\n");
  console.table(rows);
} finally {
  await client.end();
}
