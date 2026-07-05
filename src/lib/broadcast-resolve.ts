import { normalizeBroadcastChannels } from "@/lib/channels";
import { isFeederPlaceholderName } from "@/lib/feeder-teams";
import { equipasCoincidem } from "@/lib/ondebola";
import { ptTeam } from "@/lib/team-names";
import { TIMEZONE } from "@/lib/timezone";
import type { Match } from "@/types";
import { formatInTimeZone } from "date-fns-tz";

export type MatchBroadcastMeta = Pick<
  Match,
  "fixture_id" | "kickoff_utc" | "home_team_name" | "away_team_name"
>;

function hasResolvableTeams(match: MatchBroadcastMeta): boolean {
  return (
    !isFeederPlaceholderName(match.home_team_name) &&
    !isFeederPlaceholderName(match.away_team_name)
  );
}

/** Mesmo jogo (equipas + dia + hora próxima), como no sync OndeBola. */
export function teamsKickoffMatch(
  a: MatchBroadcastMeta,
  b: MatchBroadcastMeta,
  maxDiffMs = 180 * 60 * 1000
): boolean {
  if (!hasResolvableTeams(a) || !hasResolvableTeams(b)) return false;

  const dayA = formatInTimeZone(new Date(a.kickoff_utc), TIMEZONE, "yyyy-MM-dd");
  const dayB = formatInTimeZone(new Date(b.kickoff_utc), TIMEZONE, "yyyy-MM-dd");
  if (dayA !== dayB) return false;

  const home = ptTeam(a.home_team_name);
  const away = ptTeam(a.away_team_name);
  const homeB = ptTeam(b.home_team_name);
  const awayB = ptTeam(b.away_team_name);

  const direct =
    equipasCoincidem(home, homeB) && equipasCoincidem(away, awayB);
  const swapped =
    equipasCoincidem(home, awayB) && equipasCoincidem(away, homeB);
  if (!direct && !swapped) return false;

  const diff = Math.abs(
    new Date(a.kickoff_utc).getTime() - new Date(b.kickoff_utc).getTime()
  );
  return diff <= maxDiffMs;
}

export function findBestMatchForTeams(
  target: MatchBroadcastMeta,
  candidates: MatchBroadcastMeta[],
  maxDiffMs = 180 * 60 * 1000
): MatchBroadcastMeta | null {
  let best: { diff: number; match: MatchBroadcastMeta } | null = null;

  for (const candidate of candidates) {
    if (!teamsKickoffMatch(target, candidate, maxDiffMs)) continue;

    const diff = Math.abs(
      new Date(target.kickoff_utc).getTime() -
        new Date(candidate.kickoff_utc).getTime()
    );
    if (!best || diff < best.diff) {
      best = { diff, match: candidate };
    }
  }

  return best?.match ?? null;
}

export function findBroadcastChannelsByTeams(
  match: MatchBroadcastMeta,
  sources: { meta: MatchBroadcastMeta; channels: string[] }[]
): string[] {
  let best: { diff: number; channels: string[] } | null = null;

  for (const src of sources) {
    if (!src.channels.length) continue;
    if (src.meta.fixture_id === match.fixture_id) return src.channels;
    if (!teamsKickoffMatch(match, src.meta)) continue;

    const diff = Math.abs(
      new Date(match.kickoff_utc).getTime() -
        new Date(src.meta.kickoff_utc).getTime()
    );
    if (!best || diff < best.diff) {
      best = { diff, channels: src.channels };
    }
  }

  return best?.channels ?? [];
}

export function buildBroadcastMap(
  rows: { fixture_id: number; channels: unknown }[]
): Map<number, string[]> {
  return new Map(
    rows.map((b) => [b.fixture_id, normalizeBroadcastChannels(b.channels)])
  );
}

/** Preenche canais em jogos sintéticos (oitavos) a partir de broadcasts noutros fixture_id. */
export function enrichMatchesWithBroadcasts<T extends Match>(
  matches: T[],
  broadcastMap: Map<number, string[]>
): T[] {
  const sources = matches
    .map((m) => ({
      meta: m,
      channels: broadcastMap.get(m.fixture_id) ?? m.channels ?? [],
    }))
    .filter((s) => s.channels.length > 0);

  return matches.map((m) => {
    const direct = broadcastMap.get(m.fixture_id) ?? m.channels ?? [];
    if (direct.length) return { ...m, channels: direct };

    const resolved = findBroadcastChannelsByTeams(m, sources);
    return resolved.length ? { ...m, channels: resolved } : m;
  });
}
