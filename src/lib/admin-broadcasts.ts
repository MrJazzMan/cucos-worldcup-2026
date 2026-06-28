import { dateKeyInTz, dayKeyWithOffset } from "@/lib/datetime";
import { TIMEZONE } from "@/lib/timezone";

/** Jogos úteis no admin de canais: por jogar, ao vivo, ou terminados ontem/hoje. */
export function isRelevantAdminBroadcastMatch(
  match: { kickoff_utc: string; status: string },
  tz: string = TIMEZONE
): boolean {
  if (match.status === "upcoming" || match.status === "live") return true;
  const matchDay = dateKeyInTz(match.kickoff_utc, tz);
  const yesterdayKey = dayKeyWithOffset(tz, -1);
  return matchDay >= yesterdayKey;
}
