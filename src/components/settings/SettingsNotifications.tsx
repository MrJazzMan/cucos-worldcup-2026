"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { useSettings } from "@/components/SettingsProvider";
import type { NotificationPrefs } from "@/types";

const NOTIF_LABELS: { key: keyof NotificationPrefs; i18nKey: string }[] = [
  { key: "before_24h", i18nKey: "account.notif.before24h" },
  { key: "before_1h", i18nKey: "account.notif.before1h" },
  { key: "before_15m", i18nKey: "account.notif.before15m" },
  { key: "match_started", i18nKey: "account.notif.started" },
  { key: "final_result", i18nKey: "account.notif.final" },
];

const DEFAULT_PREFS: NotificationPrefs = {
  user_id: "",
  before_24h: true,
  before_1h: true,
  before_15m: true,
  match_started: true,
  final_result: true,
};

export function SettingsNotifications({ userId }: { userId: string }) {
  const { t } = useSettings();
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [pushStatus, setPushStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createSupabaseBrowser();
    supabase
      .from("notification_prefs")
      .select("*")
      .eq("user_id", userId)
      .single()
      .then(({ data }) => {
        if (data) setNotifPrefs(data as NotificationPrefs);
        setLoading(false);
      });
  }, [userId]);

  async function togglePref(key: keyof NotificationPrefs) {
    const supabase = createSupabaseBrowser();
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(updated);
    await supabase
      .from("notification_prefs")
      .update({ [key]: updated[key] })
      .eq("user_id", userId);
  }

  async function enablePush() {
    setSaving(true);
    setPushStatus(null);

    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setPushStatus(t("account.pushUnsupported"));
      setSaving(false);
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setPushStatus(t("account.pushDenied"));
      setSaving(false);
      return;
    }

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      setPushStatus(t("account.pushNoVapid"));
      setSaving(false);
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });

    const json = subscription.toJSON();
    await fetch("/api/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        endpoint: json.endpoint,
        p256dh: json.keys?.p256dh,
        auth: json.keys?.auth,
      }),
    });

    setPushStatus(t("account.pushEnabled"));
    setSaving(false);
  }

  if (loading) {
    return <p className="text-sm text-muted">{t("matches.loading")}</p>;
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {NOTIF_LABELS.map(({ key, i18nKey }) => (
          <label
            key={key}
            className="flex items-center justify-between rounded-xl border border-border-base bg-surface-2 px-3 py-2.5"
          >
            <span className="text-sm text-foreground">{t(i18nKey)}</span>
            <input
              type="checkbox"
              checked={notifPrefs[key] as boolean}
              onChange={() => togglePref(key)}
              className="h-5 w-5 rounded accent-amber-500"
            />
          </label>
        ))}
      </div>
      <button
        onClick={enablePush}
        disabled={saving}
        className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
        type="button"
      >
        {saving ? t("account.enabling") : t("account.enablePush")}
      </button>
      {pushStatus && <p className="text-sm text-muted">{pushStatus}</p>}
    </div>
  );
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
