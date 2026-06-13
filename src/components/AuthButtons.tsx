"use client";

import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { useT } from "@/components/SettingsProvider";

export function AuthButtons() {
  const t = useT();

  async function signIn(provider: "google" | "apple") {
    const supabase = createSupabaseBrowser();
    const redirectTo = `${window.location.origin}/auth/callback?next=/conta`;
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
      <button
        onClick={() => signIn("apple")}
        className="flex w-full items-center justify-center gap-3 rounded-xl bg-zinc-900 px-4 py-3.5 text-base font-semibold text-white transition hover:bg-zinc-800"
      >
        <span>🍎</span>
        {t("auth.apple")}
      </button>
    </div>
  );
}
