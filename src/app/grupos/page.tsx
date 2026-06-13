import Image from "next/image";
import { getGroupStandings } from "@/lib/matches";
import { ptTeam } from "@/lib/team-names";

export default async function GruposPage() {
  const groups = await getGroupStandings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Grupos</h1>
        <p className="mt-1 text-muted">Classificações do Mundial 2026</p>
      </div>

      {groups.map((group) => (
        <section
          key={group.group_name}
          className="overflow-hidden rounded-2xl border border-border-base bg-surface shadow-sm"
        >
          <h2 className="border-b border-border-base px-4 py-3 text-lg font-semibold text-foreground">
            {group.group_name}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted">
                  <th className="px-3 py-2">#</th>
                  <th className="px-3 py-2">Equipa</th>
                  <th className="px-3 py-2 text-center">J</th>
                  <th className="px-3 py-2 text-center">V</th>
                  <th className="px-3 py-2 text-center">E</th>
                  <th className="px-3 py-2 text-center">D</th>
                  <th className="px-3 py-2 text-center">DG</th>
                  <th className="px-3 py-2 text-center font-bold">Pts</th>
                </tr>
              </thead>
              <tbody>
                {group.rows.map((row) => (
                  <tr
                    key={row.team_id}
                    className="border-t border-border-base/60 text-foreground"
                  >
                    <td className="px-3 py-2.5 tabular-nums">{row.rank}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        {row.team_logo && (
                          <Image
                            src={row.team_logo}
                            alt=""
                            width={20}
                            height={20}
                            className="rounded-full"
                            unoptimized
                          />
                        )}
                        <span className="font-medium">{ptTeam(row.team_name)}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-center tabular-nums">
                      {row.played}
                    </td>
                    <td className="px-3 py-2.5 text-center tabular-nums">
                      {row.won}
                    </td>
                    <td className="px-3 py-2.5 text-center tabular-nums">
                      {row.draw}
                    </td>
                    <td className="px-3 py-2.5 text-center tabular-nums">
                      {row.lost}
                    </td>
                    <td className="px-3 py-2.5 text-center tabular-nums">
                      {row.goal_diff > 0 ? `+${row.goal_diff}` : row.goal_diff}
                    </td>
                    <td className="px-3 py-2.5 text-center font-bold tabular-nums text-foreground">
                      {row.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}

export const revalidate = 300;
