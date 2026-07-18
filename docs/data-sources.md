# Fontes de dados

Última actualização: 2026-06-21.

## API-Football

- **Base URL:** `https://v3.football.api-sports.io`
- **Liga:** `league=1` (FIFA World Cup)
- **Época:** `season=2026`

### Endpoints usados

| Endpoint | Uso |
|----------|-----|
| `GET /fixtures?league=1&season=2026` | Calendário completo |
| `GET /fixtures?live=all` | Jogos ao vivo |
| `GET /fixtures?ids=id1-id2-…` | Batch até 20 — scores + **events** (marcadores) |
| `GET /players/topscorers?league=1&season=2026` | Melhores marcadores (homepage); ordenação FIFA: golos → AS → minutos |
| `GET /standings?league=1&season=2026` | Mapa **equipa → grupo** (48 equipas); fallback de leitura em `/grupos` |
| `GET /fixtures/rounds?league=1&season=2026` | Rondas eliminatórias |

### Frequência de sync

| Quando | Como |
|--------|------|
| 05:00 UTC | Vercel cron → `/api/sync/schedule` (agenda QStash) |
| 06:00 UTC | Vercel cron → `/api/sync` (full + agenda) |
| 07:00 UTC | Vercel cron → `/api/sync-broadcasts` |
| Durante jogos | QStash → `/api/sync/live` (~5 min por jogo) |
| Homepage | `router.refresh()` 30s/90s (lê Supabase) |
| `/grupos` | ISR 60s; pontos calculados dos jogos `finished` na BD |

Detalhes: [operacoes.md](operacoes.md), [sessao-handoff-jun-2026.md](sessao-handoff-jun-2026.md).

### Classificações de grupo (`/grupos`)

**Não** usamos os pontos do endpoint `/standings` directamente — a API atrasa-se face aos fixtures (ex.: Alemanha P=1 enquanto o 2.º jogo já tinha terminado).

| Dado | Fonte |
|------|--------|
| Resultados (score, status) | Tabela `matches` (sync live/full) |
| Equipa pertence a que grupo | `buildTeamGroupMap()` ← `/standings` |
| P, W, D, L, GD, Pts | `computeStandingsFromMatches()` em `src/lib/standings.ts` |
| Cache | Tabela `group_standings` (migration `013`) |

**Armadilha API:** nos fixtures, `league.round` vem como `"Group Stage - 1"` (jornada), **não** `"Group E"`. Por isso `group_name` fica NULL na BD e é preciso o mapa equipa→grupo.

**Atribuição equipa→grupo:** estática durante o torneio (48 equipas); pontos derivam sempre dos jogos terminados na BD.

### Plano API

- **Free:** só épocas 2022–2024 — não serve para WC26
- **Pro ($19/mês):** necessário para `season=2026`

## Canais TV

**Fonte principal:** [OndeBola.com](https://ondebola.com/) — scrape HTML (port do Leopardo).

- Módulo: `src/lib/ondebola.ts`
- Sync: `GET /api/sync-broadcasts` (cron diário 07:00 UTC)
- Match fuzzy: equipas + hora ±90 min (como Leopardo `canal_para_jogo`)
- Nomes literais do scrape (ex. `Sport.Tv1`, `Sport.TV5`) — **não normalizados**
- **Merge no sync:** canais OndeBola + presets manuais já activados (`mergeBroadcastChannels` em `src/lib/channels.ts`)
- **Curadoria manual:** `/admin` — listas PT, UK, USA, Qatar (`PT_CHANNELS`, etc.)

Fontes de referência adicionais:
- Comunicados RTP / Sport TV / SIC
- Guia oficial FIFA de broadcasters
- Imprensa desportiva portuguesa

## Bandeiras

**Equipas:** pacote [`circle-flags`](https://github.com/HatScripts/circle-flags) — SVGs em `public/flags/` (sync no `postinstall`/`build`). Mapa nome → código ISO em `src/lib/team-flag-codes.ts`.

**Logos API-Football:** já não usados nos cartões de jogo (substituídos por bandeiras circulares).
