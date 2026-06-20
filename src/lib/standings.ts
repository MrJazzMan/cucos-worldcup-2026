import { revalidatePath } from "next/cache";
import { fetchStandings } from "@/lib/api-football";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServer } from "@/lib/supabase/server";
import type { GroupStanding, StandingRow } from "@/types";

type ApiStandingsResponse = Awaited<ReturnType<typeof fetchStandings>>;

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

/** Busca classificações na API e grava na BD; invalida cache da página /grupos. */
export async function syncGroupStandings(): Promise<number> {
  if (!process.env.API_FOOTBALL_KEY) return 0;

  const admin = createSupabaseAdmin();
  const apiData = await fetchStandings({ revalidate: 0 });
  const groups = mapApiStandingsToGroups(apiData);

  if (!groups.length) return 0;

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

  revalidatePath("/grupos");
  return groups.length;
}
