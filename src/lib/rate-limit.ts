import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Rate limiting por IP para as rotas públicas (anti-scraping em massa).
 *
 * Princípios:
 * - **No-op se não configurado** — sem `UPSTASH_REDIS_REST_*`, devolve sempre
 *   `allowed` (dev local e ambientes sem Redis continuam a funcionar).
 * - **Fail-open** — se o Upstash falhar/timeout, deixa passar; nunca bloqueia
 *   um utilizador real por um problema de infra.
 *
 * Limite configurável por env (`RATE_LIMIT_PER_MIN`, default 60/min).
 */

const PER_MIN = Number(process.env.RATE_LIMIT_PER_MIN ?? 60);

let limiter: Ratelimit | null = null;
let initialised = false;

function getLimiter(): Ratelimit | null {
  if (initialised) return limiter;
  initialised = true;

  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token || !Number.isFinite(PER_MIN) || PER_MIN <= 0) {
    return null; // não configurado → desativado
  }

  limiter = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(PER_MIN, "60 s"),
    prefix: "wc26:rl",
    analytics: false,
  });
  return limiter;
}

export type RateLimitResult = {
  allowed: boolean;
  /** Pedidos restantes na janela (apenas informativo). */
  remaining: number;
  /** Limite efetivo por minuto. */
  limit: number;
};

/** Devolve `null` quando o rate limiting está desativado (não configurado). */
export async function checkRateLimit(
  identifier: string
): Promise<RateLimitResult | null> {
  const rl = getLimiter();
  if (!rl) return null;

  try {
    const { success, remaining } = await rl.limit(identifier);
    return { allowed: success, remaining, limit: PER_MIN };
  } catch {
    // Upstash indisponível → fail-open.
    return null;
  }
}
