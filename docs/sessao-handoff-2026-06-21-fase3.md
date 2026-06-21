# Handoff — Fase 3 (Jun 2026)

Documento para **iniciar novo chat** com contexto completo.  
**Última actualização:** 2026-06-21  
**Commit mais recente:** `0543686` — `fix(privacy): defer GA4 until cookie consent with Consent Mode v2`  
**Produção:** https://wc26.pt · **Repo:** `MrJazzMan/cucos-worldcup-2026` · **Branch:** `main`

---

## Resumo executivo (o que mudou nesta fase)

| Área | Estado |
|------|--------|
| **Segurança** | Auditoria fechada; RLS `profiles.role` corrigido (migration 015+016); admin separado de `CRON_SECRET`; CSP + HSTS |
| **RGPD** | Inventário em `docs/rgpd-inventario-dados.md`; eliminação de conta self-service (`DELETE /api/account`) |
| **Homepage** | «Próximos jogos de Portugal» + «Classificações do dia» (contextual ao dia seleccionado) |
| **Cookies / Analytics** | GA4 **só carrega após aceitar** banner; Consent Mode v2 no `<head>` antes de scripts Google |
| **Documentação viva** | `docs/licoes-aprendidas.md` — registo cumulativo por frente/data |

---

## Produção — validado

- **RLS escalonamento:** `scripts/test-profiles-rls-escalation.mjs` (requer `SUPABASE_SERVICE_ROLE_KEY` local)
- **Eliminação conta:** `DELETE https://wc26.pt/api/account` com Bearer — testado com utilizador temporário
- **GA antes do consentimento:** 0 pedidos `google-analytics.com` / `gtag/js` até aceitar (testado em dev)
- **Classificações dia:** grupos dos jogos do dia + grupo Portugal na fase de grupos

---

## Arquitectura rápida

```
Visitante → Next.js 15 (Vercel) → Supabase (eu-central-1)
                ↓
         API-Football + OndeBola (crons)
                ↓
         QStash → /api/sync/live
```

**Auth:** Google OAuth only (UI). Sessão Supabase (cookies).  
**Admin:** `SITE_ADMIN_USER_ID` hardcoded em `src/lib/admin.ts` — sessão Google, não `CRON_SECRET`.

---

## Homepage (ordem dos módulos)

1. Grelha de dias + jogo em destaque + cards
2. **Próximos jogos de Portugal** — `PortugalUpcomingMatches.tsx`
3. **Classificações do dia** — `DayStandings.tsx` (esconde se sem grupos relevantes)

Lógica grupos do dia: `src/lib/day-standings.ts` → `getDayStandingsGroups()`.

---

## Segurança (migration 015 — crítico)

**Problema:** utilizador autenticado podia `UPDATE profiles SET role = 'admin'` via chave anónima.

**Fix (defesa em profundidade):**
1. `REVOKE UPDATE ON profiles` + `GRANT UPDATE` só colunas seguras
2. Trigger `protect_profile_sensitive_columns` (role, calendar_token)
3. `REVOKE EXECUTE` em funções SECURITY DEFINER

**Armadilha:** `REVOKE UPDATE (role)` **não basta** se existir `GRANT UPDATE` na tabela — revogar UPDATE na tabela inteira e re-conceder coluna a coluna.

Migrations aplicadas manualmente: `015_profiles_lock_sensitive_columns.sql`, `016_calendar_token_created_at.sql`.

---

## RGPD

| Recurso | Onde |
|---------|------|
| Inventário dados | `docs/rgpd-inventario-dados.md` |
| Apagar conta | Menu ☰ → Perfil → zona vermelha «Apagar conta» |
| API | `DELETE /api/account` — sessão servidor; CASCADE em `auth.users` |
| Lições | `docs/licoes-aprendidas.md` |

**CASCADE confirmado:** `profiles`, `favourite_teams`, `notification_prefs`, `push_subscriptions`, `notification_log` → `ON DELETE CASCADE` em `auth.users`.

Conta admin do site **não** pode ser apagada pela UI (403).

---

## Cookies, GA4 e AdSense

| Serviço | Comportamento actual |
|---------|---------------------|
| **Consent Mode v2** | Inline no `<head>` via `CONSENT_MODE_DEFAULT_SCRIPT` (`src/lib/consent.ts`) — tudo `denied` excepto `security_storage` |
| **GA4** | `loadGoogleAnalytics()` só após `consent === 'accepted'` (`GoogleAnalyticsLoader`) |
| **AdSense** | Script no HTML (verificação crawler) com `ad_storage: denied`; unidades só com `adsAllowed` (`AdSenseUnit`) |
| **Aceitar banner** | `gtag('consent', 'update')` sem reload |

**GA ID:** `G-BEVP34KWFW` (`NEXT_PUBLIC_GA_MEASUREMENT_ID`).

**Testar:** janela anónima → DevTools → Rede → sem `google-analytics.com` antes de aceitar; após aceitar, pedidos aparecem.

---

## Ficheiros-chave (sessão recente)

| Ficheiro | Função |
|----------|--------|
| `src/lib/consent.ts` | Consent Mode, `loadGoogleAnalytics`, `updateGoogleConsent` |
| `src/components/GoogleAnalytics.tsx` | `GoogleAnalyticsLoader` (cliente) |
| `src/app/layout.tsx` | Consent script + AdSense head + loaders |
| `src/lib/day-standings.ts` | Grupos a mostrar no resumo do dia |
| `src/components/DayStandings.tsx` | UI classificações do dia |
| `src/components/GroupStandingsTable.tsx` | Tabela `compact` / `full` (partilhada com `/grupos`) |
| `src/app/api/account/route.ts` | Eliminação de conta |
| `src/components/settings/SettingsDeleteAccount.tsx` | UI apagar conta |
| `src/lib/delete-account.ts` | `deleteUserAccount()` |
| `scripts/test-profiles-rls-escalation.mjs` | Prova RLS role |
| `scripts/test-delete-account.mjs` | Teste eliminação (Bearer + localhost/prod) |

---

## Commits recentes (main)

| Commit | Resumo |
|--------|--------|
| `0543686` | GA4 só após consentimento; Consent Mode v2 |
| `c9123d6` | Eliminação de conta RGPD |
| `411728b` | Classificações do dia na homepage |
| `f77f041` | Teste RLS + inventário RGPD + lições aprendidas |
| `4b1adba` | Limites perfil, expiração token iCal, cron timing-safe |
| `7bacdcc` | CSP + Next.js 15.5.19 |
| `d4927eb` | Migration 015 RLS profiles |
| `9f946d9` | Admin sessão, HSTS, sync-profiles restrito |

Histórico classificações/QStash/perfil: ver [sessao-handoff-jun-2026.md](sessao-handoff-jun-2026.md).

---

## Variáveis Vercel (essenciais)

| Variável | Notas |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | |
| `SUPABASE_SERVICE_ROLE_KEY` | Perfil, conta, sync, push — **nunca no cliente** |
| `API_FOOTBALL_KEY` | |
| `CRON_SECRET` | Crons; não no browser |
| `QSTASH_*` + `SITE_URL` | Sync live |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | `G-BEVP34KWFW` |
| `NEXT_PUBLIC_ADSENSE_CLIENT_ID` | Auto ads |

**Local:** `.env.production.local` pode ter `SUPABASE_URL`/`SUPABASE_ANON_KEY` mas `SUPABASE_SERVICE_ROLE_KEY` vazio — scripts de teste precisam da chave do dashboard Supabase.

---

## Comandos úteis

```bash
# Dev
npm run dev

# Build
npm run build

# Sync produção
curl -H "Authorization: Bearer $CRON_SECRET" https://wc26.pt/api/sync

# Teste RLS (service role local)
node scripts/test-profiles-rls-escalation.mjs

# Teste apagar conta (dev server + service role)
node scripts/test-delete-account.mjs
```

---

## Pendências / próximos passos opcionais

- [ ] Alinhar política de privacidade (`privacy-content.ts`) com inventário RGPD (ipapi.co, QStash, Consent Mode actualizado)
- [ ] `localStorage` `cucos-admin-secret` — utilizador deve apagar manualmente no browser se existir de sessão antiga
- [ ] Bump `WHATS_NEW_VERSION` se quiseres anunciar classificações do dia / apagar conta
- [ ] Traduções `deleteAccount.*` / `dayStandings.*` nos 10 idiomas restantes (fallback EN funciona)
- [ ] Desempate FIFA completo (H2H) nas classificações se necessário

---

## Workflow acordado

1. Implementar → commit conventional → push → validar em prod.
2. Entrada em `docs/licoes-aprendidas.md` no fim de trabalho relevante.
3. Migrations Supabase: SQL Editor; idempotentes quando possível.
4. Testes destrutivos/RLS: **só utilizadores temporários** via Admin API ou SQL de teste.
5. Não commitar `.cursor/`.

---

## Prompt sugerido para novo chat

```
Contexto: wc26.pt (Next.js 15 + Supabase + Vercel). Ler docs/sessao-handoff-2026-06-21-fase3.md e docs/licoes-aprendidas.md.

[Tua tarefa aqui]
```
