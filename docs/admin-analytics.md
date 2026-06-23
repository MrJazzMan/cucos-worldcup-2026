# Admin — Métricas internas (wc26.pt)

Dashboard privado para o administrador do site perceber a saúde do produto em menos de 30 segundos.

**URL:** https://wc26.pt/admin/analytics  
**Acesso:** apenas o utilizador definido em `src/lib/admin.ts` (`SITE_ADMIN_USER_ID`), validado em `src/app/admin/layout.tsx`.

## O que mostra

### KPIs (cards)

| Métrica | Fonte |
|---------|--------|
| Total utilizadores | `COUNT(*)` em `profiles` |
| Utilizadores activos | `COUNT(last_seen_at)` em `profiles` |
| Sessões hoje | `COUNT(DISTINCT session_id)` em `page_visits` (desde meia-noite Lisboa) |
| Page views hoje | `COUNT(*)` em `page_visits` (desde meia-noite Lisboa) |

### Gráficos (últimos 30 dias)

Três gráficos de linha (SVG + Tailwind, sem dependências extra):

1. Registos por dia — `profiles.created_at`
2. Sessões por dia — `page_visits.session_id` distinto por dia
3. Page views por dia — `page_visits` por dia

O eixo temporal usa o fuso **`Europe/Lisbon`**, alinhado com `src/lib/timezone.ts`. Dias sem actividade aparecem com valor 0 (`generate_series` no SQL).

### Tabelas

- **Top 20 páginas** — `page_visits.page`, ordenado por visitas
- **Últimos utilizadores** — `display_name`, `email`, `created_at` de `profiles`

## Arquitectura

```
/admin/analytics (client)
       │
       ▼
GET /api/admin/analytics  ← requireAdminOrCron
       │
       ▼
Supabase RPC get_admin_analytics(today_start)
       │
       ▼
JSON { kpis, charts, top_pages, latest_users }
```

### Ficheiros principais

| Ficheiro | Função |
|----------|--------|
| `supabase/migrations/019_get_admin_analytics.sql` | Função RPC consolidada |
| `src/app/api/admin/analytics/route.ts` | API protegida |
| `src/lib/admin-analytics.ts` | Tipos + cálculo do início do dia (Lisboa) |
| `src/app/admin/analytics/page.tsx` | UI do dashboard |
| `src/components/admin/LineChart.tsx` | Gráfico SVG responsivo |
| `src/components/admin/AdminNav.tsx` | Navegação Canais / Métricas |

### Recolha de analytics (inalterada)

As visitas continuam a ser registadas pelo `PageVisitTracker` em `src/components/PageVisitTracker.tsx`, que chama `trackPageVisit()` em `src/lib/page-visits.ts` (insert em `page_visits` com `session_id` em `sessionStorage`).

Este dashboard **só lê** dados; não altera a recolha existente.

## Segurança

- Layout `/admin/*` redirecciona não-admins para `/`.
- API usa `requireAdminOrCron` (sessão admin ou `CRON_SECRET`).
- RPC `get_admin_analytics` só é executável por `service_role`; a validação de admin fica na API (não em `auth.uid()` dentro do RPC).
- Resposta com `Cache-Control: no-store`.

## Migração

Aplicar no Supabase (se ainda não estiver em produção):

```bash
# Via CLI local, ou colar o SQL no SQL Editor do dashboard Supabase
supabase db push
```

Ou executar o conteúdo de `019_get_admin_analytics.sql` no projecto `vsbmdqzabegcvjupwcpj`.

## Testar localmente

1. Iniciar sessão com a conta Google do admin.
2. Abrir http://localhost:3000/admin/analytics
3. Verificar KPIs, gráficos (mesmo com zeros) e tabelas.
4. Simular erro: desligar Supabase ou revogar sessão → mensagem de erro + «Tentar outra vez».

## Notas

- **Page views** só existem após deploy da migração `017_page_visits` e do `PageVisitTracker` em produção.
- **Sessões** dependem de `session_id` (`018_page_visits_session_id`); visitas antigas sem `session_id` não contam para sessões distintas.
- Gráficos SVG são leves e compatíveis com React 19 / dark mode (cores via CSS variables `--accent`, `--muted`, etc.).
