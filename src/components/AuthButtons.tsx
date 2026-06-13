"use client";

import { createSupabaseBrowser } from "@/lib/supabase/browser";

export function AuthButtons() {
  const supabase = createSupabaseBrowser();

  async function signIn(provider: "google" | "apple") {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
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
        Continuar com Google
      </button>
      <button
        onClick={() => signIn("apple")}
        className="flex w-full items-center justify-center gap-3 rounded-xl bg-zinc-800 px-4 py-3.5 text-base font-semibold text-white transition hover:bg-zinc-700"
      >
        <span>🍎</span>
        Continuar com Apple
      </button>
    </div>
  );
}
