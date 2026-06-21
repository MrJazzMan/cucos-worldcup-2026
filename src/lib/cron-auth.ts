import { timingSafeEqual } from "crypto";

function readBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length);
}

/** Comparação em tempo constante — evita timing attacks no CRON_SECRET. */
export function verifyCronAuth(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;

  const token = readBearerToken(request);
  if (!token) return false;

  const a = Buffer.from(token, "utf8");
  const b = Buffer.from(cronSecret, "utf8");
  if (a.length !== b.length) return false;

  return timingSafeEqual(a, b);
}
