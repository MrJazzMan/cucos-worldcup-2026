import test from "node:test";
import assert from "node:assert/strict";

import { buildKnockoutColumns } from "@/lib/knockout-bracket";
import {
  buildSideTree,
  getCenterSlots,
} from "@/lib/knockout-bracket-tree";
import { FIFA_MATCH_NUMBERS } from "@/lib/knockout-fifa-order";

// Chave em modo preview (sem jogos, sem classificações): os slots ficam com os
// códigos do skeleton FIFA (2A, V74, …), que é a transcrição do calendário oficial.
const columns = buildKnockoutColumns([], []);
const col = (key) => columns.find((c) => c.key === key);

const winnerNum = (code) => {
  const m = /^V(\d+)$/.exec(code);
  return m ? Number(m[1]) : null;
};
const loserNum = (code) => {
  const m = /^D(\d+)$/.exec(code);
  return m ? Number(m[1]) : null;
};

function refsOf(key, parse = winnerNum) {
  return col(key)
    .previews.flatMap((p) => [parse(p.home), parse(p.away)])
    .sort((a, b) => a - b);
}
const range = (from, to) =>
  Array.from({ length: to - from + 1 }, (_, i) => from + i);

// =========================================================================
// PARTE 1 — Coerência do SKELETON (calendário oficial M73–M104).
// Estes invariantes garantem que cada ronda consome os vencedores da anterior
// exactamente uma vez. Devem PASSAR.
// =========================================================================

test("skeleton: os 8 dezasseis-avos referenciam os 16 vencedores R32 (M73–M88) uma vez", () => {
  assert.deepEqual(refsOf("r16"), range(73, 88));
});

test("skeleton: os 4 quartos referenciam os 8 vencedores R16 (M89–M96) uma vez", () => {
  assert.deepEqual(refsOf("qf"), range(89, 96));
});

test("skeleton: as 2 meias referenciam os 4 vencedores QF (M97–M100) uma vez", () => {
  assert.deepEqual(refsOf("sf"), range(97, 100));
});

test("skeleton: final = vencedores das meias; 3.º lugar = derrotados das meias", () => {
  assert.deepEqual(refsOf("final"), [101, 102]);
  assert.deepEqual(refsOf("third", loserNum), [101, 102]);
});

// =========================================================================
// PARTE 2 — Coerência da ÁRVORE DESKTOP (buildSideTree) com o skeleton.
// A árvore deve reproduzir exactamente os mesmos emparelhamentos. Estes
// testes VALIDAM a topologia actual.
// =========================================================================

// Mapa: objecto-preview → { coluna, número FIFA } por identidade de referência.
const refmap = new Map();
for (const c of columns) {
  c.previews.forEach((p, i) =>
    refmap.set(p, { key: c.key, num: FIFA_MATCH_NUMBERS[c.key][i] })
  );
}
const meta = (node) => refmap.get(node.slot.preview);

const leftTree = buildSideTree(columns, "left", true);
const rightTree = buildSideTree(columns, "right", true);

// A profundidade a partir da raiz determina a ronda esperada.
const LEVEL_KEY = ["sf", "qf", "r16", "r32"];

function eachNode(node, depth, fn) {
  fn(node, depth);
  if (node.left && node.right) {
    eachNode(node.left, depth + 1, fn);
    eachNode(node.right, depth + 1, fn);
  }
}

test("árvore: cada nível vem da coluna FIFA correcta (sf→qf→r16→r32)", () => {
  for (const root of [leftTree, rightTree]) {
    eachNode(root, 0, (node, depth) => {
      const m = meta(node);
      assert.ok(m, "nó sem preview reconhecido");
      assert.equal(
        m.key,
        LEVEL_KEY[depth],
        `nó à profundidade ${depth} devia vir da coluna "${LEVEL_KEY[depth]}", ` +
          `mas veio de "${m.key}" (M${m.num})`
      );
    });
  }
});

test("árvore: os códigos de cada nó batem certo com os vencedores dos seus filhos", () => {
  for (const root of [leftTree, rightTree]) {
    eachNode(root, 0, (node) => {
      if (!node.left || !node.right) return;
      const childNums = [meta(node.left).num, meta(node.right).num].sort(
        (a, b) => a - b
      );
      const ownCodes = [
        winnerNum(node.slot.preview.home),
        winnerNum(node.slot.preview.away),
      ].sort((a, b) => a - b);
      assert.deepEqual(
        ownCodes,
        childNums,
        `nó M${meta(node).num}: codifica V${ownCodes.join("/V")} mas é alimentado ` +
          `pelos jogos M${childNums.join("/M")}`
      );
    });
  }
});

test("árvore: a metade esquerda alimenta a SF que combina M97+M98 (não M97+M99)", () => {
  // Para honrar o skeleton (SF M101 = V97 vs V98), a metade esquerda da árvore
  // tem de conter os dezasseis-avos que alimentam M97 (M89,M90) e M98 (M93,M94).
  const r16Nums = [];
  eachNode(leftTree, 0, (node, depth) => {
    if (depth === 2) r16Nums.push(meta(node).num);
  });
  assert.deepEqual(
    r16Nums.sort((a, b) => a - b),
    [89, 90, 93, 94],
    "a metade esquerda contém dezasseis-avos incoerentes com o emparelhamento das meias"
  );
});

test("centro: final e 3.º/4.º lugar vêm das colunas certas", () => {
  const center = getCenterSlots(columns, true);
  assert.equal(refmap.get(center.final.preview)?.key, "final");
  assert.equal(refmap.get(center.third.preview)?.key, "third");
});
