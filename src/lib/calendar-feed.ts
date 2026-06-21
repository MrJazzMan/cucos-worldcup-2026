import { timingSafeEqual } from "node:crypto";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { ptTeam } from "@/lib/team-names";
import { isWorldCupMatch } from "@/lib/world-cup";
import type { Match } from "@/types";

/** Tokens iCal expiram ao fim deste período; regenerar no menu Perfil → Calendário. */
export const CALENDAR_TOKEN_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

/** Duração estimada do evento no calendário (inclui intervalo + pausas WC 2026). */
const MATCH_DURATION_MS = 115 * 60_000;

function escapeIcs(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function foldIcsLine(line: string): string {
  const max = 75;
  if (line.length <= max) return line;
  const parts: string[] = [line.slice(0, max)];
  let i = max;
  while (i < line.length) {
    parts.push(` ${line.slice(i, i + max - 1)}`);
    i += max - 1;
  }
  return parts.join("\r\n");
}

function toIcsUtc(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z/, "Z");
}

function eventSummary(match: Match): string {
  const home = ptTeam(match.home_team_name);
  const away = ptTeam(match.away_team_name);

  if (match.status === "live") {
    const score =
      match.home_score != null && match.away_score != null
        ? `${match.home_score}-${match.away_score}`
        : "vs";
    return `[AO VIVO ${score}] ${home} vs ${away}`;
  }

  if (match.status === "finished") {
    const score =
      match.home_score != null && match.away_score != null
        ? `${match.home_score}-${match.away_score}`
        : "vs";
    return `[FINAL ${score}] ${home} vs ${away}`;
  }

  return `${home} vs ${away}`;
}

function eventDescription(match: Match, siteUrl: string): string {
  const lines: string[] = [];
  if (match.venue) lines.push(`Local: ${match.venue}`);
  if (match.group_name) lines.push(match.group_name);
  if (match.round) lines.push(match.round);
  const channels = match.channels ?? [];
  lines.push(channels.length ? `TV: ${channels.join(", ")}` : "TV: —");
  lines.push(siteUrl);
  return escapeIcs(lines.join("\n"));
}

function buildVevent(match: Match, siteUrl: string, nowStamp: string): string {
  const start = toIcsUtc(match.kickoff_utc);
  const end = toIcsUtc(
    new Date(new Date(match.kickoff_utc).getTime() + MATCH_DURATION_MS).toISOString()
  );
  const summary = escapeIcs(eventSummary(match));
  const description = eventDescription(match, siteUrl);
  const location = match.venue ? escapeIcs(match.venue) : "";

  const lines = [
    "BEGIN:VEVENT",
    foldIcsLine(`UID:wc26-fixture-${match.fixture_id}@wc26.pt`),
    foldIcsLine(`DTSTAMP:${nowStamp}`),
    foldIcsLine(`DTSTART:${start}`),
    foldIcsLine(`DTEND:${end}`),
    foldIcsLine(`SUMMARY:${summary}`),
    foldIcsLine(`DESCRIPTION:${description}`),
    location ? foldIcsLine(`LOCATION:${location}`) : null,
    foldIcsLine(`URL:${siteUrl}`),
    "STATUS:CONFIRMED",
    "END:VEVENT",
  ].filter(Boolean);

  return lines.join("\r\n");
}

async function loadFavouriteTeamIds(userId: string): Promise<number[]> {
  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("favourite_teams")
    .select("team_id")
    .eq("user_id", userId);
  return (data ?? []).map((r) => r.team_id);
}

async function loadMatchesWithChannels(): Promise<Match[]> {
  const admin = createSupabaseAdmin();
  const { data: matches, error } = await admin
    .from("matches")
    .select("*")
    .order("kickoff_utc", { ascending: true });

  if (error || !matches) return [];

  const wcMatches = matches.filter(isWorldCupMatch);
  const { data: broadcasts } = await admin.from("broadcasts").select("fixture_id, channels");
  const broadcastMap = new Map(
    (broadcasts ?? []).map((b) => [b.fixture_id, b.channels as string[]])
  );

  return wcMatches.map((m) => ({
    ...m,
    channels: broadcastMap.get(m.fixture_id) ?? [],
  }));
}

export async function resolveUserIdByCalendarToken(
  token: string
): Promise<string | null> {
  if (!token || token.length < 32) return null;

  const admin = createSupabaseAdmin();
  const { data } = await admin
    .from("profiles")
    .select("user_id, calendar_token, calendar_token_created_at")
    .eq("calendar_token", token)
    .maybeSingle();

  if (!data?.calendar_token || !data.user_id) return null;

  const a = Buffer.from(token, "utf8");
  const b = Buffer.from(data.calendar_token, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  if (data.calendar_token_created_at) {
    const age = Date.now() - new Date(data.calendar_token_created_at).getTime();
    if (age > CALENDAR_TOKEN_MAX_AGE_MS) return null;
  }

  return data.user_id;
}

export async function buildFavouritesCalendarIcs(
  userId: string,
  siteUrl: string
): Promise<string> {
  const [favIds, allMatches] = await Promise.all([
    loadFavouriteTeamIds(userId),
    loadMatchesWithChannels(),
  ]);

  const site = siteUrl.replace(/\/$/, "");
  const nowStamp = toIcsUtc(new Date().toISOString());

  const favSet = new Set(favIds);
  const matches =
    favSet.size === 0
      ? []
      : allMatches.filter(
          (m) => favSet.has(m.home_team_id) || favSet.has(m.away_team_id)
        );

  const events = matches
    .map((m) => buildVevent(m, site, nowStamp))
    .join("\r\n");

  const calName =
    favSet.size === 0
      ? "Cucos WC26 — equipas favoritas"
      : "Cucos WC26 — os meus jogos";

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Cucos WC26//Favourites//PT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    foldIcsLine(`NAME:${escapeIcs(calName)}`),
    foldIcsLine(`X-WR-CALNAME:${escapeIcs(calName)}`),
    foldIcsLine(`REFRESH-INTERVAL;VALUE=DURATION:PT3H`),
    foldIcsLine(
      `X-WR-CALDESC:${escapeIcs("Jogos das tuas equipas favoritas no Mundial 2026 (wc26.pt).")}`
    ),
    events,
    "END:VCALENDAR",
    "",
  ]
    .filter((line) => line.length > 0)
    .join("\r\n");
}
