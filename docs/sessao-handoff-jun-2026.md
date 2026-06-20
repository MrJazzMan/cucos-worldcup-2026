# Handoff de sessão — Junho 2026 (sync live, marcadores, QStash)

Documento para retomar trabalho noutra sessão. **Última actualização:** 2026-06-21.  
**Commit principal:** `8529827` — `feat(sync): schedule live match updates with Upstash QStash`

---

## Estado em produção (https://wc26.pt)

| Área | Estado |
|------|--------|
| **Sync live** | Upstash QStash — polling por jogo (kickoff−15 … +125 min, cada 5 min) |
| **Marcadores** | Golos ao vivo/terminados sob cada equipa (`goal_events` na BD) |
| **Homepage refresh** | 30s se há jogos live hoje; 90s caso contrário |
| **Novidades (UI)** | Painel até fechar; não volta (`WhatsNewBanner`, bump `WHATS_NEW_VERSION`) |
| **Calendário iCal** | Perfil → **Calendário** (login) |
| **Tipografia** | Marcadores + local/estádio em `text-sm` nos cards |

---

## Para o utilizador final (resumo)

1. **Marcadores** — quem marcou e em que minuto (live e final).
2. **Quase tempo real** — durante jogos, resultados actualizam sozinhos (QStash + refresh da página).
3. **Hora de início** nos jogos terminados (não hora de fim).
4. **Calendário** no telemóvel para equipas favoritas (com login).
5. **Texto maior** para marcadores, cidade e estádio.

Painel **Novidades** na homepage: aparece uma vez por browser até clicar «Entendi». Para mostrar de novo, bump `WHATS_NEW_VERSION` em `src/lib/whats-new.ts`.

---

## Arquitectura sync

```
┌─────────────────────────────────────────────────────────────┐
│  Vercel Cron 05:00  →  GET /api/sync/schedule               │
│  Vercel Cron 06:00  →  GET /api/sync (full + schedule)      │
└────────────────────────────┬────────────────────────────────┘
                             │ publica slots (notBefore)
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  Upstash QStash  →  POST /api/sync/live (assinatura)        │
│  ~28 pings/jogo: kickoff−15 … +115 (5 min) + +125 final     │
└────────────────────────────┬────────────────────────────────┘
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  syncMatches("live")  →  API-Football  →  Supabase matches  │
│  syncGoalEventsForFixtures  →  goal_events (batch /ids)     │
└────────────────────────────┬────────────────────────────────┘
                             ▼
                    Visitantes (router.refresh 30s)
```

**Importante:** sync **não é por utilizador** — um ping QStash actualiza a BD para todos.

---

## Ficheiros-chave

| Ficheiro | Função |
|----------|--------|
| `src/lib/live-sync-schedule.ts` | Gera slots; publica QStash; dedupe `live_sync_slots` |
| `src/lib/qstash.ts` | Cliente QStash + verificação assinatura |
| `src/app/api/sync/live/route.ts` | Callback QStash + GET manual (CRON_SECRET) |
| `src/app/api/sync/schedule/route.ts` | Cron diário agenda slots |
| `src/lib/match-events.ts` | Mapeia eventos API → `goal_events` |
| `src/components/match/MatchTeamScorers.tsx` | UI marcadores |
| `src/components/match/MatchVenue.tsx` | Cidade + estádio |
| `src/components/WhatsNewBanner.tsx` | Painel novidades |
| `src/lib/whats-new.ts` | Versão + localStorage |
| `supabase/migrations/009_goal_events.sql` | Coluna `goal_events` |
| `supabase/migrations/010_live_sync_slots.sql` | Tabela dedupe (RLS on, sem políticas) |
| `vercel.json` | Crons 05:00 schedule, 06:00 sync, 07:00 broadcasts |

---

## Variáveis Vercel (Production)

| Variável | Obrigatório | Notas |
|----------|-------------|-------|
| `QSTASH_URL` | Sim | `https://qstash-eu-central-1.upstash.io` |
| `QSTASH_TOKEN` | Sim | Upstash Console |
| `QSTASH_CURRENT_SIGNING_KEY` | Sim | Verificação POST `/api/sync/live` |
| `QSTASH_NEXT_SIGNING_KEY` | Sim | Rotação de chaves |
| `SITE_URL` | Sim | `https://wc26.pt` (URL callbacks QStash) |
| `CRON_SECRET` | Sim | Crons + testes manuais |

Ver [operacoes.md](operacoes.md) e [deploy.md](deploy.md).

---

## Cloudflare (wc26.pt)

Domínio atrás do Cloudflare. **Configuration rule** no domínio (não account-level WAF Enterprise):

- **When:** URI Path wildcard `/api/sync/live*`
- **Then:** Browser Integrity Check → Off

Sem isto, QStash/GitHub Actions podem receber **403**.

---

## Migrations Supabase (correr se ainda não)

- `007_finished_utc.sql` — estimativa fim (sync only; UI mostra kickoff)
- `008_calendar_token.sql` — token iCal em `profiles`
- `009_goal_events.sql` — JSONB marcadores
- `010_live_sync_slots.sql` — dedupe QStash (**Run and enable RLS**)

---

## Comandos operacionais

```bash
# Sync completo + agenda slots
curl -H "Authorization: Bearer $CRON_SECRET" https://wc26.pt/api/sync

# Sync live manual
curl -H "Authorization: Bearer $CRON_SECRET" https://wc26.pt/api/sync/live

# Agendar slots QStash (próx. 48 h)
curl -H "Authorization: Bearer $CRON_SECRET" https://wc26.pt/api/sync/schedule

# Ver slots futuros (Supabase SQL)
# SELECT m.home_team_name, m.away_team_name, s.slot_at
# FROM live_sync_slots s JOIN matches m ON m.fixture_id = s.fixture_id
# WHERE s.slot_at > now() ORDER BY s.slot_at LIMIT 30;
```

**GitHub Actions** `.github/workflows/live-sync.yml` — só `workflow_dispatch` (emergência).

---

## UX / animações (sessões anteriores, já em prod)

- Indicador coral deslizante nos separadores de dia (~300ms)
- Entrada escalonada dos cartões ao mudar de dia (80ms stagger)
- Featured match: hora grande ao centro; sem duplicar hora no badge upcoming

---

## Troubleshooting

| Sintoma | Acção |
|---------|--------|
| `QSTASH_TOKEN não configurado` | Env vars Vercel + redeploy |
| QStash 403 | Regra Cloudflare `/api/sync/live` |
| Marcadores vazios | `/api/sync` full; ver rate limit nos logs |
| `slotsFailed` > 0 | Logs Vercel; limite QStash free 1k msgs/dia |
| Painel novidades outra vez | Bump `WHATS_NEW_VERSION` |

---

## Próximos passos opcionais

- [ ] Endpoint admin read-only «próximos syncs» (opcional)
- [ ] Traduções `whatsNew.*` para ES/FR/… (fallback EN activo)
- [ ] Bump `package.json` → `0.5.0` no próximo tag

---

## Workflow acordado

1. Implementar → commit & push → validar em prod.
2. Documentação em `docs/` (não vai para Vercel).
3. Novidades utilizador: bump versão em `whats-new.ts` quando houver features visíveis.
