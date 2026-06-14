# Arquitectura — Cucos World Cup 2026

Última actualização: 2026-06-14.

## Visão geral

Aplicação mobile-first em Next.js 15 (App Router) com dados de jogos sincronizados da API-Football e canais de TV portugueses curados manualmente em Supabase. Deploy automático na Vercel.

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
| UI | Next.js App Router | Homepage, grupos, eliminatórias, conta, perfil |
| API | Route Handlers | Sync, push, auth callback, admin broadcasts |
| Dados | Supabase PostgreSQL | Jogos, broadcasts, utilizadores, roles |
| Auth | Supabase Auth | Google OAuth |
| Sync | Vercel Cron | Actualização de fixtures e scores |
| Notificações | web-push + Service Worker | Alertas 24h/1h/15m/kickoff/final |
| Analytics | Vercel Analytics + Speed Insights | Pageviews, Web Vitals |

## Modelo de dados

- `matches` — jogos com status, scores, minuto, venue, round
- `broadcasts` — canais TV por `fixture_id`
- `profiles` — perfil do utilizador (display_name, location, role, avatar_url)
- `favourite_teams` — equipas favoritas por utilizador
- `notification_prefs` — preferências de alerta
- `push_subscriptions` — endpoints Web Push
- `notification_log` — deduplicação de envios

### Roles (migration 003 — aplicar no Supabase SQL Editor)

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
  CHECK (role IN ('admin', 'user'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location TEXT;
UPDATE profiles SET role = 'admin' WHERE user_id = '4764a298-fab5-401d-bbbb-3da03c86ce08';
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_admin_select_all" ON profiles FOR SELECT USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'admin')
);
```

## Páginas

| Rota | Acesso | Descrição |
|------|--------|-----------|
| `/` | Público | Jogos por dia — seletor scrollável, filtro favoritos |
| `/grupos` | Público | Classificações dos grupos |
| `/eliminatorias` | Público | Chave das eliminatórias |
| `/conta` | Auth | Conta, perfil (nome, localização), favoritos, notificações |
| `/admin` | Admin only | Curadoria de canais TV por jogo |

## Componentes principais

| Componente | Função |
|------------|--------|
| `MatchCard` | Cartão de jogo com score, equipas, venue, canais, badge ao vivo |
| `MatchesView` | Lista diária com seletor de dias scrollável + filtro "Os meus jogos" |
| `AppHeader` | Cabeçalho sticky com nav, avatar do utilizador e badge Admin |
| `AuthStatus` | Avatar/nome do utilizador logado; badge Admin se role=admin |
| `AccountPanel` | Painel de conta: perfil, favoritos, notificações push |
| `CoffeeBanner` | Banner "Paga-me um café" / "Buy me a coffee" (PT/EN) |
| `TeamFlag` | Bandeira + logo da equipa com fallback |

## Internacionalização (i18n)

Sistema próprio em `src/lib/i18n.ts`. Suporte PT-PT e EN-GB. Língua guardada em `localStorage`. Componente `<T k="chave" />` para traduções em Server e Client Components.

## Timezone

Todas as horas apresentadas ao utilizador usam o fuso do browser (auto-detectado), com fallback para `Europe/Lisbon`.

## Segurança e Anti-scraping

- RLS activo em todas as tabelas de utilizador
- `matches` e `broadcasts` são públicos (read-only)
- Cron e admin protegidos com `CRON_SECRET`
- Middleware bloqueia ~20 User-Agents de IA/scrapers conhecidos (GPTBot, Claude, Diffbot, etc.)
- `robots.txt` desautoriza crawlers de IA e rotas internas (`/api/`, `/admin/`)
- Security headers em todos os responses: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`
- Página principal com `revalidate: 60` — Supabase só é chamado 1× por minuto independentemente do tráfego

## PWA

- `manifest.json` com ícone e cores do tema
- Service Worker (`sw.js`) para cache offline e Web Push
- Instalável em Android e iOS via "Adicionar ao ecrã inicial"

## Analytics e Monetização

- **Vercel Analytics** — pageviews, visitantes, países, dispositivos (sem cookies, GDPR ok)
- **Vercel Speed Insights** — Core Web Vitals por página
- **Buy Me a Coffee** — `buymeacoffee.com/miguelgarcia` (botão PT/EN na homepage)

## Favicon

Ícone ⚽ com gradiente laranja → âmbar (`#f97316` → `#fbbf24`) em formato ICO multi-resolução (16px a 256px). Localizado em `src/app/favicon.ico` (Next.js App Router) e `public/favicon.ico`.

## Paleta de cores

| Token | Light | Dark |
|-------|-------|------|
| background | `#faf6f0` (creme) | `#0e0b08` (castanho escuro) |
| surface | `#ffffff` | `#1b1612` |
| accent | `#ea580c` (laranja) | `#f97316` (laranja) |
| foreground | `#1a1410` | `#faf7f4` |

## Deploy

Vercel com auto-deploy a partir de `main`. Ver `vercel.json` para crons.

```json
{
  "crons": [
    { "path": "/api/sync", "schedule": "0 6 * * *" },
    { "path": "/api/sync-broadcasts?today=1", "schedule": "0 7 * * *" }
  ]
}
```

## Variáveis de ambiente necessárias

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
API_FOOTBALL_KEY
CRON_SECRET
NEXT_PUBLIC_VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY
VAPID_SUBJECT
```
