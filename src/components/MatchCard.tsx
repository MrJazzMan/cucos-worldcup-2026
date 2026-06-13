import { TeamFlag } from "@/components/TeamFlag";
import { formatKickoffTime } from "@/lib/timezone";
import { getStatusColor, getStatusLabel } from "@/lib/match-utils";
import type { Match } from "@/types";

interface MatchCardProps {
  match: Match & { isFavourite?: boolean };
}

export function MatchCard({ match }: MatchCardProps) {
  const time = formatKickoffTime(match.kickoff_utc);
  const isLive = match.status === "live";
  const isFinished = match.status === "finished";

  return (
    <article
      className={`rounded-2xl border bg-zinc-900 p-4 transition-colors ${
        match.isFavourite
          ? "border-amber-500/60 ring-1 ring-amber-500/30"
          : "border-zinc-800"
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${getStatusColor(match.status)}`}
        >
          {getStatusLabel(match.status)}
          {isLive && match.minute != null && (
            <span className="ml-1">{match.minute}&apos;</span>
          )}
        </span>
        {match.isFavourite && (
          <span className="text-amber-400" aria-label="Equipa favorita">
            ★
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-1 flex-col items-center gap-2 text-center">
          <TeamFlag name={match.home_team_name} logo={match.home_team_logo} size={40} />
          <p className="text-lg font-semibold leading-tight text-white">
            {match.home_team_name}
          </p>
        </div>

        <div className="flex min-w-[5rem] flex-col items-center gap-1">
          {(isLive || isFinished) && match.home_score != null ? (
            <p className="text-2xl font-bold tabular-nums text-white">
              {match.home_score} – {match.away_score}
            </p>
          ) : (
            <p className="text-2xl font-bold tabular-nums text-white">{time}</p>
          )}
          {!isLive && !isFinished && (
            <p className="text-xs text-zinc-500">hora PT</p>
          )}
        </div>

        <div className="flex flex-1 flex-col items-center gap-2 text-center">
          <TeamFlag name={match.away_team_name} logo={match.away_team_logo} size={40} />
          <p className="text-lg font-semibold leading-tight text-white">
            {match.away_team_name}
          </p>
        </div>
      </div>

      {match.group_name && (
        <p className="mt-3 text-center text-xs text-zinc-500">{match.group_name}</p>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        {match.channels && match.channels.length > 0 ? (
          match.channels.map((channel) => (
            <span
              key={channel}
              className="rounded-lg bg-blue-600/20 px-3 py-1 text-sm font-medium text-blue-300"
            >
              📺 {channel}
            </span>
          ))
        ) : (
          <span className="text-sm text-zinc-500">Canal a confirmar</span>
        )}
      </div>
    </article>
  );
}
