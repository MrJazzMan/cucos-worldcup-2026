# Handoff de sessão — 25 Junho 2026

Documento para retomar trabalho ou onboarding. **Última actualização:** 2026-06-25.
**Produção:** https://wc26.pt · **Branch:** `main` (deploy Vercel automático).
**Commits desta sessão:** `dc4138e` → `65ee694` (todos em `main`).

---

## Resumo executivo

Sessão em três frentes: **fase final** (correção de bug + primeira suite de testes),
**SEO/partilha** (metadata + Open Graph), e **segurança** (rate limiting anti-scraping,
agora live em produção). Inclui uma análise de growth/SEO completa (em conversa, não
versionada) e a investigação de um utilizador suspeito.

| Área | O que mudou | Estado |
|------|-------------|--------|
| Fase final | Corrigida a topologia da árvore desktop + 34 testes | ✅ em prod |
| SEO | metadataBase, `lang="pt"`, OG/Twitter, OG image, títulos/canonical por rota | ✅ em prod |
| Segurança | Rate limiting por IP (60/min) — 3.ª camada anti-scraping | ✅ **live + verificado** |
| Tooling | `inspect-user.mjs` (investigar utilizador) + `.cursor/` no gitignore | ✅ |

---

## Commits (ordem cronológica)

| Commit | Descrição |
|--------|-----------|
| `dc4138e` | fix(bracket): corrige topologia da árvore desktop + adiciona testes |
| `7f6a4d3` | feat(seo): metadata global, Open Graph e títulos por rota |
| `e328cba` | chore: ignorar `.cursor/` no git |
| `2679404` | docs: handoff 2026-06-23 + actualiza arquitectura |
| `2024af9` | feat(security): rate limiting por IP nas rotas públicas |
| `27a9e2d` | chore(scripts): `inspect-user.mjs` |
| `65ee694` | docs(security): documenta anti-scraping |

---

## 1. Fase final — bug da árvore + testes

**Bug (corrigido em `dc4138e`):** a árvore desktop (`buildSideTree`) não reproduzia o
calendário oficial FIFA:
1. as slots dos quartos liam da coluna `r16` (mostravam jogos dos 16-avos);
2. o split de metades contíguo emparelhava M97 com M99 em vez de M97 com M98 (meias erradas).

**Correção:** topologia tabelada → **especificação declarativa** (`SIDE_TREE_SPEC` +
`fifaSlotLocation` em `knockout-fifa-order.ts`) + walk recursivo em `buildSideTree`.

**Testes (primeira suite do projeto):** `npm test` → **34/34**. Sem dependências novas —
`node:test` + `scripts/test-support/ts-alias-loader.mjs` (resolve o alias `@/`). Cobre
Annex C (round-trip das 495 combinações), 3.ºs, locks, ordem FIFA e coerência da chave.
Detalhe completo em [testes-fase-final.md](testes-fase-final.md).

---

## 2. SEO + Open Graph (`7f6a4d3`)

- `metadataBase: https://wc26.pt`; `<html lang="pt">`.
- Defaults globais `openGraph` (pt_PT) + `twitter` (summary_large_image).
- **OG image gerada por código** — `src/app/opengraph-image.tsx` (1200×630, `next/og`) +
  `twitter-image.tsx`. Verificada: devolve PNG 1200×630. Gancho preparado para uma versão
  dinâmica «jogos de hoje» no futuro.
- `generateMetadata` por rota (`/`, `/grupos`, `/fasefinal`): títulos de intenção
  (horário, canal TV, Portugal) + `alternates.canonical`.

> i18n continua client-side. `lang="pt"` é decisão pragmática de curto prazo; `hreflang`
> + rotas `/[lang]/` ficam como trabalho separado (ver análise de growth, §Pendências).

---

## 3. Segurança — rate limiting anti-scraping (LIVE)

**Contexto:** o site é público (para SEO), logo copiável. Defesa em camadas, não cadeado.
Camadas: (1) `robots.txt`, (2) middleware bloqueia por User-Agent (`403`), (3) **rate
limiting por IP** — a camada nova, que apanha o scraper com UA de browser falso.

**Implementação (`2024af9`):**
- `src/lib/rate-limit.ts` — Upstash Redis, janela deslizante, **60/min** por IP
  (`RATE_LIMIT_PER_MIN`). **No-op sem config**; **fail-open** se o Upstash falhar.
- `src/middleware.ts` — `429` + `Retry-After: 60`. Isenta `/api/`, `/feed/`, `/calendar/`.

**Activação (feita nesta sessão):**
- Criado Redis no Upstash; env `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`
  adicionadas a **Production** no Vercel (tinham ficado só em Preview/Development — causa
  de o limiter estar inerte). Deploy de produção.
- **Verificado em prod:** burst paralelo → `~60× 200` + resto `429`; o `429` traz
  `retry-after: 60` (= nosso middleware); pedido único após a janela → `200` (utilizador
  real não é afetado). **Funciona.**

Operação documentada em [operacoes.md](operacoes.md#segurança--anti-scraping-e-utilizadores).

---

## 4. Investigar utilizador suspeito (`27a9e2d`)

`scripts/inspect-user.mjs <email>` — relatório **read-only**: identidade, `page_visits`,
favoritos/push, heurística humano-vs-bot. Aceita `SUPABASE_SERVICE_ROLE_KEY` ou
`VERCEL_SERVICE_ROLE`. O IP **não** está na BD — ver logs da Vercel.

Caso real: o utilizador «bot bot» (`botebotas23@gmail.com`) era **humano** (login Google,
2 páginas, 1 sessão, ~40s, 0 ativações). Risco zero. O risco de scraping vem de
**anónimos disfarçados** — a camada 3 acima.

---

## Pendências / próximos passos

**Segurança (opcional):**
- [ ] Ativar **Vercel Firewall / bot protection** no painel — 4.ª camada (comportamento/IP),
      complementar ao rate limiting. ~2 min, sem código.

**Growth / SEO (da análise desta sessão — alta prioridade, janela curta até 19 jul):**
- [ ] **Submeter sitemap no Search Console** + pedir indexação (Quick Win nº1).
- [ ] **Páginas por jogo** `/jogo/[fixture_id]` («X vs Y — onde ver, hora PT, canal») +
      JSON-LD `SportsEvent` — motor de cauda longa e de receita de afiliados.
- [ ] Páginas por equipa `/equipa/[slug]`; mais inventário de ads; 1 afiliado apostas PT.
- [ ] Plano de transição pós-Mundial (conteúdo evergreen «onde ver futebol na TV PT»).

**Fase final / i18n:**
- [ ] Localizar rótulos de seed do bracket (`1.º Gr. X`) nos 10 idiomas.
- [ ] `hreflang` + rotas `/[lang]/` (trabalho maior, só PT/BR justificam a curto prazo).

---

## Verificação rápida

```bash
npm test                       # 34/34 (suite do bracket)
npm run build                  # build limpo

# Rate limiting em prod (UA de browser — curl puro leva 403 do bloqueio de bots):
UA="Mozilla/5.0 ... Chrome/126 ..."
seq 1 90 | xargs -P 30 -I{} curl -s -A "$UA" -o /dev/null \
  -w "%{http_code}\n" "https://wc26.pt/?b={}" | sort | uniq -c
# esperado: ~60× 200 + resto 429

# Investigar utilizador:
node scripts/inspect-user.mjs <email>
```

---

## Ficheiros novos (esta sessão)

```
src/lib/rate-limit.ts
src/app/opengraph-image.tsx
src/app/twitter-image.tsx
scripts/inspect-user.mjs
scripts/test-support/ts-alias-loader.mjs
tests/helpers.mjs
tests/knockout-annex-c.test.mjs
tests/knockout-qualification.test.mjs
tests/knockout-fifa-order.test.mjs
tests/knockout-bracket-topology.test.mjs
docs/testes-fase-final.md
docs/sessao-handoff-2026-06-25.md   (este ficheiro)
```
