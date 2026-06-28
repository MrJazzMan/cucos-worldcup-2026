import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { mergeBroadcastChannels } from "@/lib/channels";
import {
  carregarAgenda,
  canalParaJogo,
  jogoMundialSenior,
  jogosDoDia,
  parseCanaisLista,
} from "@/lib/ondebola";
import { ptTeam } from "@/lib/team-names";
import { TIMEZONE } from "@/lib/timezone";
import { formatInTimeZone } from "date-fns-tz";

interface DbMatch {
  fixture_id: number;
  kickoff_utc: string;
  home_team_name: string;
  away_team_name: string;
  match_date: string;
}

function matchDbToOndeBola(
  db: DbMatch,
  agenda: Awaited<ReturnType<typeof carregarAgenda>>
): string | null {
  const kickoff = new Date(db.kickoff_utc);
  return canalParaJogo(
    agenda,
    ptTeam(db.home_team_name),
    ptTeam(db.away_team_name),
    kickoff
  );
}

export async function syncBroadcastsFromOndeBola(options?: {
  onlyToday?: boolean;
  onlyWorldCup?: boolean;
}) {
  const onlyToday = options?.onlyToday ?? false;
  const onlyWorldCup = options?.onlyWorldCup ?? true;

  const admin = createSupabaseAdmin();
  const agenda = await carregarAgenda();

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
    .select("fixture_id, kickoff_utc, home_team_name, away_team_name, match_date")
    .order("kickoff_utc", { ascending: true });

  if (onlyToday) {
    query = query.eq("match_date", hoje);
  }

  const { data: matches, error } = await query;
  if (error) throw error;
  if (!matches?.length) {
    return { synced: 0, source: "ondebola", reason: "sem jogos na BD" };
  }

  const { data: existingBroadcasts } = await admin
    .from("broadcasts")
    .select("fixture_id, channels");

  const existingMap = new Map(
    (existingBroadcasts ?? []).map((b) => [b.fixture_id, b.channels as string[]])
  );

  const broadcasts: {
    fixture_id: number;
    channels: string[];
    notes: string;
  }[] = [];

  for (const m of matches as DbMatch[]) {
    const canaisStr = matchDbToOndeBola(m, agendaFiltrada);
    if (!canaisStr) continue;

    broadcasts.push({
      fixture_id: m.fixture_id,
      channels: mergeBroadcastChannels(
        parseCanaisLista(canaisStr),
        existingMap.get(m.fixture_id) ?? []
      ),
      notes: `OndeBola — ${m.home_team_name} vs ${m.away_team_name}`,
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

  return {
    synced: broadcasts.length,
    source: "ondebola",
    agenda_total: agenda.length,
    jogos_mundial_hoje: jogosHoje,
  };
}
