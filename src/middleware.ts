import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

type CookieToSet = { name: string; value: string; options: CookieOptions };

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

export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.next({ request });
  }

  const code = searchParams.get("code");
  const oauthError = searchParams.get("error");

  // OAuth code deve ir para /auth/callback (às vezes cai na homepage)
  if (code && pathname !== "/auth/callback") {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/callback";
    return NextResponse.redirect(url);
  }

  // Erros OAuth do Supabase às vezes caem na homepage
  if (oauthError && pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/conta";
    return NextResponse.redirect(url);
  }

  // Troca PKCE no middleware — cookies do pedido ficam disponíveis aqui
  if (pathname === "/auth/callback" && code) {
    let next = searchParams.get("next") ?? "/conta";
    if (!next.startsWith("/")) next = "/conta";

    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = next;
    redirectUrl.searchParams.delete("code");
    redirectUrl.searchParams.delete("next");

    const redirectResponse = NextResponse.redirect(redirectUrl);
    const supabase = createSupabaseMiddleware(request, () => redirectResponse);
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("[auth/callback]", error.message);
      const errorUrl = request.nextUrl.clone();
      errorUrl.pathname = "/conta";
      errorUrl.search = "";
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
    return NextResponse.redirect(new URL("/conta?error=auth", request.url));
  }

  const response = NextResponse.next({ request });
  const supabase = createSupabaseMiddleware(request, () => response);
  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.json|icon-.*\\.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
