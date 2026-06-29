import { normalizeBroadcastChannels } from "@/lib/channels";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServer } from "@/lib/supabase/server";
import type { DayOffset, GroupStanding, Match, TeamOption } from "@/types";
import { isKnockoutRound, sortKnockoutRoundNames } from "@/lib/knockout-bracket";
import { isWorldCupMatch } from "@/lib/world-cup";
import { getDateForOffset, formatMatchDate } from "@/lib/timezone";
import {
  fetchStandings,
  fetchRounds,
  fetchFixturesByRound,
  fetchTeams,
} from "@/lib/api-football";
import { enrichMatchVenue, resolveMatchVenue } from "@/lib/official-venues";
import { appendScheduledKnockoutMatches } from "@/lib/scheduled-knockout-matches";
import { formatVenueField } from "@/lib/venues";
import {
  getGroupStandingsFromDb,
  getComputedGroupStandings,
  mapApiStandingsToGroups,
} from "@/lib/standings";

export async function getMatchesForDay(
  offset: DayOffset,
  favouriteTeamIds: number[] = []
): Promise<(Match & { isFavourite?: boolean })[]> {
  const date = getDateForOffset(offset);
  const supabase = await createSupabaseServer();

  if (!supabase) return [];

  const { data: matches, error } = await supabase
    .from("matches")
    .select("*")
    .eq("match_date", date)
    .order("kickoff_utc", { ascending: true });

  if (error || !matches) return [];

  const wcMatches = matches.filter(isWorldCupMatch);
  const fixtureIds = wcMatches.map((m) => m.fixture_id);
  const { data: broadcasts } = await supabase
    .from("broadcasts")
    .select("fixture_id, channels")
    .in("fixture_id", fixtureIds.length ? fixtureIds : [-1]);

  const broadcastMap = new Map(
    (broadcasts ?? []).map((b) => [
      b.fixture_id,
      normalizeBroadcastChannels(b.channels),
    ])
  );

  return wcMatches.map((m) =>
    enrichMatchVenue({
      ...m,
      channels: broadcastMap.get(m.fixture_id) ?? [],
      isFavourite:
        favouriteTeamIds.includes(m.home_team_id) ||
        favouriteTeamIds.includes(m.away_team_id),
    })
  );
}

export async function getAllMatches(
  favouriteTeamIds: number[] = []
): Promise<(Match & { isFavourite?: boolean })[]> {
  const supabase = await createSupabaseServer();
  if (!supabase) return [];

  const { data: matches, error } = await supabase
    .from("matches")
    .select("*")
    .order("kickoff_utc", { ascending: true });

  if (error || !matches) return [];

  const wcMatches = matches.filter(isWorldCupMatch);

  const { data: broadcasts } = await supabase
    .from("broadcasts")
    .select("fixture_id, channels");

  const broadcastMap = new Map(
    (broadcasts ?? []).map((b) => [
      b.fixture_id,
      normalizeBroadcastChannels(b.channels),
    ])
  );

  return appendScheduledKnockoutMatches(
    wcMatches.map((m) =>
      enrichMatchVenue({
        ...m,
        channels: broadcastMap.get(m.fixture_id) ?? [],
        isFavourite:
          favouriteTeamIds.includes(m.home_team_id) ||
          favouriteTeamIds.includes(m.away_team_id),
      })
    )
  );
}

export async function getUserFavouriteTeamIds(): Promise<number[]> {
  const supabase = await createSupabaseServer();
  if (!supabase) return [];
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("favourite_teams")
    .select("team_id")
    .eq("user_id", user.id);

  return (data ?? []).map((r) => r.team_id);
}

export async function getGroupStandings(): Promise<GroupStanding[]> {
  try {
    const computed = await getComputedGroupStandings();
    if (computed.length) return computed;

    const fromDb = await getGroupStandingsFromDb();
    if (fromDb?.length) return fromDb;

    const data = await fetchStandings();
    const groups = mapApiStandingsToGroups(data);
    return groups.length ? groups : getMockStandings();
  } catch {
    return getMockStandings();
  }
}

function groupKnockoutMatchesFromDb(
  matches: Match[]
): { round: string; matches: Match[] }[] {
  const knockout = matches.filter(
    (m) => isKnockoutRound(m.round) && !m.group_name
  );

  const byRound = new Map<string, Match[]>();
  for (const match of knockout) {
    const round = match.round!;
    const list = byRound.get(round) ?? [];
    list.push(match);
    byRound.set(round, list);
  }

  return sortKnockoutRoundNames([...byRound.keys()]).map((round) => ({
    round,
    matches: (byRound.get(round) ?? []).sort(
      (a, b) =>
        new Date(a.kickoff_utc).getTime() - new Date(b.kickoff_utc).getTime()
    ),
  }));
}

export async function getKnockoutRounds(): Promise<
  { round: string; matches: Match[] }[]
> {
  const supabase = await createSupabaseServer();
  if (supabase) {
    const { data, error } = await supabase
      .from("matches")
      .select("*")
      .order("kickoff_utc", { ascending: true });

    if (!error && data?.length) {
      const wcMatches = data.filter(isWorldCupMatch) as Match[];
      const fixtureIds = wcMatches
        .filter((m) => isKnockoutRound(m.round) && !m.group_name)
        .map((m) => m.fixture_id);
      const { data: broadcasts } = await supabase
        .from("broadcasts")
        .select("fixture_id, channels")
        .in("fixture_id", fixtureIds.length ? fixtureIds : [-1]);
      const broadcastMap = new Map(
        (broadcasts ?? []).map((b) => [
          b.fixture_id,
          normalizeBroadcastChannels(b.channels),
        ])
      );
      const wcWithChannels = appendScheduledKnockoutMatches(
        wcMatches.map((m) =>
          enrichMatchVenue({
            ...m,
            channels: broadcastMap.get(m.fixture_id) ?? m.channels ?? [],
          })
        )
      );
      const fromDb = groupKnockoutMatchesFromDb(wcWithChannels);
      if (fromDb.length > 0) return fromDb;
    }
  }

  try {
    const rounds = await fetchRounds();
    const knockoutRounds = rounds.filter((r) => isKnockoutRound(r));

    const result = [];
    for (const round of knockoutRounds) {
      const fixtures = await fetchFixturesByRound(round);
      result.push({
        round,
        matches: fixtures.map((f) => {
          const m = {
            fixture_id: f.fixture.id,
            kickoff_utc: f.fixture.date,
            match_date: formatMatchDate(f.fixture.date),
            home_team_id: f.teams.home.id,
            home_team_name: f.teams.home.name,
            home_team_logo: f.teams.home.logo,
            away_team_id: f.teams.away.id,
            away_team_name: f.teams.away.name,
            away_team_logo: f.teams.away.logo,
            home_score: f.goals.home,
            away_score: f.goals.away,
            status: "upcoming" as const,
            minute: null,
            round,
            group_name: null,
            venue: resolveMatchVenue(
              f.fixture.id,
              formatVenueField(f.fixture.venue)
            ),
            channels: [],
          };
          return m;
        }),
      });
    }
    return result;
  } catch {
    return [];
  }
}

export async function getAllTeams(): Promise<TeamOption[]> {
  const supabase = await createSupabaseServer();

  if (supabase) {
    const { data } = await supabase
      .from("matches")
      .select("home_team_id, home_team_name, home_team_logo, away_team_id, away_team_name, away_team_logo");

    if (data && data.length > 0) {
      const teams = new Map<number, TeamOption>();
      for (const m of data) {
        teams.set(m.home_team_id, {
          team_id: m.home_team_id,
          team_name: m.home_team_name,
          team_logo: m.home_team_logo,
        });
        teams.set(m.away_team_id, {
          team_id: m.away_team_id,
          team_name: m.away_team_name,
          team_logo: m.away_team_logo,
        });
      }
      return Array.from(teams.values()).sort((a, b) =>
        a.team_name.localeCompare(b.team_name, "pt")
      );
    }
  }

  try {
    const apiTeams = await fetchTeams();
    return apiTeams
      .map((t) => ({
        team_id: t.team.id,
        team_name: t.team.name,
        team_logo: t.team.logo,
      }))
      .sort((a, b) => a.team_name.localeCompare(b.team_name, "pt"));
  } catch {
    return getMockTeams();
  }
}

function getMockStandings(): GroupStanding[] {
  return [
    {
      group_name: "Grupo K",
      rows: [
        {
          rank: 1,
          team_id: 27,
          team_name: "Portugal",
          team_logo: null,
          played: 0,
          won: 0,
          draw: 0,
          lost: 0,
          goals_for: 0,
          goals_against: 0,
          goal_diff: 0,
          points: 0,
          form: null,
        },
        {
          rank: 2,
          team_id: 0,
          team_name: "DR Congo",
          team_logo: null,
          played: 0,
          won: 0,
          draw: 0,
          lost: 0,
          goals_for: 0,
          goals_against: 0,
          goal_diff: 0,
          points: 0,
          form: null,
        },
      ],
    },
  ];
}

function getMockTeams(): TeamOption[] {
  return [
    { team_id: 27, team_name: "Portugal", team_logo: null },
    { team_id: 1, team_name: "Brasil", team_logo: null },
    { team_id: 2, team_name: "Argentina", team_logo: null },
    { team_id: 3, team_name: "França", team_logo: null },
    { team_id: 4, team_name: "Alemanha", team_logo: null },
    { team_id: 5, team_name: "Espanha", team_logo: null },
  ];
}

export async function upsertBroadcast(
  fixtureId: number,
  channels: string[],
  notes?: string
) {
  const admin = createSupabaseAdmin();
  return admin.from("broadcasts").upsert({
    fixture_id: fixtureId,
    channels,
    notes: notes ?? null,
    updated_at: new Date().toISOString(),
  });
}

export async function seedPortugalBroadcasts() {
  const admin = createSupabaseAdmin();
  const { data: matches } = await admin
    .from("matches")
    .select("fixture_id, home_team_name, away_team_name")
    .or("home_team_name.ilike.%Portugal%,away_team_name.ilike.%Portugal%");

  if (!matches?.length) return { seeded: 0 };

  const broadcasts = matches.map((m) => ({
    fixture_id: m.fixture_id,
    channels: ["RTP1"],
    notes: `${m.home_team_name} vs ${m.away_team_name}`,
    updated_at: new Date().toISOString(),
  }));

  await admin.from("broadcasts").upsert(broadcasts);
  return { seeded: broadcasts.length };
}
