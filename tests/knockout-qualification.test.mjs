import test from "node:test";
import assert from "node:assert/strict";

import {
  GROUP_MATCHES_PER_TEAM,
  getMathematicalLocks,
  resolveSlotCode,
  buildStandingsMaps,
  enrichSlotPreview,
  buildBracketContext,
} from "@/lib/knockout-qualification";
import { makeGroup, makeTwelveGroups } from "./helpers.mjs";

test("um grupo do Mundial 2026 tem 3 jogos por equipa", () => {
  assert.equal(GROUP_MATCHES_PER_TEAM, 3);
});

// ---- Locks matemáticos ----

test("grupo completo: 1.º e 2.º ficam trancados", () => {
  const group = makeGroup("A", [
    { points: 9, played: 3 },
    { points: 6, played: 3 },
    { points: 3, played: 3 },
    { points: 0, played: 3 },
  ]);
  const locks = getMathematicalLocks(group);
  assert.equal(locks.get(group.rows[0].team_id), 1);
  assert.equal(locks.get(group.rows[1].team_id), 2);
  assert.equal(locks.get(group.rows[2].team_id), undefined);
});

test("líder garante 1.º com uma jornada por jogar quando ninguém o alcança", () => {
  // played=2, líder 6 pts (máx adversário 4) → minPoints 6 > maxPoints 4.
  const group = makeGroup("B", [
    { points: 6, played: 2 },
    { points: 1, played: 2 },
    { points: 1, played: 2 },
    { points: 0, played: 2 },
  ]);
  const locks = getMathematicalLocks(group);
  assert.equal(locks.get(group.rows[0].team_id), 1);
});

test("grupo indeciso (0 jogos) não tem locks", () => {
  const group = makeGroup("C", [
    { points: 0, played: 0 },
    { points: 0, played: 0 },
    { points: 0, played: 0 },
    { points: 0, played: 0 },
  ]);
  assert.equal(getMathematicalLocks(group).size, 0);
});

// ---- resolveSlotCode ----

function mapsFor(groups) {
  return buildStandingsMaps(groups);
}

test("resolveSlotCode: grupo completo resolve 1.º e 2.º com confirmed", () => {
  const group = makeGroup("A", [
    { points: 9, played: 3 },
    { points: 6, played: 3 },
    { points: 3, played: 3 },
    { points: 0, played: 3 },
  ]);
  const { standingsByGroup, locksByGroup } = mapsFor([group]);

  const first = resolveSlotCode("1A", standingsByGroup, locksByGroup);
  assert.equal(first.team_id, group.rows[0].team_id);
  assert.equal(first.confirmed, true);

  const second = resolveSlotCode("2A", standingsByGroup, locksByGroup);
  assert.equal(second.team_id, group.rows[1].team_id);
});

test("resolveSlotCode: grupo indeciso não revela equipa", () => {
  const group = makeGroup("A", [
    { points: 3, played: 1 },
    { points: 3, played: 1 },
    { points: 0, played: 1 },
    { points: 0, played: 1 },
  ]);
  const { standingsByGroup, locksByGroup } = mapsFor([group]);
  const slot = resolveSlotCode("1A", standingsByGroup, locksByGroup);
  assert.equal(slot.team_id, undefined);
  assert.equal(slot.code, "1A");
});

test("resolveSlotCode: código desconhecido devolve apenas o código", () => {
  const { standingsByGroup, locksByGroup } = mapsFor([]);
  assert.deepEqual(resolveSlotCode("V99", standingsByGroup, locksByGroup), {
    code: "V99",
  });
});

// ---- enrichSlotPreview ----

test("enrichSlotPreview resolve ambos os lados de um confronto de grupos", () => {
  const groups = makeTwelveGroups();
  const { standingsByGroup, locksByGroup } = mapsFor(groups);
  const enriched = enrichSlotPreview(
    { home: "1A", away: "2B" },
    standingsByGroup,
    locksByGroup
  );
  assert.equal(enriched.home, "1A");
  assert.ok(enriched.homeResolved.team_id);
  assert.ok(enriched.awayResolved.team_id);
});

test("enrichSlotPreview resolve o slot 3.º via Annex C (adversário = vencedor de grupo)", () => {
  const groups = makeTwelveGroups();
  const { standingsByGroup, locksByGroup, thirdPlaceContext } =
    buildBracketContext(groups);

  const enriched = enrichSlotPreview(
    { home: "1E", away: "3º" },
    standingsByGroup,
    locksByGroup,
    thirdPlaceContext
  );

  // home: vencedor do grupo E
  assert.ok(enriched.homeResolved.team_id);
  // away: o 3.º que o Annex C coloca contra o vencedor de E
  const thirdGroupLetter = thirdPlaceContext.byWinner.E;
  const expectedThird = groups
    .find((g) => g.group_name === `Grupo ${thirdGroupLetter}`)
    .rows.find((r) => r.rank === 3);
  assert.equal(enriched.awayResolved.team_id, expectedThird.team_id);
  assert.equal(enriched.awayResolved.code, `3${thirdGroupLetter}`);
});
