import test from "node:test";
import assert from "node:assert/strict";

import {
  FIFA_MATCH_NUMBERS,
  R32_TREE_LEAF_ORDER,
  orderMatchesInFifaSlots,
} from "@/lib/knockout-fifa-order";
import { makeMatch } from "./helpers.mjs";

function range(from, to) {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}

test("FIFA_MATCH_NUMBERS cobre M73–M104 sem buracos", () => {
  assert.deepEqual([...FIFA_MATCH_NUMBERS.r32], range(73, 88));
  assert.deepEqual([...FIFA_MATCH_NUMBERS.r16], range(89, 96));
  assert.deepEqual([...FIFA_MATCH_NUMBERS.qf], range(97, 100));
  assert.deepEqual([...FIFA_MATCH_NUMBERS.sf], [101, 102]);
  assert.deepEqual([...FIFA_MATCH_NUMBERS.third], [103]);
  assert.deepEqual([...FIFA_MATCH_NUMBERS.final], [104]);

  const all = [
    ...FIFA_MATCH_NUMBERS.r32,
    ...FIFA_MATCH_NUMBERS.r16,
    ...FIFA_MATCH_NUMBERS.qf,
    ...FIFA_MATCH_NUMBERS.sf,
    ...FIFA_MATCH_NUMBERS.third,
    ...FIFA_MATCH_NUMBERS.final,
  ];
  assert.equal(new Set(all).size, 32, "32 jogos eliminatórios distintos");
});

test("R32_TREE_LEAF_ORDER é uma partição das 16 folhas (cada índice 0–15 uma vez)", () => {
  const left = [...R32_TREE_LEAF_ORDER.left];
  const right = [...R32_TREE_LEAF_ORDER.right];
  assert.equal(left.length, 8);
  assert.equal(right.length, 8);
  assert.deepEqual([...left, ...right].sort((a, b) => a - b), range(0, 15));
});

// ---- orderMatchesInFifaSlots ----

function previewWithTeams(homeId, awayId) {
  return {
    home: `${homeId}`,
    away: `${awayId}`,
    homeResolved: { code: `${homeId}`, team_id: homeId },
    awayResolved: { code: `${awayId}`, team_id: awayId },
  };
}

test("coloca jogos reais no slot FIFA cujas equipas coincidem (independente da ordem)", () => {
  const previews = [
    previewWithTeams(10, 20),
    previewWithTeams(30, 40),
    previewWithTeams(50, 60),
  ];
  const matchB = makeMatch({ fixture_id: 1, home_team_id: 40, away_team_id: 30 });
  const matchA = makeMatch({ fixture_id: 2, home_team_id: 10, away_team_id: 20 });

  const result = orderMatchesInFifaSlots([matchB, matchA], previews, 3);

  assert.equal(result[0]?.fixture_id, 2, "slot 0 = confronto 10v20");
  assert.equal(result[1]?.fixture_id, 1, "slot 1 = confronto 30v40 (ordem trocada)");
  assert.equal(result[2], undefined, "slot 2 sem jogo");
});

test("fallback: jogos sem preview correspondente entram por ordem de kickoff", () => {
  const previews = [
    { home: "a", away: "b" }, // sem equipas resolvidas → nunca casa
    { home: "c", away: "d" },
  ];
  const late = makeMatch({
    fixture_id: 1,
    kickoff_utc: "2026-07-01T20:00:00.000Z",
  });
  const early = makeMatch({
    fixture_id: 2,
    kickoff_utc: "2026-07-01T18:00:00.000Z",
  });

  const result = orderMatchesInFifaSlots([late, early], previews, 2);
  assert.equal(result[0]?.fixture_id, 2, "mais cedo primeiro");
  assert.equal(result[1]?.fixture_id, 1);
});

test("não excede slotCount", () => {
  const previews = [previewWithTeams(1, 2)];
  const extra = [
    makeMatch({ fixture_id: 1, home_team_id: 1, away_team_id: 2 }),
    makeMatch({ fixture_id: 2, home_team_id: 9, away_team_id: 8 }),
  ];
  const result = orderMatchesInFifaSlots(extra, previews, 1);
  assert.ok(result.length <= 1);
  assert.equal(result[0]?.fixture_id, 1);
});
