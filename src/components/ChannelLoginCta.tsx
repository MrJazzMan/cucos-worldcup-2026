"use client";

import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { useT } from "@/components/SettingsProvider";

export function ChannelLoginCta() {
  const t = useT();

  async function signIn() {
    const supabase = createSupabaseBrowser();
    const host = window.location.hostname;
    const isProdHost = host === "wc26.pt" || host.endsWith(".wc26.pt");
    const origin = isProdHost ? "https://wc26.pt" : window.location.origin;
    const next = `${window.location.pathname}${window.location.search}`;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
  }

  return (
    <div className="mt-3 flex justify-center">
      <button
        type="button"
        onClick={signIn}
        className="rounded-lg border border-border-base bg-surface-2 px-3 py-1.5 text-xs font-semibold text-muted transition hover:border-accent/40 hover:text-accent"
      >
        📺 {t("card.channelsSignIn")}
      </button>
    </div>
  );
}
