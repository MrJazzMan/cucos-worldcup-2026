"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { useSettings } from "@/components/SettingsProvider";

function newCalendarToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function SettingsCalendarFeed({ userId }: { userId: string }) {
  const { t } = useSettings();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const ensureToken = useCallback(async () => {
    const supabase = createSupabaseBrowser();
    const { data, error: selectError } = await supabase
      .from("profiles")
      .select("calendar_token")
      .eq("user_id", userId)
      .maybeSingle();

    if (selectError) throw selectError;
    if (data?.calendar_token) return data.calendar_token as string;

    const fresh = newCalendarToken();
    const { error } = await supabase.from("profiles").upsert(
      {
        user_id: userId,
        calendar_token: fresh,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
    if (error) throw error;
    return fresh;
  }, [userId]);

  useEffect(() => {
    let cancelled = false;
    ensureToken()
      .then((value) => {
        if (!cancelled) setToken(value);
      })
      .catch(() => {
        if (!cancelled) setToken(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ensureToken]);

  const urls = useMemo(() => {
    if (!token || typeof window === "undefined") return null;
    const origin = window.location.origin;
    const httpsUrl = `${origin}/calendar/${token}.ics`;
    const webcalUrl = httpsUrl.replace(/^https?:/, "webcal:");
    const googleUrl = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(httpsUrl)}`;
    return { httpsUrl, webcalUrl, googleUrl };
  }, [token]);

  async function copyLink() {
    if (!urls) return;
    await navigator.clipboard.writeText(urls.httpsUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  async function regenerateToken() {
    if (!window.confirm(t("calendar.regenerateConfirm"))) return;
    setRegenerating(true);
    try {
      const supabase = createSupabaseBrowser();
      const fresh = newCalendarToken();
      const { error } = await supabase
        .from("profiles")
        .update({ calendar_token: fresh })
        .eq("user_id", userId);
      if (error) throw error;
      setToken(fresh);
    } finally {
      setRegenerating(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted">{t("matches.loading")}</p>;
  }

  if (!token || !urls) {
    return (
      <p className="text-sm text-red-500">{t("calendar.error")}</p>
    );
  }

  return (
    <div className="space-y-3 rounded-2xl border border-border-base bg-surface-2/60 p-4">
      <div>
        <p className="text-sm font-semibold text-foreground">
          {t("calendar.title")}
        </p>
        <p className="mt-1 text-sm text-muted">{t("calendar.hint")}</p>
      </div>

      <input
        readOnly
        value={urls.httpsUrl}
        className="w-full rounded-xl border border-border-base bg-surface px-3 py-2 text-xs text-muted"
        aria-label={t("calendar.urlLabel")}
        onFocus={(e) => e.target.select()}
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copyLink}
          className="rounded-xl border border-border-base bg-surface px-3 py-2 text-sm font-semibold text-foreground transition hover:brightness-105"
        >
          {copied ? t("calendar.copied") : t("calendar.copy")}
        </button>
        <a
          href={urls.webcalUrl}
          className="rounded-xl bg-accent px-3 py-2 text-sm font-semibold text-white transition hover:brightness-110"
        >
          {t("calendar.subscribeApple")}
        </a>
        <a
          href={urls.googleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl border border-border-base bg-surface px-3 py-2 text-sm font-semibold text-foreground transition hover:brightness-105"
        >
          {t("calendar.subscribeGoogle")}
        </a>
      </div>

      <p className="text-[11px] leading-snug text-muted">{t("calendar.secretHint")}</p>

      <button
        type="button"
        onClick={regenerateToken}
        disabled={regenerating}
        className="text-xs font-medium text-muted underline-offset-2 hover:text-foreground hover:underline disabled:opacity-50"
      >
        {regenerating ? t("calendar.regenerating") : t("calendar.regenerate")}
      </button>
    </div>
  );
}
