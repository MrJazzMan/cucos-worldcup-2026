"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { useSettings } from "@/components/SettingsProvider";
import { teamLabel } from "@/components/Display";
import { fetchTeamsClient } from "@/lib/teams-client";
import type { TeamOption } from "@/types";

export function SettingsFavourites({ userId }: { userId: string }) {
  const { t, lang } = useSettings();
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const supabase = createSupabaseBrowser();

    async function load() {
      const [teamList, { data: favourites }] = await Promise.all([
        fetchTeamsClient(),
        supabase
          .from("favourite_teams")
          .select("team_id")
          .eq("user_id", userId),
      ]);

      if (cancelled) return;
      setTeams(teamList);
      setSelected(new Set((favourites ?? []).map((f) => f.team_id)));
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  async function toggleTeam(teamId: number) {
    const supabase = createSupabaseBrowser();
    const next = new Set(selected);
    if (next.has(teamId)) {
      next.delete(teamId);
      await supabase
        .from("favourite_teams")
        .delete()
        .eq("user_id", userId)
        .eq("team_id", teamId);
    } else {
      next.add(teamId);
      const team = teams.find((t) => t.team_id === teamId);
      if (team) {
        await supabase.from("favourite_teams").insert({
          user_id: userId,
          team_id: teamId,
          team_name: team.team_name,
        });
      }
    }
    setSelected(next);
  }

  if (loading) {
    return <p className="text-sm text-muted">{t("matches.loading")}</p>;
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">{t("account.favouritesHint")}</p>
      <div className="flex flex-wrap gap-2">
        {teams.map((team) => {
          const isSelected = selected.has(team.team_id);
          return (
            <button
              key={team.team_id}
              onClick={() => toggleTeam(team.team_id)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                isSelected
                  ? "bg-amber-500 text-zinc-900"
                  : "bg-surface-2 text-foreground hover:brightness-110"
              }`}
              type="button"
            >
              {isSelected && "★ "}
              {teamLabel(team.team_name, lang)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
