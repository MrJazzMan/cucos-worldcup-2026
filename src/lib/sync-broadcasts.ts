import { createSupabaseAdmin } from "@/lib/supabase/admin";
import {
  buildBroadcastMap,
  type MatchBroadcastMeta,
} from "@/lib/broadcast-resolve";
import { mergeBroadcastChannels } from "@/lib/channels";
import {
  carregarAgenda,
  equipasCoincidem,
  jogoMundialSenior,
  jogosDoDia,
  limparCacheOndeBola,
  parseCanaisLista,
  type JogoTV,
} from "@/lib/ondebola";
import { appendScheduledKnockoutMatches } from "@/lib/scheduled-knockout-matches";
import { ptTeam } from "@/lib/team-names";
import { TIMEZONE } from "@/lib/timezone";
import type { Match } from "@/types";
import { formatInTimeZone } from "date-fns-tz";

function findDbMatchForJogo(
  jogo: JogoTV,
  matches: MatchBroadcastMeta[]
): MatchBroadcastMeta | null {
  const jogoDay = formatInTimeZone(jogo.inicio_lisboa, TIMEZONE, "yyyy-MM-dd");
  const sameDay = matches.filter(
    (m) =>
      formatInTimeZone(new Date(m.kickoff_utc), TIMEZONE, "yyyy-MM-dd") ===
      jogoDay
  );

  let melhor: { diff: number; match: MatchBroadcastMeta } | null = null;

  for (const m of sameDay) {
    const home = ptTeam(m.home_team_name);
    const away = ptTeam(m.away_team_name);
    const casaOk = equipasCoincidem(home, jogo.equipa_casa);
    const foraOk = equipasCoincidem(away, jogo.equipa_fora);
    const casaForaOk = equipasCoincidem(home, jogo.equipa_fora);
    const foraCasaOk = equipasCoincidem(away, jogo.equipa_casa);
    if (!((casaOk && foraOk) || (casaForaOk && foraCasaOk))) continue;

    const diff = Math.abs(
      new Date(m.kickoff_utc).getTime() - jogo.inicio_lisboa.getTime()
    );
    if (diff > 180 * 60 * 1000) continue;

    if (!melhor || diff < melhor.diff) {
      melhor = { diff, match: m };
    }
  }

  return melhor?.match ?? null;
}

export async function syncBroadcastsFromOndeBola(options?: {
  onlyToday?: boolean;
  onlyWorldCup?: boolean;
}) {
  const onlyToday = options?.onlyToday ?? false;
  const onlyWorldCup = options?.onlyWorldCup ?? true;

  const admin = createSupabaseAdmin();
  limparCacheOndeBola();
  const agenda = await carregarAgenda(true);

  if (!agenda.length) {
    return { synced: 0, source: "ondebola", reason: "agenda vazia" };
  }

  let agendaFiltrada = agenda.filter(jogoMundialSenior);
  if (!onlyWorldCup) {
    agendaFiltrada = agenda;
  }

  const hoje = formatInTimeZone(new Date(), TIMEZONE, "yyyy-MM-dd");

  let query = admin
    .from("matches")
    .select(
      "fixture_id, kickoff_utc, home_team_name, away_team_name, match_date, round, group_name, status, home_team_id, home_team_logo, away_team_id, away_team_logo, home_score, away_score, minute, venue, channels"
    )
    .order("kickoff_utc", { ascending: true });

  if (onlyToday) {
    query = query.eq("match_date", hoje);
  }

  const { data: matches, error } = await query;
  if (error) throw error;
  if (!matches?.length) {
    return { synced: 0, source: "ondebola", reason: "sem jogos na BD" };
  }

  const dbMatches = appendScheduledKnockoutMatches(matches as Match[]).map(
    (m) => ({
      fixture_id: m.fixture_id,
      kickoff_utc: m.kickoff_utc,
      home_team_name: m.home_team_name,
      away_team_name: m.away_team_name,
    })
  );

  const { data: existingBroadcasts } = await admin
    .from("broadcasts")
    .select("fixture_id, channels");

  const existingMap = buildBroadcastMap(existingBroadcasts ?? []);

  const broadcasts: {
    fixture_id: number;
    channels: string[];
    notes: string;
  }[] = [];

  const seenFixtures = new Set<number>();

  for (const jogo of agendaFiltrada) {
    const ondebolaChannels = parseCanaisLista(jogo.canais);
    if (!ondebolaChannels.length) continue;

    const dbMatch = findDbMatchForJogo(jogo, dbMatches);
    if (!dbMatch || seenFixtures.has(dbMatch.fixture_id)) continue;

    seenFixtures.add(dbMatch.fixture_id);
    broadcasts.push({
      fixture_id: dbMatch.fixture_id,
      channels: mergeBroadcastChannels(
        ondebolaChannels,
        existingMap.get(dbMatch.fixture_id) ?? []
      ),
      notes: `OndeBola — ${jogo.equipa_casa} vs ${jogo.equipa_fora}`,
    });
  }

  if (broadcasts.length) {
    const { error: upsertErr } = await admin.from("broadcasts").upsert(
      broadcasts.map((b) => ({
        ...b,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: "fixture_id" }
    );
    if (upsertErr) throw upsertErr;
  }

  const jogosHoje = jogosDoDia(agendaFiltrada).length;
  const channelsTotal = broadcasts.reduce((n, b) => n + b.channels.length, 0);

  return {
    synced: broadcasts.length,
    channelsTotal,
    source: "ondebola",
    agenda_total: agenda.length,
    jogos_mundial_hoje: jogosHoje,
  };
}