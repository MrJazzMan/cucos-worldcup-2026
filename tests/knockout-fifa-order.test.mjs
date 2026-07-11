import test from "node:test";
import assert from "node:assert/strict";

import {
  FIFA_MATCH_NUMBERS,
  R32_TREE_LEAF_ORDER,
  orderMatchesInFifaSlots,
  resolveFifaSlotData,
  teamsMatchSlotLoose,
} from "@/lib/knockout-fifa-order";
import { buildKnockoutColumns } from "@/lib/knockout-bracket";
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

test("teamsMatchSlotLoose: casa com uma equipa conhecida no skeleton", () => {
  const preview = {
    home: "1D",
    away: "3º",
    homeResolved: { code: "1D", team_id: 100, team_name: "USA" },
  };
  const match = makeMatch({
    fixture_id: 1,
    home_team_id: 100,
    away_team_id: 200,
    home_team_name: "USA",
    away_team_name: "Bosnia",
  });
  assert.equal(teamsMatchSlotLoose(match, preview), true);
});

test("fallback kickoff não ocupa slots com equipas já resolvidas no skeleton", () => {
  const previews = [
    previewWithTeams(10, 20),
    previewWithTeams(30, 40),
  ];
  const orphan = makeMatch({
    fixture_id: 99,
    home_team_id: 99,
    away_team_id: 98,
    kickoff_utc: "2026-07-01T18:00:00.000Z",
  });
  const result = orderMatchesInFifaSlots([orphan], previews, 2);
  assert.equal(result[0], undefined);
  assert.equal(result[1], undefined);
});

test("resolveFifaSlotData: R16 usa índice FIFA mesmo com skeleton V74/V77", () => {
  const r16Match = makeMatch({
    fixture_id: 900_000_089,
    home_team_id: 1,
    away_team_id: 2,
    home_team_name: "Canada",
    away_team_name: "Morocco",
    round: "Round of 16",
  });
  const columns = buildKnockoutColumns([
    { round: "Round of 16", matches: [r16Match] },
  ]);
  const r16 = columns.find((c) => c.key === "r16");
  const idx = FIFA_MATCH_NUMBERS.r16.indexOf(89);
  const slot = resolveFifaSlotData(r16, idx);
  assert.equal(slot.match?.home_team_name, "Canada");
  assert.equal(slot.preview?.home, "V74");
});

test("orderMatchesInFifaSlots: casa por fixture_id sintético FIFA", () => {
  const previews = [{ home: "V73", away: "V75" }, { home: "V74", away: "V77" }];
  const m90 = makeMatch({
    fixture_id: 900_000_090,
    home_team_id: 1,
    away_team_id: 2,
    kickoff_utc: "2026-07-05T00:00:00.000Z",
  });
  const result = orderMatchesInFifaSlots(
    [m90],
    previews,
    2,
    FIFA_MATCH_NUMBERS.r16.slice(0, 2)
  );
  assert.equal(result[1]?.fixture_id, 900_000_090);
});

test("alignKnockoutColumns: M97 casa = vencedor M89, fora = vencedor M90", () => {
  const franceId = 3;
  const moroccoId = 31;
  const paraguayId = 2380;
  const canadaId = 5529;

  const columns = buildKnockoutColumns([
    {
      round: "Round of 16",
      matches: [
        makeMatch({
          fixture_id: 900_000_089,
          home_team_id: paraguayId,
          away_team_id: franceId,
          home_team_name: "Paraguay",
          away_team_name: "France",
          home_score: 1,
          away_score: 2,
          status: "finished",
          round: "Round of 16",
        }),
        makeMatch({
          fixture_id: 900_000_090,
          home_team_id: canadaId,
          away_team_id: moroccoId,
          home_team_name: "Canada",
          away_team_name: "Morocco",
          home_score: 0,
          away_score: 1,
          status: "finished",
          round: "Round of 16",
        }),
      ],
    },
    {
      round: "Quarter-final",
      matches: [
        makeMatch({
          fixture_id: 900_000_097,
          home_team_id: moroccoId,
          away_team_id: franceId,
          home_team_name: "Morocco",
          away_team_name: "France",
          home_score: 0,
          away_score: 1,
          status: "finished",
          round: "Quarter-final",
        }),
      ],
    },
  ]);

  const qf = columns.find((c) => c.key === "qf");
  const m97 = qf?.matches[0];
  assert.equal(m97?.home_team_name, "France");
  assert.equal(m97?.away_team_name, "Morocco");
});
