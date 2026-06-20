"use client";

import { useEffect, useState } from "react";
import { useSettingsMenu } from "@/components/SettingsMenuContext";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

export function AuthStatus() {
  const { setOpen } = useSettingsMenu();
  const [email, setEmail] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowser();

    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      setEmail(user?.email ?? null);

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("user_id", user.id)
          .single();
        setDisplayName(profile?.display_name ?? null);
      } else {
        setDisplayName(null);
      }
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
      if (!session?.user) {
        setDisplayName(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!email) return null;

  const label = displayName?.trim() || email.split("@")[0];
  const initial = label[0]?.toUpperCase() ?? "?";

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      title={email}
      className="flex items-center gap-1.5 rounded-full border border-border-base bg-surface-2 px-2 py-1 transition hover:brightness-110"
    >
      <span className="grid h-6 w-6 place-items-center rounded-full bg-accent text-xs font-bold text-white">
        {initial}
      </span>
      <span className="hidden max-w-[7rem] truncate text-xs font-medium text-foreground sm:block">
        {label}
      </span>
    </button>
  );
}
