/** Cabeçalhos de segurança HTTP (CSP, HSTS, etc.). */

function supabaseConnectOrigins(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!url) return "";
  try {
    const host = new URL(url).host;
    return `https://${host} wss://${host}`;
  } catch {
    return "";
  }
}

/** CSP permissiva o suficiente para Next.js, Supabase, GA, AdSense e Vercel. */
export function contentSecurityPolicy(): string {
  const supabase = supabaseConnectOrigins();
  const connectSrc = [
    "'self'",
    supabase,
    "https://www.google-analytics.com",
    "https://region1.google-analytics.com",
    "https://pagead2.googlesyndication.com",
    "https://googleads.g.doubleclick.net",
    "https://ipapi.co",
    "https://vitals.vercel-insights.com",
    "https://va.vercel-scripts.com",
  ]
    .filter(Boolean)
    .join(" ");

  return [
    "default-src 'self'",
    // Next.js + tema inline + GA/AdSense/Vercel (consentimento de cookies)
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://pagead2.googlesyndication.com https://va.vercel-scripts.com https://vercel.live",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src ${connectSrc}`,
    "frame-src https://googleads.g.doubleclick.net https://tpc.googlesyndication.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

export function applySecurityHeaders(res: Response, isProduction: boolean): void {
  const headers = res.headers;
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  headers.set("Content-Security-Policy", contentSecurityPolicy());
  if (isProduction) {
    headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }
}
