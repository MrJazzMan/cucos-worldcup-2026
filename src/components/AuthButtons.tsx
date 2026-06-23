"use client";

import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { getAuthCallbackUrl, signInWithGoogle } from "@/lib/google-sign-in";
import { useT } from "@/components/SettingsProvider";

export function AuthButtons({ next: nextProp }: { next?: string }) {
  const t = useT();

  async function signIn(provider: "google" | "apple") {
    if (provider === "google") {
      await signInWithGoogle(nextProp);
      return;
    }
    const supabase = createSupabaseBrowser();
    const next =
      nextProp ??
      new URLSearchParams(window.location.search).get("next") ??
      window.location.pathname;
    const redirectTo = `${getAuthCallbackUrl()}?next=${encodeURIComponent(next)}`;
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
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
