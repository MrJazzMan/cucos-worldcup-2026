import test from "node:test";
import assert from "node:assert/strict";

import { buildKnockoutColumns } from "@/lib/knockout-bracket";
import {
  buildRadialBracketLayout,
  connectorPath,
  LEFT_R32_MATCHES,
  outerTeamVisible,
  RADIAL_CENTER,
  RADIAL_R_TEAMS,
  RIGHT_R32_MATCHES,
} from "@/lib/knockout-bracket-radial-layout";
import { FIFA_MATCH_NUMBERS } from "@/lib/knockout-fifa-order";

const columns = buildKnockoutColumns([], []);
const layout = buildRadialBracketLayout(columns, true);

test("radial wheel: 32 slots de equipas no anel exterior", () => {
  assert.equal(layout.teamSlots.length, 32);
});

test("radial wheel: 16 jogos R32 por metade FIFA", () => {
  assert.equal(LEFT_R32_MATCHES.length, 8);
  assert.equal(RIGHT_R32_MATCHES.length, 8);
  assert.equal(layout.teamSlotsByMatch.size, 16);
});

test("radial wheel: nós interiores R16→SF + final + 3.º", () => {
  assert.equal(layout.matchNodes.length, 16);
  assert.ok(layout.nodeByMatch.get(104));
  assert.ok(layout.nodeByMatch.get(103));
});

test("radial wheel: equipas no anel exterior", () => {
  for (const slot of layout.teamSlots) {
    const radius = Math.hypot(slot.x - RADIAL_CENTER, slot.y - RADIAL_CENTER);
    assert.ok(
      Math.abs(radius - RADIAL_R_TEAMS) < 2,
      `M${slot.matchNumber} ${slot.side} devia estar no anel exterior`
    );
  }
});

test("radial wheel: final no centro", () => {
  const final = layout.nodeByMatch.get(104);
  assert.ok(final);
  assert.ok(Math.abs(final.x - RADIAL_CENTER) < 1);
  assert.ok(Math.abs(final.y - RADIAL_CENTER) < 1);
});

test("radial wheel: conectores em arco", () => {
  assert.equal(layout.connectors.length, 15);
  assert.ok(layout.connectors[0].pathA.startsWith("M "));
  assert.ok(layout.leafConnectors.length > 0);
});

test("radial wheel: caminho em arco válido", () => {
  const path = connectorPath(100, 100, 500, 500);
  assert.match(path, /^M /);
  assert.ok(path.includes("A") || path.includes("Q"));
});

test("radial wheel: todos os M73–M88 têm par de equipas", () => {
  for (const num of FIFA_MATCH_NUMBERS.r32) {
    assert.ok(layout.teamSlotsByMatch.has(num), `falta par M${num}`);
  }
});

test("outerTeamVisible: vencedor sai do anel exterior", () => {
  const slot = {
    match: {
      status: "finished",
      home_score: 1,
      away_score: 0,
      home_team_id: 1,
      away_team_id: 2,
      home_team_name: "A",
      away_team_name: "B",
    } as never,
  };
  assert.equal(outerTeamVisible(slot, "home"), false);
  assert.equal(outerTeamVisible(slot, "away"), true);
});
