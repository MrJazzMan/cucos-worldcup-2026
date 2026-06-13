import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options: CookieOptions };

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const origin = request.nextUrl.origin;
  const code = searchParams.get("code");
  const oauthError = searchParams.get("error");
  const oauthErrorCode = searchParams.get("error_code");
  const oauthErrorDesc = searchParams.get("error_description");
  let next = searchParams.get("next") ?? "/conta";
  if (!next.startsWith("/")) next = "/conta";

  if (oauthError) {
    const params = new URLSearchParams({ error: oauthError });
    if (oauthErrorCode) params.set("error_code", oauthErrorCode);
    if (oauthErrorDesc) params.set("error_description", oauthErrorDesc);
    return NextResponse.redirect(`${origin}/conta?${params}`);
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !code) {
    return NextResponse.redirect(`${origin}/conta?error=auth`);
  }

  const redirectUrl = `${origin}${next}`;
  const response = NextResponse.redirect(redirectUrl);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL.trim(),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback]", error.message);
    const params = new URLSearchParams({
      error: "auth",
      error_code: error.message,
    });
    return NextResponse.redirect(`${origin}/conta?${params}`);
  }

  return response;
}
