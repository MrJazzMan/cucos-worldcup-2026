import { createSupabaseBrowser } from "@/lib/supabase/browser";

export function getAuthCallbackUrl() {
  if (typeof window === "undefined") return "/auth/callback";
  const host = window.location.hostname;
  const isProdHost = host === "wc26.pt" || host.endsWith(".wc26.pt");
  const origin = isProdHost ? "https://wc26.pt" : window.location.origin;
  return `${origin}/auth/callback`;
}

export async function signInWithGoogle(next?: string) {
  const supabase = createSupabaseBrowser();
  const returnPath =
    next ??
    new URLSearchParams(window.location.search).get("next") ??
    window.location.pathname;
  const redirectTo = `${getAuthCallbackUrl()}?next=${encodeURIComponent(returnPath)}`;
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo },
  });
}
