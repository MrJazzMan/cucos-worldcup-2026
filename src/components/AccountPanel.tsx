"use client";

import { useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import type { NotificationPrefs, TeamOption } from "@/types";

interface AccountPanelProps {
  user: { id: string; email?: string };
  favourites: { team_id: number; team_name: string }[];
  prefs: NotificationPrefs;
  teams: TeamOption[];
}

const NOTIF_LABELS: { key: keyof NotificationPrefs; label: string }[] = [
  { key: "before_24h", label: "24 horas antes" },
  { key: "before_1h", label: "1 hora antes" },
  { key: "before_15m", label: "15 minutos antes" },
  { key: "match_started", label: "Jogo começou" },
  { key: "final_result", label: "Resultado final" },
];

export function AccountPanel({
  user,
  favourites,
  prefs,
  teams,
}: AccountPanelProps) {
  const supabase = createSupabaseBrowser();
  const [selected, setSelected] = useState<Set<number>>(
    new Set(favourites.map((f) => f.team_id))
  );
  const [notifPrefs, setNotifPrefs] = useState(prefs);
  const [pushStatus, setPushStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function toggleTeam(teamId: number) {
    const next = new Set(selected);
    if (next.has(teamId)) {
      next.delete(teamId);
      await supabase
        .from("favourite_teams")
        .delete()
        .eq("user_id", user.id)
        .eq("team_id", teamId);
    } else {
      next.add(teamId);
      const team = teams.find((t) => t.team_id === teamId);
      if (team) {
        await supabase.from("favourite_teams").insert({
          user_id: user.id,
          team_id: teamId,
          team_name: team.team_name,
        });
      }
    }
    setSelected(next);
  }

  async function togglePref(key: keyof NotificationPrefs) {
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(updated);
    await supabase
      .from("notification_prefs")
      .update({ [key]: updated[key] })
      .eq("user_id", user.id);
  }

  async function enablePush() {
    setSaving(true);
    setPushStatus(null);

    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setPushStatus("Notificações não suportadas neste browser.");
      setSaving(false);
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setPushStatus("Permissão de notificações recusada.");
      setSaving(false);
      return;
    }

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      setPushStatus("VAPID não configurado no servidor.");
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
        user_id: user.id,
        endpoint: json.endpoint,
        p256dh: json.keys?.p256dh,
        auth: json.keys?.auth,
      }),
    });

    setPushStatus("Notificações activadas!");
    setSaving(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.reload();
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-1 text-xl font-bold text-white">A tua conta</h2>
        <p className="text-sm text-zinc-400">{user.email}</p>
        <button
          onClick={signOut}
          className="mt-3 text-sm text-zinc-500 underline hover:text-white"
        >
          Terminar sessão
        </button>
      </section>

      <section>
        <h3 className="mb-3 text-lg font-semibold text-white">Equipas favoritas</h3>
        <p className="mb-4 text-sm text-zinc-400">
          Destacadas na homepage e usadas para notificações.
        </p>
        <div className="flex flex-wrap gap-2">
          {teams.map((team) => {
            const isSelected = selected.has(team.team_id);
            return (
              <button
                key={team.team_id}
                onClick={() => toggleTeam(team.team_id)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  isSelected
                    ? "bg-amber-500 text-zinc-900"
                    : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                }`}
              >
                {isSelected && "★ "}
                {team.team_name}
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-lg font-semibold text-white">Notificações</h3>
        <div className="space-y-2">
          {NOTIF_LABELS.map(({ key, label }) => (
            <label
              key={key}
              className="flex items-center justify-between rounded-xl bg-zinc-900 px-4 py-3"
            >
              <span className="text-sm text-zinc-200">{label}</span>
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
          className="mt-4 w-full rounded-xl bg-emerald-600 px-4 py-3 text-base font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
        >
          {saving ? "A activar…" : "Activar notificações push"}
        </button>
        {pushStatus && (
          <p className="mt-2 text-sm text-zinc-400">{pushStatus}</p>
        )}
      </section>
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
