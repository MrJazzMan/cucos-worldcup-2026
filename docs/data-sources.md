# Fontes de dados

Última actualização: 2026-06-13.

## API-Football

- **Base URL:** `https://v3.football.api-sports.io`
- **Liga:** `league=1` (FIFA World Cup)
- **Época:** `season=2026`

### Endpoints usados

| Endpoint | Uso |
|----------|-----|
| `GET /fixtures?league=1&season=2026` | Calendário completo |
| `GET /fixtures?live=all` | Jogos ao vivo |
| `GET /standings?league=1&season=2026` | Classificações de grupo |
| `GET /fixtures/rounds?league=1&season=2026` | Rondas eliminatórias |

### Frequência de sync

- Cron Vercel: 06:00 UTC (`/api/sync`), 07:00 UTC (`/api/sync-broadcasts`)
- Durante o torneio: sync manual via `curl` recomendado (ver [operacoes.md](operacoes.md))

### Plano API

- **Free:** só épocas 2022–2024 — não serve para WC26
- **Pro ($19/mês):** necessário para `season=2026`

## Canais TV Portugal

**Fonte principal:** [OndeBola.com](https://ondebola.com/) — scrape HTML (port do Leopardo).

- Módulo: `src/lib/ondebola.ts`
- Sync: `GET /api/sync-broadcasts` (cron diário 07:00 UTC)
- Match fuzzy: equipas + hora ±90 min (como Leopardo `canal_para_jogo`)
- Fallback manual: `/admin` (RTP1, SIC, TVI, Sport TV, DAZN, **LV** YouTube, etc.)

Fontes de referência adicionais:
- Comunicados RTP / Sport TV / SIC
- Guia oficial FIFA de broadcasters
- Imprensa desportiva portuguesa

## Bandeiras e logos

Logos de equipas via `media.api-sports.io` (API-Football), com cache via `next/image`.
