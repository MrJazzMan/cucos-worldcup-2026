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

- Jogos ao vivo: cada minuto (Vercel Cron)
- Resto: a cada 5 minutos

## Canais TV Portugal

**Fonte principal:** [OndeBola.com](https://ondebola.com/) — scrape HTML (port do Leopardo).

- Módulo: `src/lib/ondebola.ts`
- Sync: `GET /api/sync-broadcasts` (cron diário 07:00 UTC)
- Match fuzzy: equipas + hora ±90 min (como Leopardo `canal_para_jogo`)
- Fallback manual: `/admin` e seed Portugal

Fontes de referência adicionais:
- Comunicados RTP / Sport TV / SIC
- Guia oficial FIFA de broadcasters
- Imprensa desportiva portuguesa

## Bandeiras e logos

Logos de equipas via `media.api-sports.io` (API-Football), com cache via `next/image`.
