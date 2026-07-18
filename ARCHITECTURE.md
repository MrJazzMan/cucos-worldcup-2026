# Arquitectura — Cucos World Cup 2026

Última actualização: 2026-06-23.

## Visão geral

Aplicação mobile-first em Next.js 15 (App Router) com dados de jogos sincronizados da API-Football e canais de TV curados em Supabase (OndeBola + admin). Deploy automático na Vercel.

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
| UI | Next.js App Router | Homepage, grupos, fase final, perfil (menu) |
| API | Route Handlers | Sync, push, auth callback, admin broadcasts |
| Dados | Supabase PostgreSQL | Jogos, broadcasts, utilizadores, roles |
| Auth | Supabase Auth | Google OAuth (opcional — favoritos, push) |
| Sync | Vercel Cron | Actualização de fixtures e scores |
| Notificações | web-push + Service Worker | Alertas 24h/1h/15m/kickoff/final |
| Analytics | Vercel Analytics + Speed Insights | Pageviews, Web Vitals |

## Modelo de dados

- `matches` — jogos com status, scores, minuto, venue, round
- `broadcasts` — canais TV por `fixture_id` (leitura pública)
- `profiles` — perfil do utilizador (display_name, location, role, avatar_url)
- `favourite_teams` — equipas favoritas por utilizador
- `notification_prefs` — preferências de alerta
- `push_subscriptions` — endpoints Web Push
- `notification_log` — deduplicação de envios

## Páginas

| Rota | Acesso | Descrição |
|------|--------|-----------|
| `/` | Público | Jogos por dia ou dia de torneio, pesquisa equipa, melhores marcadores, destaque, grelha |
| `/grupos` | Público | Classificações dos grupos (tabelas alinhadas) |
| `/fasefinal` | Público | Chave eliminatória — bracket simétrico desktop, colunas mobile |
| `/eliminatorias` | Redirect | → `/fasefinal` (legado) |
| `/conta` | Redirect | → `/` (conta no menu Perfil) |
| `/admin` | Admin only | Curadoria de canais TV por jogo |
| `/privacidade` | Público | Política de privacidade |
| `/feed/{token}` | Secreto | RSS (env `RSS_FEED_TOKEN`) |

## Modelo de acesso

```
Visitante anónimo  → jogos, grupos, fase final, canais TV (read-only)
Utilizador logado  → + favoritos (estrela nos cards), notificações, perfil
Admin              → /admin
```

Canais e jogos são SSR públicos (SEO). Favoritos exigem Supabase Auth.

## Componentes principais

| Componente | Função |
|------------|--------|
| `MatchesView` | Barra de dias (torneio ou calendário), pesquisa equipa, destaque, grelha, classificações do dia, melhores marcadores |
| `TeamSearch` | Autocomplete equipas, filtro `?team=` |
| `TopScorers` | Melhores marcadores (goal_events) |
| `DayStandings` | Classificações dos grupos com jogos no dia activo |
| `MatchCard` | Cartão grelha — hover desktop, estrela, pulso live |
| `FeaturedMatch` | Jogo em destaque full-width (não hover) |
| `MatchFavouriteToggle` | Estrela favoritos + pop animação |
| `LivePulseDot` | Ponto + anel ao vivo |
| `KnockoutBracket` | Wrapper mobile (colunas) + desktop (árvore) |
| `KnockoutBracketDesktop` | Chave simétrica lg+ com conectores |
| `BracketSlotCard` | Slot de jogo na chave (match / preview / TBD) |
| `BottomNav` | Navegação mobile (< sm) |
| `AppChrome` | Header + children + BottomNav + SettingsMenuProvider |
| `AppHeader` | Nav desktop: Jogos, Grupos, Fase final (`/fasefinal`) |
| `SettingsMenu` | Perfil, favoritos, notificações, admin, login |

## Fase final — dados e layout

- **`buildKnockoutColumns()`** — agrupa jogos KO, gera previews com qualificação + 3.ºs, ordena jogos reais por slot FIFA.
- **`KNOCKOUT_SKELETON`** — placeholders M73–M104 (ordem oficial FIFA).
- **`knockout-fifa-order.ts`** — números FIFA M73–M104, `fifaSlotLocation()` e `SIDE_TREE_SPEC` (árvore declarativa da chave por metade).
- **`orderMatchesInFifaSlots()`** — associa jogos da BD ao índice correcto (equipas vs preview).
- **`third-place.ts` + `knockout-annex-c.ts`** — 8 melhores 3.ºs + Annex C (495 combinações).
- **`knockout-qualification.ts`** — resolve `1A`/`2B`/`3º`; locks matemáticos 1.º/2.º.
- **`buildSideTree()`** — walk recursivo sobre `SIDE_TREE_SPEC` (coberto por testes de coerência).
- Desktop: `lg` breakpoint; mobile: scroll horizontal por ronda.

Ficheiros: `src/lib/knockout-bracket.ts`, `knockout-bracket-tree.ts`, `knockout-fifa-order.ts`, `third-place.ts`, `knockout-annex-c.ts`, `knockout-qualification.ts`, `knockout-slot-labels.ts`, `src/components/knockout/*`.

Handoff detalhado: [docs/sessao-handoff-2026-06-23.md](docs/sessao-handoff-2026-06-23.md).

## Homepage — calendário e marcadores

- **`tournament-days.ts`** — dias do torneio (cutoff 06:00); chaves `td-N` vs `YYYY-MM-DD`.
- **`top-scorers.ts`** — `aggregateTopScorers()` a partir de `goal_events` (exclui autogolos, penáltis falhados e marcas da disputa de penáltis; empates partilham posição).
- Pesquisa equipa: `TeamSearch` + `getAllTeams()`; URL `?team=` e `?view=calendar`.

## Internacionalização (i18n)

12 locales em `src/lib/i18n/locales/`. Chaves recentes: `search.*`, `matches.view.*`, `topScorers.*`, `knockouts.*`, `matches.tournamentDay*`.

## Animações (`globals.css`)

CSS puro; bloco único `@media (prefers-reduced-motion: reduce)` desactiva movimento mantendo estados (estrela cheia, badge live, etc.).

| Animação | Classe | Duração |
|----------|--------|---------|
| Pop favorito | `.favourite-star-pop` | 280ms |
| Hover card | `.match-card` | 200ms (só hover fine pointer) |
| Pulso live | `.live-pulse__ring` | 1.4s loop |

**Pendente:** indicador dia deslizante; entrada stagger dos cards ao mudar dia.

## Segurança

- RLS em tabelas de utilizador; `matches` + `broadcasts` SELECT público
- Middleware: OAuth callback, anti-bot UA, security headers
- Cron/admin: `CRON_SECRET`

## Deploy

Vercel auto-deploy `main`. Crons em `vercel.json`.

## Variáveis de ambiente

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
API_FOOTBALL_KEY
CRON_SECRET
RSS_FEED_TOKEN
NEXT_PUBLIC_VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY
VAPID_SUBJECT
NEXT_PUBLIC_SITE_URL
```

**Obsoleto:** `NEXT_PUBLIC_SHOW_KNOCKOUTS` — remover da Vercel se ainda existir.

Ver também: [docs/sessao-handoff-jun-2026.md](docs/sessao-handoff-jun-2026.md).
