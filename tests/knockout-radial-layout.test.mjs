import test from "node:test";
import assert from "node:assert/strict";

import { buildKnockoutColumns } from "@/lib/knockout-bracket";
import {
  buildRadialBracketLayout,
  connectorPathElbow,
  LEFT_HALF,
  pathEdges,
  pathToRoot,
  RADIAL_CENTER,
  RADIAL_R_TEAMS,
  RIGHT_HALF,
  teamSideForSlotId,
  TEAM_ORDER,
} from "@/lib/knockout-bracket-radial-layout";

const columns = buildKnockoutColumns([], []);
const layout = buildRadialBracketLayout(columns, true);

test("radial wheel: 32 slots no anel exterior (team_order)", () => {
  assert.equal(layout.teamOrder.length, 32);
  assert.equal(layout.teamOrder.filter((id) => id.endsWith(".A") || id.endsWith(".B")).length, 32);
});

test("radial wheel: metades FIFA (16 slots cada)", () => {
  assert.equal(LEFT_HALF.length, 16);
  assert.equal(RIGHT_HALF.length, 16);
});

test("radial wheel: 63 nos estaticos + 3.º lugar", () => {
  assert.equal(layout.nodes.size, 63);
  assert.ok(layout.thirdPlace);
  assert.equal(layout.thirdPlace.matchNumber, 103);
});

test("radial wheel: 62 arestas elbow (filho->pai)", () => {
  assert.equal(layout.edges.length, 62);
  for (const edge of layout.edges) {
    assert.match(edge.pathElbow, /^M /);
    assert.ok(edge.pathElbow.includes("A") || edge.pathElbow.includes("L"));
  }
});

test("radial wheel: slots no raio exterior", () => {
  for (const slotId of layout.teamOrder) {
    const node = layout.nodes.get(slotId);
    const radius = Math.hypot(node.x - RADIAL_CENTER, node.y - RADIAL_CENTER);
    assert.ok(
      Math.abs(radius - RADIAL_R_TEAMS) < 2,
      `${slotId} devia estar no anel exterior`
    );
  }
});

test("radial wheel: final no centro", () => {
  const final = layout.nodes.get("M104");
  assert.ok(final);
  assert.ok(Math.abs(final.x - RADIAL_CENTER) < 1);
  assert.ok(Math.abs(final.y - RADIAL_CENTER) < 1);
});

test("radial wheel: topologia M89 <- M74, M77", () => {
  const m89 = layout.nodes.get("M89");
  assert.deepEqual(m89.children, ["M74", "M77"]);
});

test("radial wheel: caminho M74.B ate ao centro", () => {
  const chain = pathToRoot("M74.B");
  assert.deepEqual(chain, ["M74.B", "M74", "M89", "M97", "M101", "M104"]);
  assert.equal(pathEdges("M74.B").length, 5);
});

test("radial wheel: connector elbow M74->M89", () => {
  const d = connectorPathElbow("M74", "M89");
  assert.match(d, /^M /);
  assert.ok(d.includes("A"));
});

test("radial wheel: todos os slots têm dados de jogo", () => {
  for (const slotId of layout.teamOrder) {
    const node = layout.nodes.get(slotId);
    assert.ok(node.matchNumber >= 73 && node.matchNumber <= 88, slotId);
    assert.ok(node.side === "home" || node.side === "away", slotId);
  }
});

test("teamSideForSlotId: troca home/away quando API inverte ordem FIFA", () => {
  const slot = {
    match: {
      home_team_id: 20,
      away_team_id: 10,
      home_team_name: "B",
      away_team_name: "A",
    },
    preview: {
      home: "1E",
      away: "3º",
      homeResolved: { team_id: 10, team_name: "A" },
      awayResolved: { team_id: 20, team_name: "B" },
    },
  };
  assert.equal(teamSideForSlotId("M74.A", slot), "away");
  assert.equal(teamSideForSlotId("M74.B", slot), "home");
});
