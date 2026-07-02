import test from "node:test";
import assert from "node:assert/strict";

import { buildKnockoutColumns } from "@/lib/knockout-bracket";
import {
  buildRadialBracketLayout,
  RADIAL_CENTER,
  RADIAL_R_TEAMS,
  RADIAL_MATCH_ORDER,
} from "@/lib/knockout-bracket-radial-layout";
import { FIFA_MATCH_NUMBERS } from "@/lib/knockout-fifa-order";

const columns = buildKnockoutColumns([], []);
const layout = buildRadialBracketLayout(columns, true);

test("radial wheel: 32 bandeiras no anel exterior", () => {
  assert.equal(layout.teamSlots.length, 32);
});

test("radial wheel: 16 jogos R32 mapeados em pares", () => {
  assert.equal(layout.teamSlotsByMatch.size, 16);
  for (const matchNumber of RADIAL_MATCH_ORDER) {
    assert.ok(layout.teamSlotsByMatch.has(matchNumber));
  }
});

test("radial wheel: nós interiores R16→SF + final + 3.º", () => {
  assert.equal(layout.matchNodes.length, 16);
  assert.ok(layout.nodeByMatch.get(104));
  assert.ok(layout.nodeByMatch.get(103));
});

test("radial wheel: folhas no anel exterior", () => {
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

test("radial wheel: conectores Y para cada nó interno", () => {
  assert.equal(layout.connectors.length, 15);
  for (const connector of layout.connectors) {
    assert.ok(connector.junction);
    assert.ok(connector.to);
  }
});

test("radial wheel: todos os M73–M88 têm par de equipas", () => {
  for (const num of FIFA_MATCH_NUMBERS.r32) {
    assert.ok(layout.teamSlotsByMatch.has(num), `falta par M${num}`);
  }
});
