# Arquitectura — Cucos World Cup 2026

Última actualização: 2026-06-13.

## Visão geral

Aplicação mobile-first em Next.js 15 com dados de jogos sincronizados da API-Football e canais de TV portugueses curados manualmente em Supabase.

```mermaid
flowchart LR
    User[Utilizador] --> NextJS[Next.js Vercel]
    NextJS --> Supabase[(Supabase)]
    Cron[Vercel Cron] --> SyncAPI[/api/sync]
    SyncAPI --> APIFootball[API-Football]
    SyncAPI --> Supabase
    NextJS --> PushAPI[/api/push]
    PushAPI --> WebPush[Web Push]
```

## Camadas

| Camada | Tecnologia | Responsabilidade |
|--------|------------|------------------|
| UI | Next.js App Router | Homepage, grupos, eliminatórias, conta |
| API | Route Handlers | Sync, push, auth callback |
| Dados | Supabase PostgreSQL | Jogos, broadcasts, utilizadores |
| Auth | Supabase Auth | Google + Apple OAuth |
| Sync | Vercel Cron | Actualização de fixtures e scores |
| Notificações | web-push + Service Worker | Alertas 24h/1h/15m/kickoff/final |

## Modelo de dados

- `matches` — jogos com status, scores, minuto
- `broadcasts` — canais TV por `fixture_id`
- `profiles` — perfil do utilizador
- `favourite_teams` — equipas favoritas
- `notification_prefs` — preferências de alerta
- `push_subscriptions` — endpoints Web Push
- `notification_log` — deduplicação de envios

## Timezone

Todas as horas apresentadas ao utilizador usam `Europe/Lisbon`.

## Segurança

- RLS activo em todas as tabelas de utilizador
- `matches` e `broadcasts` são públicos (read-only)
- Cron protegido com `CRON_SECRET`

## Deploy

Vercel com auto-deploy a partir de `main`. Ver `vercel.json` para crons.
