import {
  fetchFixtureEvents,
  fetchFixturesByIds,
  mapApiStatus,
  type ApiFixture,
  type ApiFixtureEvent,
} from "@/lib/api-football";
import { regulationScoresFromEvents } from "@/lib/match-result";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import type { MatchGoalEvent } from "@/types";

export function formatGoalMinute(minute: number, extra: number | null): string {
  if (extra != null && extra > 0) return `${minute}+${extra}'`;
  return `${minute}'`;
}

function goalEventKey(event: MatchGoalEvent): string {
  return `${event.team_id}|${event.minute}|${event.extra ?? 0}|${event.player}|${event.detail}`;
}

export function mapApiEventsToGoals(events: ApiFixtureEvent[]): MatchGoalEvent[] {
  const seen = new Set<string>();
  const goals: MatchGoalEvent[] = [];

  for (const e of events) {
    if (e.type !== "Goal" || !e.player?.name) continue;
    const goal: MatchGoalEvent = {
      player: e.player.name,
      minute: e.time.elapsed,
      extra: e.time.extra,
      team_id: e.team.id,
      detail: e.detail,
    };
    const key = goalEventKey(goal);
    if (seen.has(key)) continue;
    seen.add(key);
    goals.push(goal);
  }

  return goals.sort(
    (a, b) => a.minute - b.minute || (a.extra ?? 0) - (b.extra ?? 0)
  );
}

export function goalsForTeam(
  events: MatchGoalEvent[] | undefined,
  teamId: number
): MatchGoalEvent[] {
  return (events ?? []).filter((e) => e.team_id === teamId);
}

/** Sincroniza marcadores para jogos ao vivo ou terminados. */
export async function syncGoalEventsForFixtures(
  fixtureIds: number[],
  options?: { resyncLive?: boolean; fixtures?: ApiFixture[] }
): Promise<number> {
  if (!fixtureIds.length || !process.env.API_FOOTBALL_KEY) return 0;

  const admin = createSupabaseAdmin();
  let ids = fixtureIds;

  if (!options?.resyncLive) {
    const { data: existing } = await admin
      .from("matches")
      .select("fixture_id, status, goal_events")
      .in("fixture_id", fixtureIds);

    ids = (existing ?? [])
      .filter((m) => {
        if (m.status === "live") return true;
        const goals = m.goal_events as MatchGoalEvent[] | null;
        return !goals?.length;
      })
      .map((m) => m.fixture_id);
  }

  if (!ids.length) return 0;

  let synced = 0;
  const fixtureById = new Map(
    (options?.fixtures ?? []).map((fixture) => [fixture.fixture.id, fixture])
  );
  const missingIds = ids.filter((id) => !fixtureById.has(id));
  const fetched = missingIds.length ? await fetchFixturesByIds(missingIds) : [];
  for (const fixture of fetched) {
    fixtureById.set(fixture.fixture.id, fixture);
  }

  for (const fixtureId of ids) {
    const fixture = fixtureById.get(fixtureId);
    if (!fixture) continue;

    try {
      const rawEvents =
        fixture.events?.length
          ? fixture.events
          : await fetchFixtureEvents(fixture.fixture.id);
      const goal_events = mapApiEventsToGoals(rawEvents ?? []);
      const status = mapApiStatus(fixture.fixture.status.short);
      const apiHome = fixture.goals.home ?? 0;
      const apiAway = fixture.goals.away ?? 0;
      const fromEvents = regulationScoresFromEvents(
        goal_events,
        fixture.teams.home.id,
        fixture.teams.away.id
      );
      const home_score =
        goal_events.length > 0 && status === "live"
          ? Math.max(apiHome, fromEvents.home)
          : fixture.goals.home;
      const away_score =
        goal_events.length > 0 && status === "live"
          ? Math.max(apiAway, fromEvents.away)
          : fixture.goals.away;
      const { error } = await admin
        .from("matches")
        .update({
          goal_events,
          home_score,
          away_score,
          status,
          minute:
            status === "live" || status === "finished"
              ? fixture.fixture.status.elapsed
              : null,
        })
        .eq("fixture_id", fixture.fixture.id);
      if (error) throw error;
      synced++;
    } catch (err) {
      console.warn(
        `goal events sync failed for ${fixture.fixture.id}:`,
        err
      );
    }
  }

  return synced;
}
