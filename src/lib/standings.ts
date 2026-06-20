import { revalidatePath } from "next/cache";
import { fetchStandings } from "@/lib/api-football";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServer } from "@/lib/supabase/server";
import { isWorldCupMatch } from "@/lib/world-cup";
import type { GroupStanding, Match, StandingRow } from "@/types";

type ApiStandingsResponse = Awaited<ReturnType<typeof fetchStandings>>;

const GROUP_STANDING_MATCH_FIELDS =
  "fixture_id, status, group_name, round, home_team_id, home_team_name, home_team_logo, away_team_id, away_team_name, away_team_logo, home_score, away_score";

export type GroupStandingMatch = Pick<
  Match,
  | "fixture_id"
  | "status"
  | "group_name"
  | "round"
  | "home_team_id"
  | "home_team_name"
  | "home_team_logo"
  | "away_team_id"
  | "away_team_name"
  | "away_team_logo"
  | "home_score"
  | "away_score"
>;

type TeamAccum = {
  team_id: number;
  team_name: string;
  team_logo: string | null;
  played: number;
  won: number;
  draw: number;
  lost: number;
  goals_for: number;
  goals_against: number;
};

export function resolveGroupName(
  m: Pick<Match, "group_name" | "round">
): string | null {
  if (m.group_name) return m.group_name;
  const match = (m.round ?? "").match(/Group\s+([A-L])/i);
  return match ? `Grupo ${match[1].toUpperCase()}` : null;
}

function applyResult(stats: TeamAccum, goalsFor: number, goalsAgainst: number) {
  stats.played++;
  stats.goals_for += goalsFor;
  stats.goals_against += goalsAgainst;
  if (goalsFor > goalsAgainst) stats.won++;
  else if (goalsFor < goalsAgainst) stats.lost++;
  else stats.draw++;
}

/** Classificações calculadas a partir dos resultados na BD (mais fiável que /standings da API). */
export function computeStandingsFromMatches(
  matches: GroupStandingMatch[]
): GroupStanding[] {
  const groupTeams = new Map<string, Map<number, TeamAccum>>();

  const ensureTeam = (
    groupName: string,
    id: number,
    name: string,
    logo: string | null
  ) => {
    if (!groupTeams.has(groupName)) groupTeams.set(groupName, new Map());
    const teams = groupTeams.get(groupName)!;
    if (!teams.has(id)) {
      teams.set(id, {
        team_id: id,
        team_name: name,
        team_logo: logo,
        played: 0,
        won: 0,
        draw: 0,
        lost: 0,
        goals_for: 0,
        goals_against: 0,
      });
    }
    return teams.get(id)!;
  };

  for (const m of matches) {
    const groupName = resolveGroupName(m);
    if (!groupName) continue;

    ensureTeam(groupName, m.home_team_id, m.home_team_name, m.home_team_logo);
    ensureTeam(groupName, m.away_team_id, m.away_team_name, m.away_team_logo);

    if (m.status !== "finished") continue;
    if (m.home_score == null || m.away_score == null) continue;

    const home = ensureTeam(
      groupName,
      m.home_team_id,
      m.home_team_name,
      m.home_team_logo
    );
    const away = ensureTeam(
      groupName,
      m.away_team_id,
      m.away_team_name,
      m.away_team_logo
    );

    applyResult(home, m.home_score, m.away_score);
    applyResult(away, m.away_score, m.home_score);
  }

  const groups: GroupStanding[] = [];
  for (const [group_name, teamsMap] of groupTeams) {
    const rows: StandingRow[] = [...teamsMap.values()]
      .map((t) => ({
        rank: 0,
        team_id: t.team_id,
        team_name: t.team_name,
        team_logo: t.team_logo,
        played: t.played,
        won: t.won,
        draw: t.draw,
        lost: t.lost,
        goals_for: t.goals_for,
        goals_against: t.goals_against,
        goal_diff: t.goals_for - t.goals_against,
        points: t.won * 3 + t.draw,
        form: null,
      }))
      .sort(
        (a, b) =>
          b.points - a.points ||
          b.goal_diff - a.goal_diff ||
          b.goals_for - a.goals_for ||
          a.team_name.localeCompare(b.team_name, "en")
      )
      .map((row, i) => ({ ...row, rank: i + 1 }));

    groups.push({ group_name, rows });
  }

  groups.sort((a, b) => a.group_name.localeCompare(b.group_name, "pt"));
  return groups;
}

export function mapApiStandingsToGroups(data: ApiStandingsResponse): GroupStanding[] {
  if (!data.length) return [];

  const groups = data[0].league.standings
    .map((group) => {
      const apiGroup = group[0]?.group ?? "";
      const match = apiGroup.match(/Group\s+([A-L])/i);
      if (!match) return null;

      const letter = match[1].toUpperCase();
      return {
        group_name: `Grupo ${letter}`,
        rows: group.map(
          (row): StandingRow => ({
            rank: row.rank,
            team_id: row.team.id,
            team_name: row.team.name,
            team_logo: row.team.logo,
            played: row.all.played,
            won: row.all.win,
            draw: row.all.draw,
            lost: row.all.lose,
            goals_for: row.all.goals.for,
            goals_against: row.all.goals.against,
            goal_diff: row.goalsDiff,
            points: row.points,
            form: row.form,
          })
        ),
      };
    })
    .filter(Boolean) as GroupStanding[];

  groups.sort((a, b) => a.group_name.localeCompare(b.group_name, "pt"));
  return groups;
}

async function fetchGroupStageMatches(): Promise<GroupStandingMatch[]> {
  const supabase = await createSupabaseServer();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("matches")
    .select(GROUP_STANDING_MATCH_FIELDS)
    .order("kickoff_utc", { ascending: true });

  if (error || !data?.length) return [];

  return (data as GroupStandingMatch[]).filter(
    (m) => isWorldCupMatch(m) && resolveGroupName(m)
  );
}

export async function getGroupStandingsFromDb(): Promise<GroupStanding[] | null> {
  const supabase = await createSupabaseServer();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("group_standings")
    .select("group_name, rows")
    .order("group_name");

  if (error || !data?.length) return null;

  return data.map((row) => ({
    group_name: row.group_name,
    rows: row.rows as StandingRow[],
  }));
}

async function loadGroupStageMatchesForSync(): Promise<GroupStandingMatch[]> {
  const admin = createSupabaseAdmin();
  const { data, error } = await admin
    .from("matches")
    .select(GROUP_STANDING_MATCH_FIELDS)
    .order("kickoff_utc", { ascending: true });

  if (error) throw error;

  return ((data ?? []) as GroupStandingMatch[]).filter(
    (m) => isWorldCupMatch(m) && resolveGroupName(m)
  );
}

/** Recalcula classificações a partir dos jogos na BD e grava; invalida cache de /grupos. */
export async function syncGroupStandings(): Promise<number> {
  const matches = await loadGroupStageMatchesForSync();
  const groups = computeStandingsFromMatches(matches);

  if (!groups.length) {
    console.warn(
      `syncGroupStandings: 0 grupos (${matches.length} jogos de grupo na BD)`
    );
    return 0;
  }

  const admin = createSupabaseAdmin();
  const now = new Date().toISOString();
  const { error } = await admin.from("group_standings").upsert(
    groups.map((g) => ({
      group_name: g.group_name,
      rows: g.rows,
      updated_at: now,
    })),
    { onConflict: "group_name" }
  );

  if (error) throw error;

  try {
    revalidatePath("/grupos");
  } catch (err) {
    console.warn("revalidatePath /grupos failed:", err);
  }

  return groups.length;
}

export async function getComputedGroupStandings(): Promise<GroupStanding[]> {
  const matches = await fetchGroupStageMatches();
  return computeStandingsFromMatches(matches);
}
