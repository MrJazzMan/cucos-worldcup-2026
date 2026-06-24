import { fileURLToPath, pathToFileURL } from "node:url";
import { existsSync } from "node:fs";
import path from "node:path";

const SRC = fileURLToPath(new URL("../../src/", import.meta.url));

function resolveAlias(spec) {
  // "@/lib/foo" -> absolute path under src/, trying .ts then /index.ts
  const rel = spec.slice(2); // drop "@/"
  const base = path.join(SRC, rel);
  const candidates = [base + ".ts", path.join(base, "index.ts"), base];
  for (const c of candidates) if (existsSync(c)) return pathToFileURL(c).href;
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const url = resolveAlias(specifier);
    if (url) return { url, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}
