"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TeamFlag } from "@/components/TeamFlag";
import { teamLabel } from "@/components/Display";
import { useSettings } from "@/components/SettingsProvider";
import type { TeamOption } from "@/types";

type TeamSearchProps = {
  teams: TeamOption[];
  selectedTeamId: number | null;
  onSelectTeam: (teamId: number | null) => void;
};

export function TeamSearch({
  teams,
  selectedTeamId,
  onSelectTeam,
}: TeamSearchProps) {
  const { t, lang } = useSettings();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedTeam = useMemo(
    () => teams.find((team) => team.team_id === selectedTeamId) ?? null,
    [teams, selectedTeamId]
  );

  useEffect(() => {
    if (selectedTeam) {
      setQuery(teamLabel(selectedTeam.team_name, lang));
    } else {
      setQuery("");
    }
  }, [selectedTeam, lang]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return teams.slice(0, 12);
    return teams
      .filter((team) => {
        const label = teamLabel(team.team_name, lang).toLowerCase();
        return (
          label.includes(q) || team.team_name.toLowerCase().includes(q)
        );
      })
      .slice(0, 12);
  }, [teams, query, lang]);

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function pickTeam(team: TeamOption) {
    onSelectTeam(team.team_id);
    setQuery(teamLabel(team.team_name, lang));
    setOpen(false);
  }

  function clear() {
    onSelectTeam(null);
    setQuery("");
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="flex items-center gap-2 rounded-2xl border border-border-base bg-surface px-3 py-2">
        <span className="text-muted" aria-hidden>
          ⌕
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (selectedTeamId) onSelectTeam(null);
          }}
          onFocus={() => setOpen(true)}
          placeholder={t("search.teamPlaceholder")}
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
          aria-label={t("search.teamLabel")}
          aria-expanded={open}
          aria-controls="team-search-listbox"
          role="combobox"
          autoComplete="off"
        />
        {selectedTeamId && (
          <button
            type="button"
            onClick={clear}
            className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-muted hover:bg-surface-2 hover:text-foreground"
            aria-label={t("search.clear")}
          >
            ✕
          </button>
        )}
      </div>

      {open && filtered.length > 0 && (
        <ul
          id="team-search-listbox"
          role="listbox"
          className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-border-base bg-surface py-1 shadow-lg"
        >
          {filtered.map((team) => (
            <li key={team.team_id} role="option">
              <button
                type="button"
                onClick={() => pickTeam(team)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-2"
              >
                <TeamFlag
                  name={team.team_name}
                  teamId={team.team_id}
                  size={18}
                />
                <span className="truncate font-medium">
                  {teamLabel(team.team_name, lang)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {selectedTeam && (
        <p className="mt-1.5 text-xs text-muted">
          {t("search.showingTeam")}
        </p>
      )}
    </div>
  );
}

export function useTeamSearchParam() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const teamParam = searchParams.get("team");
  const selectedTeamId = teamParam ? Number(teamParam) : null;
  const validTeamId =
    selectedTeamId !== null && !Number.isNaN(selectedTeamId)
      ? selectedTeamId
      : null;

  const setTeamId = (teamId: number | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (teamId) params.set("team", String(teamId));
    else params.delete("team");
    const qs = params.toString();
    router.replace(qs ? `/?${qs}` : "/", { scroll: false });
  };

  return { selectedTeamId: validTeamId, setTeamId };
}
