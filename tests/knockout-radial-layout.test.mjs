import test from "node:test";
import assert from "node:assert/strict";

import { buildKnockoutColumns } from "@/lib/knockout-bracket";
import {
  buildRadialBracketLayout,
  RADIAL_CENTER,
  RADIAL_R_OUTER,
} from "@/lib/knockout-bracket-radial-layout";
import { FIFA_MATCH_NUMBERS } from "@/lib/knockout-fifa-order";

const columns = buildKnockoutColumns([], []);
const layout = buildRadialBracketLayout(columns, true);

test("radial: 32 jogos de eliminatórias + final + 3.º lugar", () => {
  assert.equal(layout.nodes.length, 34);
});

test("radial: todos os números FIFA M73–M104 estão representados", () => {
  const nums = new Set(layout.nodes.map((n) => n.matchNumber));
  for (let m = 73; m <= 104; m++) {
    assert.ok(nums.has(m), `falta M${m}`);
  }
});

test("radial: folhas R32 no anel exterior", () => {
  for (const num of FIFA_MATCH_NUMBERS.r32) {
    const node = layout.nodeByMatch.get(num);
    assert.ok(node);
    const radius = Math.hypot(node.x - RADIAL_CENTER, node.y - RADIAL_CENTER);
    assert.ok(
      Math.abs(radius - RADIAL_R_OUTER) < 2,
      `M${num} devia estar no anel exterior (r≈${RADIAL_R_OUTER}, got ${radius})`
    );
  }
});

test("radial: final no centro", () => {
  const final = layout.nodeByMatch.get(104);
  assert.ok(final);
  assert.ok(Math.abs(final.x - RADIAL_CENTER) < 1);
  assert.ok(Math.abs(final.y - RADIAL_CENTER) < 1);
});

test("radial: cada aresta liga nós existentes", () => {
  for (const edge of layout.edges) {
    assert.ok(layout.nodeByMatch.has(edge.from), `origem M${edge.from}`);
    assert.ok(layout.nodeByMatch.has(edge.to), `destino M${edge.to}`);
  }
});

test("radial: 30 arestas na árvore binária + ligações à final", () => {
  assert.equal(layout.edges.length, 30);
});
