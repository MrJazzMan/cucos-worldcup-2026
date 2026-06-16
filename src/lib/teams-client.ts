import { createSupabaseBrowser } from "@/lib/supabase/browser";
import type { TeamOption } from "@/types";

export async function fetchTeamsClient(): Promise<TeamOption[]> {
  const supabase = createSupabaseBrowser();
  const { data } = await supabase
    .from("matches")
    .select(
      "home_team_id, home_team_name, home_team_logo, away_team_id, away_team_name, away_team_logo"
    );

  if (!data?.length) return [];

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
