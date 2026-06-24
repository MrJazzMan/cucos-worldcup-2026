# Testes da fase final + correcção da árvore do bracket

**Data:** 2026-06-23. **Frente:** Fase final (`/fasefinal`).

Documento do processo: criação da primeira suite de testes do projecto, validação da
topologia da chave eliminatória contra o calendário oficial FIFA, e correcção de dois
defeitos encontrados na árvore desktop.

---

## 1. Infraestrutura de testes (zero dependências)

O projecto não tinha runner de testes. Em vez de adicionar Jest/Vitest, usámos o que já
existe no Node 22 + a cultura de `scripts/*.mjs`:

- **`node:test`** (runner nativo) + **type-stripping nativo** do Node ≥ 22.18 (corre `.ts`
  sem compilar).
- **`scripts/test-support/ts-alias-loader.mjs`** — loader ESM que resolve o alias `@/` →
  `src/` (o Node não lê os `paths` do `tsconfig`). Tenta `.ts` e depois `/index.ts`.
- Script: `npm test` → `node --experimental-loader … --test tests/*.test.mjs`.

```bash
npm test    # 34 testes
```

> **Porquê um loader e não Jest?** Mantém o repo sem dependências de build novas e alinhado
> com os scripts `.mjs` já existentes. O único atrito é resolver o alias `@/`, que o loader
> trata em ~20 linhas.

### Ficheiros

| Ficheiro | Cobre |
|----------|-------|
| `tests/helpers.mjs` | Fábricas `makeRow` / `makeGroup` / `makeMatch` / `makeTwelveGroups` |
| `tests/knockout-annex-c.test.mjs` | Annex C (495 combos + round-trip), ranking dos 3.ºs (Art. 13) |
| `tests/knockout-qualification.test.mjs` | Locks matemáticos, `resolveSlotCode`, `enrichSlotPreview` |
| `tests/knockout-fifa-order.test.mjs` | `FIFA_MATCH_NUMBERS`, `orderMatchesInFifaSlots` |
| `tests/knockout-bracket-topology.test.mjs` | Coerência skeleton ↔ árvore vs calendário oficial |

---

## 2. Validação da topologia — o que os testes provaram

**A lógica estava sã.** Passaram à primeira: o round-trip das 495 linhas do Annex C
(cada combinação mapeia vencedor→3.º usando exactamente o mesmo conjunto de 8 grupos),
o ranking dos terceiros, os locks de qualificação, a ordenação FIFA e a **coerência do
`KNOCKOUT_SKELETON` com o calendário oficial M73–M104** (cada ronda consome os vencedores
da anterior uma só vez).

**A árvore desktop não reproduzia o skeleton.** A validação de topologia falhou em 3
asserções, revelando dois bugs em `buildSideTree` (`knockout-bracket-tree.ts`) — só na
vista desktop; a vista mobile por colunas usava `columns` directamente e estava correcta.

### Defeito A — slots dos quartos lidas da coluna errada

```js
// ANTES (knockout-bracket-tree.ts:101)
const qfSlots = roundSlotsAt(r16, qfFifaIndices, preview);
//                            ^^^ lê de r16; nunca havia getColumn(columns, "qf")
```

Os cartões da coluna de **quartos-de-final mostravam jogos dos dezasseis-avos** (M89–M96)
em vez de M97–M100.
Diagnóstico do teste: *"nó à profundidade 1 devia vir da coluna «qf», mas veio de «r16» (M89)"*.

### Defeito B — split de metades incompatível com as meias-finais

```
metade esquerda (antes):  R16 = [89, 90, 91, 92]   →  SF combina M97 + M99
metade esquerda (correcta): R16 = [89, 90, 93, 94]  →  SF combina M97 + M98
```

O `r16Base` contíguo (`0..3` / `4..7`) punha M97 e M99 no mesmo lado. Mas o skeleton (e a
FIFA) define **SF M101 = V97 vs V98**. Resultado: dois jogos que oficialmente só se podem
cruzar na **final** estavam estruturados para se encontrarem na **meia-final**.
Diagnóstico: *"nó M101: codifica V97/V98 mas é alimentado pelos jogos M89/M91"*.

---

## 3. A correcção — topologia declarativa

A causa raiz de ambos os defeitos era a topologia descrita em **tabelas de índices**
(`R32_TO_R16_PAIRINGS`, `R16_PAIR_TO_QF_FIFA_INDEX`, …) — difícil de ler e de validar, e
exactamente onde o erro se escondeu. Substituímos por uma **especificação declarativa da
árvore** em `knockout-fifa-order.ts`:

```
              M101                                  M102
           ╱       ╲                            ╱       ╲
        M97         M98                      M99         M100
       ╱   ╲       ╱   ╲                    ╱   ╲       ╱    ╲
     M89   M90   M93   M94                M91   M92   M95   M96
     ╱ ╲   ╱ ╲   ╱ ╲   ╱ ╲                ╱ ╲   ╱ ╲   ╱ ╲   ╱ ╲
   74 77 73 75 83 84 81 82            76 78 79 80 86 88 85 87
```

- `SIDE_TREE_SPEC.{left,right}` — árvore de números FIFA (folhas = jogos R32).
- `fifaSlotLocation(matchNumber)` — converte M73–M104 em `{ coluna, índice }`.
- `buildSideTree` reduz-se a um walk recursivo `buildNode()` que lê a slot na coluna+índice
  certos e desce para os filhos. `R32_TREE_LEAF_ORDER` passa a ser **derivado** da spec.

Removidas as constantes-tabela obsoletas e os helpers `roundSlotsAt`/`mergeWithPairings`.

**Resultado:** `npm test` → 34/34. `tsc --noEmit` e `next lint` limpos.

---

## 4. Lições

1. **Topologia de bracket = dados declarativos, não tabelas de índices.** Uma árvore
   literal com os números FIFA é auto-documentada e impossível de desalinhar das meias.
2. **A fonte de verdade é o `KNOCKOUT_SKELETON`.** Qualquer vista (mobile, desktop) tem de
   reproduzi-lo; o teste de coerência compara a árvore com ele por identidade de referência.
3. **Testes de invariantes apanham bugs estruturais** que o olho não vê em preview (sem
   jogos reais): «cada ronda consome a anterior uma vez», «cada nó = vencedores dos filhos».

---

## 5. Pendências

- [ ] Localizar rótulos de seed do bracket (`1.º Gr. X`) nos 10 idiomas.
- [ ] Testes para `getDayStandingsGroups`, `live-sync-schedule` (slots QStash).
- [ ] CI: correr `npm test` no GitHub Actions antes do deploy.
