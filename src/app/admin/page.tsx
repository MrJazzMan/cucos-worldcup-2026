"use client";

import { useEffect, useState } from "react";
import { CHANNEL_LINKS, PT_CHANNELS } from "@/lib/channels";

interface AdminMatch {
  fixture_id: number;
  home_team_name: string;
  away_team_name: string;
  match_date: string;
  channels: string[];
}

export default function AdminPage() {
  const [matches, setMatches] = useState<AdminMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/admin/broadcasts")
      .then((r) => r.json())
      .then((data) => {
        setMatches(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function saveBroadcast(fixtureId: number, channels: string[]) {
    setSaving(fixtureId);
    await fetch("/api/admin/broadcasts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fixture_id: fixtureId, channels }),
    });
    setSaving(null);
  }

  function toggleChannel(fixtureId: number, channel: string, current: string[]) {
    const next = current.includes(channel)
      ? current.filter((c) => c !== channel)
      : [...current, channel];
    setMatches((prev) =>
      prev.map((m) =>
        m.fixture_id === fixtureId ? { ...m, channels: next } : m
      )
    );
    saveBroadcast(fixtureId, next);
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-zinc-900" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Admin — Canais TV</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Curadoria manual de transmissões em Portugal
        </p>
      </div>

      {matches.length === 0 ? (
        <p className="text-zinc-500">
          Sem jogos na base de dados. Executa /api/sync primeiro.
        </p>
      ) : (
        <div className="space-y-4">
          {matches.map((match) => (
            <div
              key={match.fixture_id}
              className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4"
            >
              <p className="font-semibold text-white">
                {match.home_team_name} vs {match.away_team_name}
              </p>
              <p className="text-xs text-zinc-500">
                {match.match_date} · ID {match.fixture_id}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {PT_CHANNELS.map((ch) => {
                  const active = match.channels.includes(ch);
                  const link = CHANNEL_LINKS[ch];
                  return (
                    <button
                      key={ch}
                      onClick={() =>
                        toggleChannel(match.fixture_id, ch, match.channels)
                      }
                      disabled={saving === match.fixture_id}
                      title={link ?? undefined}
                      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                        active
                          ? "bg-blue-600 text-white"
                          : "bg-zinc-800 text-zinc-400 hover:text-white"
                      }`}
                    >
                      {ch}
                      {link && (
                        <span className="ml-1 text-xs opacity-70">▶</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
