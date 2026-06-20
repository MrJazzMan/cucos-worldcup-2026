import { fetchFixturesByIds, type ApiFixtureEvent } from "@/lib/api-football";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import type { MatchGoalEvent } from "@/types";

export function formatGoalMinute(minute: number, extra: number | null): string {
  if (extra != null && extra > 0) return `${minute}+${extra}'`;
  return `${minute}'`;
}

export function mapApiEventsToGoals(events: ApiFixtureEvent[]): MatchGoalEvent[] {
  return events
    .filter((e) => e.type === "Goal" && e.player?.name)
    .map((e) => ({
      player: e.player!.name!,
      minute: e.time.elapsed,
      extra: e.time.extra,
      team_id: e.team.id,
      detail: e.detail,
    }))
    .sort(
      (a, b) =>
        a.minute - b.minute || (a.extra ?? 0) - (b.extra ?? 0)
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
  options?: { resyncLive?: boolean }
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
  const fixtures = await fetchFixturesByIds(ids);

  for (const fixture of fixtures) {
    try {
      const goal_events = mapApiEventsToGoals(fixture.events ?? []);
      const { error } = await admin
        .from("matches")
        .update({ goal_events })
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
