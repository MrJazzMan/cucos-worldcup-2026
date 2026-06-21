import Image from "next/image";
import { TeamName, T } from "@/components/Display";
import { TeamFlag } from "@/components/TeamFlag";
import { PORTUGAL_TEAM_ID } from "@/lib/world-cup";
import type { GroupStanding, StandingRow } from "@/types";

type Variant = "full" | "compact";

interface GroupStandingsTableProps {
  group: GroupStanding;
  variant?: Variant;
  highlightTeamId?: number;
}

function formatGoalDiff(goalDiff: number): string {
  return goalDiff > 0 ? `+${goalDiff}` : String(goalDiff);
}

function FullRow({ row }: { row: StandingRow }) {
  return (
    <tr className="border-t border-border-base/60 text-foreground">
      <td className="px-2 py-2.5 text-center tabular-nums text-muted">
        {row.rank}
      </td>
      <td className="px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          {row.team_logo && (
            <Image
              src={row.team_logo}
              alt=""
              width={20}
              height={20}
              className="shrink-0 rounded-full"
              unoptimized
            />
          )}
          <span className="truncate font-medium">
            <TeamName name={row.team_name} />
          </span>
        </div>
      </td>
      <td className="px-1 py-2.5 text-center tabular-nums">{row.played}</td>
      <td className="px-1 py-2.5 text-center tabular-nums">{row.won}</td>
      <td className="px-1 py-2.5 text-center tabular-nums">{row.draw}</td>
      <td className="px-1 py-2.5 text-center tabular-nums">{row.lost}</td>
      <td className="px-1 py-2.5 text-center tabular-nums">
        {formatGoalDiff(row.goal_diff)}
      </td>
      <td className="px-2 py-2.5 text-center font-bold tabular-nums">
        {row.points}
      </td>
    </tr>
  );
}

function CompactRow({
  row,
  highlighted,
}: {
  row: StandingRow;
  highlighted: boolean;
}) {
  return (
    <tr
      className={`border-t border-border-base/60 text-foreground ${
        highlighted ? "bg-primary/10 font-medium" : ""
      }`}
    >
      <td className="px-2 py-2 text-center tabular-nums text-muted">
        {row.rank}
      </td>
      <td className="px-2 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <TeamFlag
            name={row.team_name}
            teamId={row.team_id}
            size={20}
            className="shrink-0"
          />
          <span className="truncate">
            <TeamName name={row.team_name} />
          </span>
        </div>
      </td>
      <td className="px-1 py-2 text-center tabular-nums">{row.played}</td>
      <td className="px-1 py-2 text-center tabular-nums">
        {formatGoalDiff(row.goal_diff)}
      </td>
      <td className="px-2 py-2 text-center font-bold tabular-nums">
        {row.points}
      </td>
    </tr>
  );
}

const FULL_COLGROUP = (
  <colgroup>
    <col className="w-9" />
    <col />
    <col className="w-9" />
    <col className="w-9" />
    <col className="w-9" />
    <col className="w-9" />
    <col className="w-10" />
    <col className="w-11" />
  </colgroup>
);

const COMPACT_COLGROUP = (
  <colgroup>
    <col className="w-8" />
    <col />
    <col className="w-8" />
    <col className="w-9" />
    <col className="w-9" />
  </colgroup>
);

export function GroupStandingsTable({
  group,
  variant = "full",
  highlightTeamId = PORTUGAL_TEAM_ID,
}: GroupStandingsTableProps) {
  const isCompact = variant === "compact";

  return (
    <div className="overflow-x-auto">
      <table className="w-full table-fixed text-sm">
        {isCompact ? COMPACT_COLGROUP : FULL_COLGROUP}
        <thead>
          <tr className="text-xs text-muted">
            <th className="px-2 py-2 text-center font-medium">#</th>
            <th className="px-2 py-2 text-left font-medium">
              <T k="groups.col.team" />
            </th>
            <th className="px-1 py-2 text-center font-medium">
              <T k="groups.col.played" />
            </th>
            {!isCompact && (
              <>
                <th className="px-1 py-2 text-center font-medium">
                  <T k="groups.col.won" />
                </th>
                <th className="px-1 py-2 text-center font-medium">
                  <T k="groups.col.draw" />
                </th>
                <th className="px-1 py-2 text-center font-medium">
                  <T k="groups.col.lost" />
                </th>
              </>
            )}
            <th className="px-1 py-2 text-center font-medium">
              <T k="groups.col.gd" />
            </th>
            <th className="px-2 py-2 text-center font-bold">
              <T k="groups.col.points" />
            </th>
          </tr>
        </thead>
        <tbody>
          {group.rows.map((row) =>
            isCompact ? (
              <CompactRow
                key={row.team_id}
                row={row}
                highlighted={row.team_id === highlightTeamId}
              />
            ) : (
              <FullRow key={row.team_id} row={row} />
            )
          )}
        </tbody>
      </table>
    </div>
  );
}
