import test from "node:test";
import assert from "node:assert/strict";

import {
  ANNEX_C_ROWS,
  ANNEX_C_WINNER_GROUPS,
  getAnnexCAssignment,
  thirdPlaceGroupForWinner,
} from "@/lib/knockout-annex-c";
import {
  getThirdPlaceCandidates,
  rankThirdPlaceCandidates,
  pickBestThirdPlaceTeams,
  buildThirdPlaceContext,
  resolveThirdPlaceSlot,
} from "@/lib/third-place";
import { makeGroup, makeTwelveGroups, makeRow } from "./helpers.mjs";

const ALL_GROUPS = "ABCDEFGHIJKL".split("");

test("Annex C tem as 495 combinações oficiais", () => {
  assert.equal(ANNEX_C_ROWS.length, 495);
});

test("cada linha do Annex C tem 8 letras distintas de grupos válidos", () => {
  for (const row of ANNEX_C_ROWS) {
    assert.equal(row.length, 8, `linha "${row}" não tem 8 letras`);
    const letters = row.split("");
    assert.equal(new Set(letters).size, 8, `linha "${row}" tem letras repetidas`);
    for (const l of letters) {
      assert.ok(ALL_GROUPS.includes(l), `letra inválida "${l}" em "${row}"`);
    }
  }
});

test("getAnnexCAssignment: round-trip de todas as 495 combinações", () => {
  // Para cada linha, a atribuição vencedor→3.º deve usar exactamente o mesmo
  // conjunto de 8 grupos (os valores são uma permutação das letras da linha).
  for (const row of ANNEX_C_ROWS) {
    const sortedLetters = row.split("").sort().join("");
    const assignment = getAnnexCAssignment(row.split(""));
    assert.ok(assignment, `combinação "${sortedLetters}" não encontrada`);

    assert.deepEqual(
      Object.keys(assignment).sort(),
      [...ANNEX_C_WINNER_GROUPS].sort(),
      "as chaves devem ser exactamente os 8 grupos vencedores"
    );

    const values = Object.values(assignment).sort().join("");
    assert.equal(
      values,
      sortedLetters,
      `valores de "${sortedLetters}" não batem certo`
    );
  }
});

test("getAnnexCAssignment é independente da ordem de input", () => {
  const a = getAnnexCAssignment(["E", "J", "I", "F", "H", "G", "L", "K"]);
  const b = getAnnexCAssignment(["F", "G", "H", "I", "J", "K", "L", "E"]);
  assert.deepEqual(a, b);
});

test("getAnnexCAssignment rejeita inputs inválidos", () => {
  assert.equal(getAnnexCAssignment(["A", "B", "C"]), null, "menos de 8");
  assert.equal(
    getAnnexCAssignment(["A", "B", "C", "D", "E", "F", "G", "H", "I"]),
    null,
    "mais de 8"
  );
  // 8 letras mas combinação impossível (ex.: depende dos dados — usa repetição)
  assert.equal(
    getAnnexCAssignment(["A", "A", "B", "C", "D", "E", "F", "G"]),
    null,
    "combinação inexistente"
  );
});

test("thirdPlaceGroupForWinner é coerente com getAnnexCAssignment", () => {
  const groups = "EJIFHGLK".split("");
  const assignment = getAnnexCAssignment(groups);
  for (const winner of ANNEX_C_WINNER_GROUPS) {
    assert.equal(
      thirdPlaceGroupForWinner(groups, winner),
      assignment[winner]
    );
  }
});

// ---- Ranking dos melhores 3.ºs (FIFA Art. 13) ----

test("getThirdPlaceCandidates extrai o 3.º de cada grupo", () => {
  const candidates = getThirdPlaceCandidates(makeTwelveGroups());
  assert.equal(candidates.length, 12);
  for (const c of candidates) assert.equal(c.row.rank, 3);
});

test("rankThirdPlaceCandidates: pontos > diff golos > golos marcados > nome", () => {
  const standings = [
    makeGroup("A", [{}, {}, { points: 4, goal_diff: 1, goals_for: 3, team_name: "Zeta" }, {}]),
    makeGroup("B", [{}, {}, { points: 4, goal_diff: 1, goals_for: 5, team_name: "Beta" }, {}]),
    makeGroup("C", [{}, {}, { points: 4, goal_diff: 3, goals_for: 2, team_name: "Gama" }, {}]),
    makeGroup("D", [{}, {}, { points: 7, goal_diff: 0, goals_for: 2, team_name: "Alfa" }, {}]),
  ];
  const ranked = rankThirdPlaceCandidates(getThirdPlaceCandidates(standings));
  assert.deepEqual(
    ranked.map((c) => c.groupLetter),
    ["D", "C", "B", "A"],
    "D (7pts) > C (maior diff) > B (mais golos) > A"
  );
});

test("pickBestThirdPlaceTeams devolve os 8 melhores", () => {
  const best = pickBestThirdPlaceTeams(makeTwelveGroups());
  assert.equal(best.length, 8);
  assert.deepEqual(
    best.map((c) => c.groupLetter).sort(),
    "ABCDEFGH".split(""),
    "os 3.ºs de maior pontuação (grupos A–H)"
  );
});

test("buildThirdPlaceContext: 12 grupos → contexto válido", () => {
  const ctx = buildThirdPlaceContext(makeTwelveGroups());
  assert.ok(ctx);
  assert.equal(ctx.combinationKey, "ABCDEFGH");
  assert.equal(ctx.qualified.length, 8);
  assert.deepEqual(
    Object.keys(ctx.byWinner).sort(),
    [...ANNEX_C_WINNER_GROUPS].sort()
  );
});

test("buildThirdPlaceContext: menos de 8 grupos → null", () => {
  const partial = makeTwelveGroups().slice(0, 7);
  assert.equal(buildThirdPlaceContext(partial), null);
});

test("resolveThirdPlaceSlot devolve o 3.º correcto para o vencedor de um grupo", () => {
  const groups = makeTwelveGroups();
  const ctx = buildThirdPlaceContext(groups);
  const byGroup = new Map(groups.map((g) => [g.group_name, g]));

  for (const winner of ANNEX_C_WINNER_GROUPS) {
    const thirdGroupLetter = ctx.byWinner[winner];
    const row = resolveThirdPlaceSlot(winner, ctx, byGroup);
    assert.ok(row, `sem 3.º para vencedor ${winner}`);
    const expected = byGroup
      .get(`Grupo ${thirdGroupLetter}`)
      .rows.find((r) => r.rank === 3);
    assert.equal(row.team_id, expected.team_id);
  }
});
