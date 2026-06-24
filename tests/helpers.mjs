// Fábricas de objectos de teste para a lógica do bracket.

let autoId = 1000;

/** Cria um StandingRow com defaults sensatos; sobrepor o que interessar ao teste. */
export function makeRow(overrides = {}) {
  const team_id = overrides.team_id ?? autoId++;
  return {
    rank: 1,
    team_id,
    team_name: `Team ${team_id}`,
    team_logo: null,
    played: 3,
    won: 0,
    draw: 0,
    lost: 0,
    goals_for: 0,
    goals_against: 0,
    goal_diff: 0,
    points: 0,
    form: null,
    ...overrides,
  };
}

/** Cria um grupo completo (3 jogos por equipa) com 4 equipas ranqueadas 1..4. */
export function makeGroup(groupLetter, rows) {
  return {
    group_name: `Grupo ${groupLetter}`,
    rows: rows.map((r, i) => makeRow({ rank: i + 1, ...r })),
  };
}

/** Cria um Match mínimo mas completo para a lógica do bracket. */
export function makeMatch(overrides = {}) {
  const fixture_id = overrides.fixture_id ?? autoId++;
  return {
    fixture_id,
    kickoff_utc: "2026-07-01T18:00:00.000Z",
    finished_utc: null,
    match_date: "2026-07-01",
    home_team_id: 1,
    home_team_name: "Home",
    home_team_logo: null,
    away_team_id: 2,
    away_team_name: "Away",
    away_team_logo: null,
    home_score: null,
    away_score: null,
    status: "upcoming",
    minute: null,
    round: "Round of 32",
    group_name: null,
    venue: null,
    ...overrides,
  };
}

/** Conjunto canónico de 12 grupos completos (A–L) com 3.ºs de pontuação distinta.
 *  O 3.º de cada grupo tem pontos = índice, garantindo um ranking determinístico
 *  e que os 8 melhores 3.ºs são, por construção, os grupos A,B,C,D,E,F,G,H. */
export function makeTwelveGroups() {
  const letters = "ABCDEFGHIJKL".split("");
  return letters.map((letter, i) =>
    makeGroup(letter, [
      { points: 9, goal_diff: 5, goals_for: 8 },
      { points: 6, goal_diff: 2, goals_for: 5 },
      // 3.º lugar: pontos decrescentes A=12 … L=1 → A..H são os 8 melhores.
      { points: 12 - i, goal_diff: 0, goals_for: 3 },
      { points: 0, goal_diff: -7, goals_for: 1 },
    ])
  );
}
