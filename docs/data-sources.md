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
| `GET /standings?league=1&season=2026` | Classificações de grupo |
| `GET /fixtures/rounds?league=1&season=2026` | Rondas eliminatórias |

### Frequência de sync

| Quando | Como |
|--------|------|
| 05:00 UTC | Vercel cron → `/api/sync/schedule` (agenda QStash) |
| 06:00 UTC | Vercel cron → `/api/sync` (full + agenda) |
| 07:00 UTC | Vercel cron → `/api/sync-broadcasts` |
| Durante jogos | QStash → `/api/sync/live` (~5 min por jogo) |
| Homepage | `router.refresh()` 30s/90s (lê Supabase) |

Detalhes: [operacoes.md](operacoes.md), [sessao-handoff-jun-2026.md](sessao-handoff-jun-2026.md).

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
