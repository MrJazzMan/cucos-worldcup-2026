"use client";

import { useCallback, useEffect, useState } from "react";
import { useSettings } from "@/components/SettingsProvider";

interface CalendarUrls {
  token: string;
  httpsUrl: string;
  webcalUrl: string;
  googleUrl: string;
}

export function SettingsCalendarFeed({ userId }: { userId: string }) {
  const { t } = useSettings();
  const [urls, setUrls] = useState<CalendarUrls | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const loadCalendar = useCallback(async () => {
    const res = await fetch("/api/profile/calendar");
    if (!res.ok) throw new Error(await res.text());
    return (await res.json()) as CalendarUrls;
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadCalendar()
      .then((data) => {
        if (!cancelled) setUrls(data);
      })
      .catch(() => {
        if (!cancelled) setUrls(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId, loadCalendar]);

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
      const res = await fetch("/api/profile/calendar", { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      setUrls((await res.json()) as CalendarUrls);
    } catch {
      window.alert(t("calendar.error"));
    } finally {
      setRegenerating(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted">{t("matches.loading")}</p>;
  }

  if (!urls) {
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
