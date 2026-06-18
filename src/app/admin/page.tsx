"use client";

import { useEffect, useState } from "react";
import { CHANNEL_LINKS, CHANNEL_REGIONS, channelsOutsidePresets } from "@/lib/channels";
import { ptTeam } from "@/lib/team-names";

interface AdminMatch {
  fixture_id: number;
  home_team_name: string;
  away_team_name: string;
  match_date: string;
  channels: string[];
}

const SECRET_STORAGE_KEY = "cucos-admin-secret";

export default function AdminPage() {
  const [matches, setMatches] = useState<AdminMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [secret, setSecret] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSecret(localStorage.getItem(SECRET_STORAGE_KEY) ?? "");
  }, []);

  useEffect(() => {
    if (!secret) {
      setLoading(false);
      setMatches([]);
      return;
    }

    setLoading(true);
    fetch("/api/admin/broadcasts", {
      headers: {
        Authorization: `Bearer ${secret}`,
      },
    })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setMatches(data);
          setError(null);
        } else {
          setMatches([]);
          if (data?.error) setError(data.error);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [secret]);

  async function saveBroadcast(fixtureId: number, channels: string[]) {
    setSaving(fixtureId);
    setError(null);
    try {
      const res = await fetch("/api/admin/broadcasts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(secret ? { Authorization: `Bearer ${secret}` } : {}),
        },
        body: JSON.stringify({ fixture_id: fixtureId, channels }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(
          res.status === 401
            ? "Password incorrecta — grava de novo depois de corrigir."
            : data.error ?? "Erro ao gravar."
        );
      }
    } catch {
      setError("Erro de rede ao gravar.");
    } finally {
      setSaving(null);
    }
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
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-surface" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin — Canais TV</h1>
        <p className="mt-1 text-sm text-muted">
          Canais OndeBola (ex. Sport.Tv1) vêm do sync automático. Acrescenta outros
          por região — ficam guardados mesmo após o próximo sync.
        </p>
      </div>

      <div className="rounded-2xl border border-border-base bg-surface p-4">
        <label className="text-sm font-medium text-foreground">
          Password de admin (CRON_SECRET)
        </label>
        <input
          type="password"
          value={secret}
          onChange={(e) => {
            setSecret(e.target.value);
            localStorage.setItem(SECRET_STORAGE_KEY, e.target.value);
          }}
          placeholder="Necessária para gravar"
          className="mt-2 w-full rounded-lg border border-border-base bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-muted"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-600/20 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      {matches.length === 0 ? (
        <p className="text-muted">
          {secret
            ? "Sem jogos na base de dados. Executa /api/sync primeiro."
            : "Introduz a password de admin para carregar os jogos."}
        </p>
      ) : (
        <div className="space-y-4">
          {matches.map((match) => {
            const syncedChannels = channelsOutsidePresets(match.channels);

            return (
            <div
              key={match.fixture_id}
              className="rounded-2xl border border-border-base bg-surface p-4"
            >
              <p className="font-semibold text-foreground">
                {ptTeam(match.home_team_name)} vs {ptTeam(match.away_team_name)}
              </p>
              <p className="text-xs text-muted">
                {match.match_date} · ID {match.fixture_id}
              </p>

              {syncedChannels.length > 0 && (
                <div className="mt-3">
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted">
                    OndeBola / sync
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {syncedChannels.map((ch) => (
                      <button
                        key={ch}
                        type="button"
                        onClick={() =>
                          toggleChannel(match.fixture_id, ch, match.channels)
                        }
                        disabled={saving === match.fixture_id}
                        className="rounded-lg bg-accent/15 px-3 py-1.5 text-sm font-medium text-accent ring-1 ring-accent/30 transition hover:bg-accent/25"
                      >
                        {ch} ×
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {CHANNEL_REGIONS.map((region) => (
                <div key={region.id} className="mt-3">
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted">
                    {region.label}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {region.channels.map((ch) => {
                      const active = match.channels.includes(ch);
                      const link = CHANNEL_LINKS[ch];
                      return (
                        <button
                          key={ch}
                          type="button"
                          onClick={() =>
                            toggleChannel(match.fixture_id, ch, match.channels)
                          }
                          disabled={saving === match.fixture_id}
                          title={link ?? undefined}
                          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                            active
                              ? "bg-accent text-white"
                              : "bg-surface-2 text-muted hover:text-foreground"
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
            );
          })}
        </div>
      )}
    </div>
  );
}
