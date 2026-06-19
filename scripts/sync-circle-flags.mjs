import { cpSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "node_modules", "circle-flags", "flags");
const dest = path.join(root, "public", "flags");

if (!existsSync(src)) {
  console.warn("[sync-circle-flags] circle-flags not installed, skipping");
  process.exit(0);
}

mkdirSync(dest, { recursive: true });

let count = 0;
for (const file of readdirSync(src)) {
  if (!file.endsWith(".svg")) continue;
  cpSync(path.join(src, file), path.join(dest, file), { force: true });
  count++;
}

console.log(`[sync-circle-flags] synced ${count} flags → public/flags/`);
