# Handoff de sessão — Junho 2026

Documento para retomar trabalho noutra sessão. **Última actualização:** 2026-06-21.  
**Commit mais recente:** `b9a813a` — `fix(groups): map teams to groups when API round lacks group letter`

---

## Estado em produção (https://wc26.pt)

| Área | Estado |
|------|--------|
| **Sync live** | Upstash QStash — polling por jogo (kickoff−15 … +125 min, cada 5 min) |
| **Marcadores** | Golos ao vivo/terminados sob cada equipa (`goal_events` na BD) |
| **Classificações `/grupos`** | Calculadas a partir dos resultados `finished` na BD; actualizadas em cada sync live/full |
| **Homepage refresh** | 30s se há jogos live hoje; 90s caso contrário |
| **Novidades (UI)** | Painel até fechar; mostra `v0.5.0 · 2026-06-22` (`WhatsNewBanner`) |
| **Perfil** | Gravar nome/local via `PATCH /api/profile` (service role) |
| **Calendário iCal** | Menu → **Calendário** (login); token gerado via `GET /api/profile/calendar` |
| **Tipografia** | Marcadores + local/estádio em `text-sm` nos cards |
| **Versão app** | `0.5.0` (`package.json`) |

**Validado em prod (2026-06-21):**
- Perfil Miguel com `location = Lisboa` e `calendar_token` preenchido.
- **Grupo E:** Alemanha P=2, 6 pts (2 vitórias) — classificações reflectem jogos terminados na BD.

---

## Classificações de grupo — o que foi corrigido (Jun 2026)

### Problema original
- Jogo da Alemanha terminava mas `/grupos` não actualizava (continuava P=1).
- A página lia `/standings` da API-Football com cache ISR 5 min — **desactualizado** face aos fixtures.
- O sync live actualizava jogos e marcadores mas **não tocava nas classificações**.

### Armadilhas encontradas (iterações até `b9a813a`)

| # | Sintoma | Causa | Fix (commit) |
|---|---------|-------|--------------|
| 1 | Grupos nunca actualizavam após jogos | Sync não incluía standings | `664f829` — sync standings no live/full |
| 2 | `standingsSynced: 0` no live | Só sync se batch tinha jogos `finished` de grupo | `718ff96` — sempre sync standings |
| 3 | `standingsSynced: 12` → `0` em segundos | `purgeNonWorldCupMatches` no live apagava calendário se API devolvia poucos fixtures | `38a01b1` — purge só no sync full + guard mín. 40 fixtures |
| 4 | `standingsSynced: 0` com 72 jogos synced | Copiámos `/standings` da API (Alemanha ainda P=1 lá) | `41f8a6d` — calcular pontos dos jogos na BD |
| 5 | `standingsSynced: 0`, `standingsGroupMatches: 0` | API fixtures usa `round: "Group Stage - 1"` **sem letra** → `group_name` NULL na BD | `b9a813a` — mapa equipa→grupo via `/standings`, pontos dos resultados |

### Solução final (como funciona)

```
Sync live/full
    ↓
matches (scores, status finished) — fonte de verdade para P/W/D/L/Pts
    ↓
buildTeamGroupMap() ← GET /standings (só equipa→grupo, estático)
    ↓
computeStandingsFromMatches() — agrega por grupo, ordena Pts/GD/GF
    ↓
upsert group_standings + revalidatePath('/grupos')
    ↓
/grupos lê getComputedGroupStandings() (BD matches + mapa equipas)
```

**Dois papéis para `/standings` da API:**
- **Pontos/jogos:** calculados localmente a partir de `matches` (fiável, actualiza com sync).
- **Atribuição equipa→grupo:** lido de `/standings` porque `league.round` nos fixtures é `"Group Stage - 1"` e não `"Group E"`.

**Desempate:** Pts → GD → GF → nome (FIFA completo com H2H fica para iter. futura se necessário).

### Resposta esperada do sync

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://wc26.pt/api/sync
```

```json
{
  "ok": true,
  "synced": 72,
  "goalsSynced": 48,
  "standingsSynced": 12,
  "standingsGroupMatches": 72,
  "standingsTeamsMapped": 48,
  "source": "api-football"
}
```

| Campo | Esperado | Se errado |
|-------|----------|-----------|
| `standingsSynced` | 12 | 0 → ver `standingsGroupMatches` e `standingsTeamsMapped` |
| `standingsGroupMatches` | ~72 (fase grupos) | 0 → calendário apagado; correr `/api/sync` full |
| `standingsTeamsMapped` | 48 | 0 → `/standings` falhou (rate limit); retry |
| `standingsError` | ausente | mensagem de erro no upsert ou BD |

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
Vercel Cron 06:00  →  GET /api/sync (full + schedule + standings + purge)
        ↓
Upstash QStash  →  POST /api/sync/live (assinatura)
        ↓
syncMatches("live") + goal events + standings  →  Supabase
        ↓
Visitantes (router.refresh 30s/90s; /grupos ISR 60s)
```

Sync **não é por utilizador** — um ping actualiza a BD para todos.

**Importante:** `purgeNonWorldCupMatches` corre **apenas** no sync full (`/api/sync`), não no live.

---

## Ficheiros-chave

| Ficheiro | Função |
|----------|--------|
| `src/lib/standings.ts` | Mapa equipa→grupo, cálculo Pts, sync/cache `group_standings` |
| `src/lib/sync.ts` | Sync fixtures + goals + standings; purge só em full |
| `src/lib/matches.ts` | `getGroupStandings()` — computed → cache → API fallback |
| `src/app/grupos/page.tsx` | UI classificações (`revalidate = 60`) |
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
| `013_group_standings.sql` | Cache classificações (`group_name`, `rows` JSONB) — **obrigatório para /grupos** |

Verificar perfil:

```sql
SELECT user_id, display_name, location, calendar_token IS NOT NULL AS has_calendar
FROM profiles
WHERE user_id = auth.uid();
```

Verificar classificações:

```sql
SELECT group_name, updated_at, jsonb_array_length(rows) AS teams
FROM group_standings
ORDER BY group_name;
```

---

## Variáveis Vercel (Production)

| Variável | Obrigatório | Notas |
|----------|-------------|-------|
| `SUPABASE_SERVICE_ROLE_KEY` | Sim | Perfil, calendário, sync, push, standings |
| `NEXT_PUBLIC_SUPABASE_URL` | Sim | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sim | |
| `API_FOOTBALL_KEY` | Sim | Fixtures + mapa equipa→grupo |
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
# Sync completo (calendário + standings + purge + agenda QStash)
curl -H "Authorization: Bearer $CRON_SECRET" https://wc26.pt/api/sync

# Sync live manual (scores, marcadores, standings — sem purge)
curl -H "Authorization: Bearer $CRON_SECRET" https://wc26.pt/api/sync/live

# Perfil/calendário — requer sessão browser (cookies); sem auth → 401
# Testar no DevTools → Network ao abrir Perfil / Calendário
```

**GitHub Actions** `.github/workflows/live-sync.yml` — só `workflow_dispatch` (emergência).

**Alias útil (macOS/zsh):** `timestamp` → `date "+%Y-%m-%d %H:%M:%S"` (em `~/.zshrc`).

---

## Novidades (WhatsNew)

- Versão painel: `WHATS_NEW_RELEASE` + `WHATS_NEW_DATE` em `src/lib/whats-new.ts`
- Chave localStorage: `wc26-whats-new-seen` = `WHATS_NEW_VERSION`
- Para mostrar outra vez: bump `WHATS_NEW_VERSION` (e opcionalmente release/date)
- **Sugestão:** bump quando comunicar classificações ao vivo em `/grupos`

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
| **Grupos desactualizados** | Hard refresh; `/api/sync/live`; confirmar jogo `finished` na BD |
| **`standingsSynced: 0`** | Ver `standingsGroupMatches` / `standingsTeamsMapped` na resposta JSON |
| **`standingsTeamsMapped: 0`** | Rate limit `/standings`; retry; plano Pro API |
| **Calendário de jogos quase vazio** | Correr `/api/sync` full (live sync antigo + purge agressivo) |
| **Alemanha (ou outra) P errado** | Verificar `home_score`/`status` do fixture; pontos vêm da BD, não de `/standings` |

---

## Histórico commits relevantes (Jun 2026)

| Commit | Resumo |
|--------|--------|
| `b9a813a` | Mapa equipa→grupo via `/standings`; pontos calculados dos jogos |
| `38a01b1` | Purge só no sync full; guard contra API vazia |
| `41f8a6d` | Classificações calculadas a partir de `matches`, não copiadas da API |
| `718ff96` | Standings em todo sync live |
| `664f829` | Sync standings + migration 013 + cache `group_standings` |
| `872a326` | Perfil load + calendário: auth robusta, admin client, migration 012 |
| `54e5c15` | Rotas `/api/profile` e `/api/profile/calendar` |
| `8529827` | QStash live sync, migration 010 |

---

## Próximos passos opcionais

- [ ] Traduções `whatsNew.*` para ES/FR/…
- [ ] Endpoint admin read-only «próximos syncs QStash»
- [ ] Preencher `location` / tokens para utilizadores antigos (backfill opcional)
- [ ] Tag git `v0.5.0` (ou `v0.5.1` com classificações)
- [ ] Bump `WHATS_NEW_VERSION` — classificações actualizadas após cada jogo
- [ ] Desempate FIFA completo (H2H) se empates na classificação forem críticos
- [ ] Persistir mapa equipa→grupo na BD (evitar chamada `/standings` em cada sync)

---

## Workflow acordado

1. Implementar → commit & push → validar em prod.
2. Documentação em `docs/` (não vai para Vercel).
3. Novidades utilizador: bump `WHATS_NEW_VERSION` quando houver features visíveis.
4. Migrations Supabase: correr manualmente no SQL Editor; confirmar na tabela `profiles` / `group_standings`.
