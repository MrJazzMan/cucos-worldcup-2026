"use client";

import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { useT } from "@/components/SettingsProvider";

export function AuthButtons({ next: nextProp }: { next?: string }) {
  const t = useT();

  function getAuthCallbackUrl() {
    const host = window.location.hostname;
    const isProdHost = host === "wc26.pt" || host.endsWith(".wc26.pt");
    const origin = isProdHost ? "https://wc26.pt" : window.location.origin;
    return `${origin}/auth/callback`;
  }

  async function signIn(provider: "google" | "apple") {
    const supabase = createSupabaseBrowser();
    const next =
      nextProp ??
      new URLSearchParams(window.location.search).get("next") ??
      window.location.pathname;
    const redirectTo = `${getAuthCallbackUrl()}?next=${encodeURIComponent(next)}`;
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
      },
    });
  }

  return (
    <div className="space-y-3">
      <button
        onClick={() => signIn("google")}
        className="flex w-full items-center justify-center gap-3 rounded-xl bg-white px-4 py-3.5 text-base font-semibold text-zinc-900 transition hover:bg-zinc-100"
      >
        <span>G</span>
        {t("auth.google")}
      </button>
    </div>
  );
}
