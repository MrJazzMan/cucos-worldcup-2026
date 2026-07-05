import { isFeederPlaceholderName } from "@/lib/feeder-teams";
import {
  carregarAgenda,
  findJogoNaAgenda,
  jogoMundialSenior,
  parseCanaisLista,
} from "@/lib/ondebola";
import { ptTeam } from "@/lib/team-names";
import type { Match } from "@/types";

function needsOndeBolaChannels(match: Match): boolean {
  return (
    !match.channels?.length &&
    !isFeederPlaceholderName(match.home_team_name) &&
    !isFeederPlaceholderName(match.away_team_name)
  );
}

/** Preenche canais em falta consultando a agenda OndeBola (cache 6h). */
export async function fillChannelsFromOndeBola<T extends Match>(
  matches: T[]
): Promise<T[]> {
  if (!matches.some(needsOndeBolaChannels)) return matches;

  const agenda = await carregarAgenda(false);
  const mundial = agenda.filter(jogoMundialSenior);
  if (!mundial.length) return matches;

  return matches.map((m) => {
    if (!needsOndeBolaChannels(m)) return m;

    const jogo = findJogoNaAgenda(
      mundial,
      ptTeam(m.home_team_name),
      ptTeam(m.away_team_name),
      new Date(m.kickoff_utc)
    );
    if (!jogo) return m;

    const channels = parseCanaisLista(jogo.canais);
    return channels.length ? { ...m, channels } : m;
  });
}
