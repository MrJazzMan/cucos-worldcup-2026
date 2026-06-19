import type { Match } from "@/types";
import { PORTUGAL_TEAM_ID } from "@/lib/world-cup";

function isPortugalMatch(match: Match): boolean {
  return (
    match.home_team_id === PORTUGAL_TEAM_ID ||
    match.away_team_id === PORTUGAL_TEAM_ID
  );
}

function isNotFinished(match: Match): boolean {
  return match.status !== "finished";
}

/** Escolhe o jogo em destaque para o dia visível. */
export function pickFeaturedMatch(matches: Match[]): Match | null {
  if (!matches.length) return null;

  const portugalOpen = matches.find(
    (m) => isPortugalMatch(m) && isNotFinished(m)
  );
  if (portugalOpen) return portugalOpen;

  const live = matches.find((m) => m.status === "live");
  if (live) return live;

  const upcoming = matches
    .filter((m) => m.status === "upcoming")
    .sort(
      (a, b) =>
        new Date(a.kickoff_utc).getTime() - new Date(b.kickoff_utc).getTime()
    );
  if (upcoming.length > 0) return upcoming[0];

  const finished = matches
    .filter((m) => m.status === "finished")
    .sort(
      (a, b) =>
        new Date(b.kickoff_utc).getTime() - new Date(a.kickoff_utc).getTime()
    );
  return finished[0] ?? null;
}
