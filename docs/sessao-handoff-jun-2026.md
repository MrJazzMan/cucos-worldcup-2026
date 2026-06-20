# Handoff de sessão — Junho 2026

Documento para retomar trabalho noutra sessão. **Última actualização:** 2026-06-20.  
**Commit mais recente:** `872a326` — `fix(profile): load and calendar via server auth and admin client`

---

## Estado em produção (https://wc26.pt)

| Área | Estado |
|------|--------|
| **Sync live** | Upstash QStash — polling por jogo (kickoff−15 … +125 min, cada 5 min) |
| **Marcadores** | Golos ao vivo/terminados sob cada equipa (`goal_events` na BD) |
| **Homepage refresh** | 30s se há jogos live hoje; 90s caso contrário |
| **Novidades (UI)** | Painel até fechar; mostra `v0.5.0 · 2026-06-22` (`WhatsNewBanner`) |
| **Perfil** | Gravar nome/local via `PATCH /api/profile` (service role) |
| **Calendário iCal** | Menu → **Calendário** (login); token gerado via `GET /api/profile/calendar` |
| **Tipografia** | Marcadores + local/estádio em `text-sm` nos cards |
| **Versão app** | `0.5.0` (`package.json`) |

**Validado em prod (2026-06-20):** perfil Miguel com `location = Lisboa` e `calendar_token` preenchido na tabela `profiles`.

---

## Perfil e calendário — o que foi corrigido

### Problema original
- Gravar perfil no browser falhava (RLS bloqueava upsert client-side).
- Calendário: «Could not load calendar link» — `calendar_token` NULL na BD.
- Leitura do perfil no browser devolvia vazio (RLS / política admin recursiva).
- Mobile mostrava valores na sessão mas não persistiam na BD.

### Solução (commits `54e5c15`, `872a326`)
Rotas API autenticadas com cookies + escrita/leitura via **Supabase service role**:

| Rota | Método | Função |
|------|--------|--------|
| `/api/profile` | GET | Lê `display_name`, `location` (fallback: nome Google) |
| `/api/profile` | PATCH | Grava nome e local |
| `/api/profile/calendar` | GET | Devolve URLs iCal; cria token se NULL |
| `/api/profile/calendar` | POST | Regenera token |

**Cliente:** `SettingsMenu.tsx` (load + save), `SettingsCalendarFeed.tsx` (calendário).  
**Auth:** `src/lib/supabase/route-auth.ts` — `requireRouteUser()` (`getUser` + fallback `getSession`).

### Menu Perfil (ordem)
Perfil → Calendário → Notificações → Favoritos → Aparência.  
Mobile bottom nav **Perfil** abre directamente o painel perfil (`openTo("profile")`).

---

## Arquitectura sync (QStash)

```
Vercel Cron 05:00  →  GET /api/sync/schedule
Vercel Cron 06:00  →  GET /api/sync (full + schedule)
        ↓
Upstash QStash  →  POST /api/sync/live (assinatura)
        ↓
syncMatches("live") + syncGoalEventsForFixtures  →  Supabase
        ↓
Visitantes (router.refresh 30s/90s)
```

Sync **não é por utilizador** — um ping actualiza a BD para todos.

---

## Ficheiros-chave

| Ficheiro | Função |
|----------|--------|
| `src/app/api/profile/route.ts` | GET/PATCH perfil |
| `src/app/api/profile/calendar/route.ts` | GET/POST token iCal |
| `src/lib/supabase/route-auth.ts` | Sessão nas rotas API |
| `src/lib/supabase/admin.ts` | Cliente service role |
| `src/components/SettingsMenu.tsx` | UI perfil + menu |
| `src/components/settings/SettingsCalendarFeed.tsx` | UI calendário |
| `src/components/WhatsNewBanner.tsx` | Painel novidades |
| `src/lib/whats-new.ts` | `WHATS_NEW_VERSION`, `WHATS_NEW_RELEASE`, `WHATS_NEW_DATE` |
| `src/lib/live-sync-schedule.ts` | Slots QStash + dedupe |
| `src/app/api/sync/live/route.ts` | Callback QStash |
| `vercel.json` | Crons 05:00 schedule, 06:00 sync, 07:00 broadcasts |

---

## Migrations Supabase (correr se ainda não)

| Ficheiro | O quê |
|----------|--------|
| `007_finished_utc.sql` | Estimativa fim (sync only) |
| `008_calendar_token.sql` | Coluna `calendar_token` UNIQUE em `profiles` — **obrigatório para calendário** |
| `009_goal_events.sql` | JSONB marcadores |
| `010_live_sync_slots.sql` | Dedupe QStash (RLS on, sem políticas públicas) |
| `011_profiles_insert_own.sql` | RLS INSERT próprio perfil (backup; API usa service role) |
| `012_profiles_rls_admin.sql` | Função `is_site_admin()` — evita recursão RLS na política admin |

Verificar estado:

```sql
SELECT user_id, display_name, location, calendar_token IS NOT NULL AS has_calendar
FROM profiles
WHERE user_id = auth.uid();  -- ou filtrar pelo teu UUID
```

---

## Variáveis Vercel (Production)

| Variável | Obrigatório | Notas |
|----------|-------------|-------|
| `SUPABASE_SERVICE_ROLE_KEY` | Sim | Perfil, calendário, sync, push |
| `NEXT_PUBLIC_SUPABASE_URL` | Sim | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sim | |
| `QSTASH_*` + `SITE_URL` | Sim | Sync live |
| `CRON_SECRET` | Sim | Crons + testes manuais |

Ver [operacoes.md](operacoes.md) e [deploy.md](deploy.md).

---

## Cloudflare (wc26.pt)

**Configuration rule** no domínio:

- **When:** URI Path `/api/sync/live*`
- **Then:** Browser Integrity Check → Off

Sem isto, QStash pode receber **403**.

---

## Comandos operacionais

```bash
# Sync completo + agenda slots
curl -H "Authorization: Bearer $CRON_SECRET" https://wc26.pt/api/sync

# Sync live manual
curl -H "Authorization: Bearer $CRON_SECRET" https://wc26.pt/api/sync/live

# Perfil/calendário — requer sessão browser (cookies); sem auth → 401
# Testar no DevTools → Network ao abrir Perfil / Calendário
```

**GitHub Actions** `.github/workflows/live-sync.yml` — só `workflow_dispatch` (emergência).

---

## Novidades (WhatsNew)

- Versão painel: `WHATS_NEW_RELEASE` + `WHATS_NEW_DATE` em `src/lib/whats-new.ts`
- Chave localStorage: `wc26-whats-new-seen` = `WHATS_NEW_VERSION`
- Para mostrar outra vez: bump `WHATS_NEW_VERSION` (e opcionalmente release/date)

---

## Troubleshooting

| Sintoma | Acção |
|---------|--------|
| «Could not save» no perfil | Confirmar `SUPABASE_SERVICE_ROLE_KEY` no Vercel; logs `/api/profile` |
| «Could not load calendar link» | Migration `008`; logs `/api/profile/calendar`; token NULL → GET deve criar |
| Perfil vazio no desktop | Hard refresh; abrir Perfil (recarrega via GET `/api/profile`) |
| QStash 403 | Regra Cloudflare `/api/sync/live` |
| Marcadores vazios | `/api/sync` full; rate limit API-Football |
| Painel novidades outra vez | Bump `WHATS_NEW_VERSION` |

---

## Histórico commits relevantes (Jun 2026)

| Commit | Resumo |
|--------|--------|
| `872a326` | Perfil load + calendário: auth robusta, admin client, migration 012 |
| `54e5c15` | Rotas `/api/profile` e `/api/profile/calendar` |
| `f046303` | Menu mobile Perfil, upsert perfil, migration 011 |
| `0254042` | WhatsNew copy, calendário no menu |
| `64d84ed` | WhatsNew banner, tipografia cards |
| `8529827` | QStash live sync, migration 010 |

---

## Próximos passos opcionais

- [ ] Traduções `whatsNew.*` para ES/FR/…
- [ ] Endpoint admin read-only «próximos syncs QStash»
- [ ] Preencher `location` / tokens para utilizadores antigos (backfill opcional)
- [ ] Tag git `v0.5.0`

---

## Workflow acordado

1. Implementar → commit & push → validar em prod.
2. Documentação em `docs/` (não vai para Vercel).
3. Novidades utilizador: bump `WHATS_NEW_VERSION` quando houver features visíveis.
4. Migrations Supabase: correr manualmente no SQL Editor; confirmar na tabela `profiles`.
