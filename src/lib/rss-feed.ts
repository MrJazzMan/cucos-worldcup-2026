import { timingSafeEqual } from "node:crypto";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { formatKickoffTime } from "@/lib/timezone";
import { ptTeam } from "@/lib/team-names";
import { isWorldCupMatch } from "@/lib/world-cup";
import type { Match } from "@/types";

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatRssDate(iso: string): string {
  return new Date(iso).toUTCString();
}

function statusLabel(match: Match): string {
  if (match.status === "live") {
    return match.minute != null ? `AO VIVO ${match.minute}'` : "AO VIVO";
  }
  if (match.status === "finished") return "FINAL";
  return formatKickoffTime(match.kickoff_utc);
}

function itemTitle(match: Match): string {
  const home = ptTeam(match.home_team_name);
  const away = ptTeam(match.away_team_name);
  const tag = statusLabel(match);

  if (match.status === "live" || match.status === "finished") {
    const score =
      match.home_score != null && match.away_score != null
        ? `${match.home_score}–${match.away_score}`
        : "vs";
    return `[${tag}] ${home} ${score} ${away}`;
  }

  return `[${tag}] ${home} vs ${away}`;
}

function itemDescription(match: Match): string {
  const lines: string[] = [];
  const home = ptTeam(match.home_team_name);
  const away = ptTeam(match.away_team_name);

  lines.push(`<p><strong>${escapeXml(home)} vs ${escapeXml(away)}</strong></p>`);
  lines.push(`<p>Data: ${escapeXml(match.match_date)} · Hora (PT): ${escapeXml(formatKickoffTime(match.kickoff_utc))}</p>`);

  if (match.status === "live" || match.status === "finished") {
    if (match.home_score != null && match.away_score != null) {
      lines.push(`<p>Resultado: ${match.home_score}–${match.away_score}</p>`);
    }
    lines.push(`<p>Estado: ${escapeXml(statusLabel(match))}</p>`);
  }

  if (match.venue) {
    lines.push(`<p>Local: ${escapeXml(match.venue)}</p>`);
  }
  if (match.group_name) {
    lines.push(`<p>Grupo: ${escapeXml(match.group_name)}</p>`);
  }
  if (match.round) {
    lines.push(`<p>Fase: ${escapeXml(match.round)}</p>`);
  }

  const channels = match.channels ?? [];
  lines.push(
    channels.length
      ? `<p>TV: ${channels.map((c) => escapeXml(c)).join(", ")}</p>`
      : "<p>TV: —</p>"
  );

  return lines.join("\n");
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

export async function buildMatchesRssXml(
  siteUrl: string,
  feedUrl: string
): Promise<string> {
  const matches = await loadMatchesWithChannels();
  const now = new Date().toUTCString();
  const site = siteUrl.replace(/\/$/, "");

  const items = matches
    .map((match) => {
      const channels = match.channels ?? [];
      const channelSuffix =
        channels.length > 0 ? ` — ${channels.join(", ")}` : "";
      const title = escapeXml(`${itemTitle(match)}${channelSuffix}`);
      const description = itemDescription(match);

      return `    <item>
      <title>${title}</title>
      <link>${site}/</link>
      <description><![CDATA[${description}]]></description>
      <pubDate>${formatRssDate(match.kickoff_utc)}</pubDate>
      <guid isPermaLink="false">wc26-fixture-${match.fixture_id}</guid>
    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Cucos WC26 — Jogos e TV Portugal</title>
    <link>${escapeXml(site)}/</link>
    <description>Calendário do Mundial 2026 com canais de TV em Portugal (OndeBola + curadoria).</description>
    <language>pt-PT</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;
}

export function isValidRssFeedToken(token: string): boolean {
  const expected = process.env.RSS_FEED_TOKEN;
  if (!expected || expected.length < 16) return false;
  if (token.length !== expected.length) return false;

  const a = Buffer.from(token, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;

  return timingSafeEqual(a, b);
}
