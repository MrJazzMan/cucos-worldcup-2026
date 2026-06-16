"use client";

import { useEffect } from "react";
import { useSettings } from "@/components/SettingsProvider";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import type { Lang } from "@/lib/i18n";

async function detectCountry(): Promise<string | null> {
  try {
    const res = await fetch("https://ipapi.co/json/", {
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { country_name?: string; city?: string };
    if (data.city && data.country_name) {
      return `${data.city}, ${data.country_name}`;
    }
    return data.country_name ?? null;
  } catch {
    return null;
  }
}

export function ProfileSync() {
  const { lang, mounted } = useSettings();

  useEffect(() => {
    if (!mounted) return;

    const supabase = createSupabaseBrowser();

    async function syncProfile(userId: string, email: string | undefined) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("signup_country, location")
        .eq("user_id", userId)
        .single();

      const updates: {
        email?: string;
        preferred_lang: Lang;
        signup_country?: string;
        location?: string;
        last_seen_at: string;
      } = {
        email: email ?? undefined,
        preferred_lang: lang,
        last_seen_at: new Date().toISOString(),
      };

      if (!profile?.signup_country) {
        const detected = await detectCountry();
        if (detected) {
          updates.signup_country = detected;
          if (!profile?.location?.trim()) {
            updates.location = detected;
          }
        }
      }

      await supabase.from("profiles").update(updates).eq("user_id", userId);
    }

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) syncProfile(data.user.id, data.user.email);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        syncProfile(session.user.id, session.user.email);
      }
    });

    return () => subscription.unsubscribe();
  }, [mounted, lang]);

  return null;
}
