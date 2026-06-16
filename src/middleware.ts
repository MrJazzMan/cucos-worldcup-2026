import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

// User-agents de scrapers / AI crawlers conhecidos
const BLOCKED_UA_PATTERNS = [
  /GPTBot/i,
  /ChatGPT-User/i,
  /Claude-Web/i,
  /ClaudeBot/i,
  /anthropic-ai/i,
  /Google-Extended/i,
  /CCBot/i,
  /Diffbot/i,
  /Bytespider/i,
  /PetalBot/i,
  /PerplexityBot/i,
  /YouBot/i,
  /cohere-ai/i,
  /Amazonbot/i,
  /DataForSeoBot/i,
  /scrapy/i,
  /python-requests/i,
  /Go-http-client/i,
  /curl\//i,
  /wget\//i,
];

function isBlockedBot(ua: string | null): boolean {
  if (!ua) return false;
  return BLOCKED_UA_PATTERNS.some((p) => p.test(ua));
}

type CookieToSet = { name: string; value: string; options: CookieOptions };

function getRequestOrigin(request: NextRequest) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const isLocalEnv = process.env.NODE_ENV === "development";

  if (!isLocalEnv && forwardedHost) {
    return `${forwardedProto ?? "https"}://${forwardedHost}`;
  }

  return request.nextUrl.origin;
}

function createSupabaseMiddleware(
  request: NextRequest,
  getResponse: () => NextResponse
) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          const response = getResponse();
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );
}

function addSecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  return res;
}

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const origin = getRequestOrigin(request);
  const ua = request.headers.get("user-agent");

  // Bloquear scrapers e bots de IA conhecidos.
  // Rotas /api/ são isentas: têm a sua própria auth (CRON_SECRET) e são
  // chamadas por clientes legítimos não-browser (cron do GitHub Actions via curl).
  if (!pathname.startsWith("/api/") && isBlockedBot(ua)) {
    return new NextResponse("Access denied", { status: 403 });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return addSecurityHeaders(NextResponse.next({ request }));
  }

  const code = searchParams.get("code");
  const oauthError = searchParams.get("error");

  // OAuth code deve ir para /auth/callback (às vezes cai na homepage)
  if (code && pathname !== "/auth/callback") {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/callback";
    return NextResponse.redirect(url);
  }

  // Erros OAuth do Supabase às vezes caem na homepage — mantém na mesma página
  if (oauthError && pathname === "/") {
    const url = request.nextUrl.clone();
    url.searchParams.set("error", oauthError);
    const desc = searchParams.get("error_description");
    if (desc) url.searchParams.set("error_description", desc);
    return NextResponse.redirect(url);
  }

  // Troca PKCE no middleware — cookies do pedido ficam disponíveis aqui
  if (pathname === "/auth/callback" && code) {
    let next = searchParams.get("next") ?? "/";
    if (!next.startsWith("/")) next = "/";

    const redirectUrl = new URL(next, origin);

    const redirectResponse = NextResponse.redirect(redirectUrl);
    const supabase = createSupabaseMiddleware(request, () => redirectResponse);
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[auth/callback]", error.message);
      const errorUrl = new URL("/", origin);
      errorUrl.searchParams.set("error", "auth");
      errorUrl.searchParams.set("error_code", error.message);
      const errorResponse = NextResponse.redirect(errorUrl);
      redirectResponse.cookies.getAll().forEach((cookie) => {
        errorResponse.cookies.set(cookie.name, cookie.value);
      });
      return errorResponse;
    }

    return redirectResponse;
  }

  if (pathname === "/auth/callback") {
    return NextResponse.redirect(new URL("/?error=auth", request.url));
  }

  const response = NextResponse.next({ request });
  const supabase = createSupabaseMiddleware(request, () => response);
  await supabase.auth.getUser();

  return addSecurityHeaders(response);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.json|icon-.*\\.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
