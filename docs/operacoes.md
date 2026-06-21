# Operações do dia-a-dia

Última actualização: 2026-06-21.

## Sync de jogos (API-Football)

```bash
curl -H "Authorization: Bearer TEU_CRON_SECRET" https://wc26.pt/api/sync
```

Resposta esperada:

```json
{
  "ok": true,
  "synced": 72,
  "goalsSynced": 48,
  "standingsSynced": 12,
  "standingsGroupMatches": 72,
  "standingsTeamsMapped": 48,
  "source": "api-football",
  "liveSyncScheduled": { "fixtures": 8, "slotsQueued": 0, "slotsSkipped": 224, "slotsFailed": 0 }
}
```

- `synced` varia conforme jogos publicados na API (máx. ~104)
- `standingsSynced` = n.º de grupos gravados (esperado **12**)
- `standingsGroupMatches` = jogos de fase de grupos considerados no cálculo
- `standingsTeamsMapped` = equipas no mapa equipa→grupo (esperado **48**); se **0**, `/standings` falhou
- Se `source: mock-fallback` → API key em falta ou plano Free (sem 2026)

### Sync live (durante jogos)

```bash
curl -H "Authorization: Bearer TEU_CRON_SECRET" https://wc26.pt/api/sync/live
```

Resposta inclui `standingsSynced`, `standingsGroupMatches`, `standingsTeamsMapped` (mesmo formato que o sync full, sem `liveSyncScheduled` se não correr schedule).

No modo `live`, o sync usa:
- fixtures em directo (`live=all`)
- fixtures de **hoje**
- fixtures de **ontem**
- jogos ainda marcados `live` na BD

Isto evita jogos presos em "Ao vivo" quando saem do feed live e passam a `finished`.

#### Automático (Upstash QStash)

O sync live **não corre 24/7**. Um scheduler diário enfileira pedidos QStash **por jogo**:

| Momento | Acção |
|---------|--------|
| Kickoff −15 min | começa polling (a cada 5 min) |
| Durante o jogo | sync live |
| Kickoff +125 min | sync final (resultado + marcadores) |

**Crons Vercel:**

| Hora UTC | Endpoint | O quê |
|----------|----------|-------|
| 05:00 | `/api/sync/schedule` | Agenda slots QStash (próx. 48 h) |
| 06:00 | `/api/sync` | Sync completo + agenda slots |
| 07:00 | `/api/sync-broadcasts?today=1` | Canais TV |

**Configurar uma vez (Upstash + Vercel):**

1. [console.upstash.com](https://console.upstash.com) → **QStash** → Create
2. Copiar para **Vercel → Environment Variables**:

| Nome | Onde encontrar |
|------|----------------|
| `QSTASH_TOKEN` | QStash → Details → `QSTASH_TOKEN` |
| `QSTASH_CURRENT_SIGNING_KEY` | QStash → Signing Keys → Current |
| `QSTASH_NEXT_SIGNING_KEY` | QStash → Signing Keys → Next |
| `SITE_URL` | `https://wc26.pt` |
| `CRON_SECRET` | (já existe) |

3. **Supabase** — correr migration `010_live_sync_slots.sql`
4. **Cloudflare** (wc26.pt) — regra WAF para permitir POST a `/api/sync/live` (QStash usa IPs de datacenter; senão 403)
5. Deploy e testar:

```bash
curl -H "Authorization: Bearer TEU_CRON_SECRET" https://wc26.pt/api/sync/schedule
# → {"ok":true,"fixtures":N,"slotsQueued":N,...}
```

Ver mensagens agendadas: Upstash Console → QStash → Logs.

**GitHub Actions** (`.github/workflows/live-sync.yml`) — desactivado; só **Run workflow** manual em emergência.

#### Auto-refresh na homepage

Com o separador **Hoje** aberto, a página refresca sozinha (**30s** se há jogos ao
vivo, **90s** caso contrário). Os cartões mostram marcador, minuto e etiqueta
"Ao vivo / Live".

---

## Classificações de grupo (`/grupos`)

Actualizadas automaticamente em cada sync live/full. Pontos calculados a partir dos jogos `finished` na BD — **não** copiados directamente de `/standings` da API.

**Migration obrigatória:** `013_group_standings.sql`

```bash
# Repor calendário + classificações (se algo correu mal)
curl -H "Authorization: Bearer TEU_CRON_SECRET" https://wc26.pt/api/sync
```

Verificar na BD:

```sql
-- Alemanha no Grupo E (exemplo)
SELECT m.match_date, m.home_team_name, m.home_score, m.away_score, m.away_team_name, m.status
FROM matches m
WHERE m.home_team_name ILIKE '%Germany%' OR m.away_team_name ILIKE '%Germany%'
ORDER BY m.kickoff_utc;

SELECT rows FROM group_standings WHERE group_name = 'Grupo E';
```

| Sintoma | Acção |
|---------|--------|
| Pontos desactualizados | Hard refresh (`Cmd+Shift+R`); `/api/sync/live` |
| `standingsSynced: 0` | Ver `standingsTeamsMapped`; se 0 → retry (rate limit API) |
| `standingsGroupMatches: 0` | Correr `/api/sync` full — calendário pode ter sido apagado |
| Equipa com P errado mas jogos OK na homepage | Pontos vêm da BD; confirmar `status = finished` e scores no fixture |

---

## Perfil e calendário iCal

Requer login Google. Dados em `profiles` (`display_name`, `location`, `calendar_token`).

**Migrations obrigatórias:** `008_calendar_token.sql`, `012_profiles_rls_admin.sql` (recomendado).

| Acção utilizador | API | Notas |
|------------------|-----|-------|
| Ver/gravar perfil | `GET/PATCH /api/profile` | Service role no servidor |
| Link calendário | `GET /api/profile/calendar` | Cria token se NULL |
| Regenerar token | `POST /api/profile/calendar` | Invalida subscrições antigas |

URL pública do feed: `https://wc26.pt/calendar/{token}.ics` (equipas favoritas).

Verificar na BD:

```sql
SELECT display_name, location, calendar_token IS NOT NULL AS ok
FROM profiles WHERE user_id = 'UUID-DO-UTILIZADOR';
```

| Sintoma | Acção |
|---------|--------|
| «Could not save» | `SUPABASE_SERVICE_ROLE_KEY` no Vercel |
| «Could not load calendar link» | Migration `008`; redeploy; ver Network → `/api/profile/calendar` |
| Nome vazio no formulário | Hard refresh; GET `/api/profile` deve devolver nome Google como fallback |

---

## Sync de canais TV (OndeBola)

```bash
curl -H "Authorization: Bearer TEU_CRON_SECRET" https://wc26.pt/api/sync-broadcasts
```

Só jogos do Mundial, match fuzzy com a tabela `matches`.

Resposta exemplo:

```json
{"ok":true,"synced":6,"source":"ondebola","agenda_total":32,"jogos_mundial_hoje":3}
```

---

## Admin manual

URL: https://wc26.pt/admin

**Canais OndeBola** (ex. `Sport.Tv1`) vêm do sync automático — aparecem na secção «OndeBola / sync».

**Curadoria manual** por região (toggle por jogo):

| Região | Exemplos |
|--------|----------|
| Portugal | RTP1–3, SIC, TVI, Sport.Tv1–5, DAZN, LiveModeTv |
| UK | BBC One/Two/iPlayer, ITV, ITV X |
| USA | Fox, FS1, Telemundo, Peacock, … |
| Qatar | beIN Sports, Al Kass, Qatar TV |

O sync OndeBola **faz merge** com canais manuais já activados (não os apaga).

Clicar nos botões para activar/desactivar canais por jogo.

---

## Deploy

Push à `main` → Vercel deploy automático.

Manual:

```bash
vercel --prod --yes
```

---

## Feed RSS (jogos + canais)

URL secreta (não indexada): `https://wc26.pt/feed/TEU_RSS_FEED_TOKEN`

**Vercel** → Environment Variables:

| Nome | Valor |
|------|-------|
| `RSS_FEED_TOKEN` | String aleatória ≥16 chars (ex. `openssl rand -hex 24`) |

Sem esta variável o endpoint responde 404. Actualiza a cada 5 minutos; inclui todos os jogos do Mundial com canais da BD.

```bash
curl -s "https://wc26.pt/feed/TEU_RSS_FEED_TOKEN" | head
```

---

## Variáveis locais

Editar `.env.local` (ou `env.local` visível no Finder).

Nunca commitar ficheiros com chaves.

---

## Troubleshooting

| Sintoma | Acção |
|---------|--------|
| "Canal a confirmar" em muitos jogos | Correr `/api/sync-broadcasts`; completar em `/admin` |
| Jogos duplicados / bandeiras erradas | Correr `/api/sync` (apaga mocks) |
| `Não autorizado` no curl | Verificar `CRON_SECRET` no Vercel = valor no curl |
| API season 2022-2024 only | Upgrade Pro em api-football.com |
| Jogos estranhos (clubes, U20, cidades) | Correr `/api/sync` (full) — live sync antigo podia inserir outras ligas; agora filtrado ao Mundial |
| Login não funciona | Ver [google-auth.md](google-auth.md) |
| Jogo ficou preso em `live` (ex.: 75') | Correr `/api/sync/live` manualmente; confirmar que o `updated_at` do `fixture_id` mudou |
| QStash 403 / sync live não corre | Cloudflare: allow `/api/sync/live`; confirmar `SITE_URL=https://wc26.pt` no Vercel |
| `slotsFailed` > 0 no schedule | Ver logs Vercel; confirmar `QSTASH_TOKEN` e migration `010_live_sync_slots` |
| Safari falha no callback OAuth | Limpar Website Data (`wc26.pt`, `supabase.co`, `localhost`) e repetir login em `wc26.pt` |
| Classificações `/grupos` atrasadas | `/api/sync/live`; ver secção Classificações acima |
| `standingsTeamsMapped: 0` | Rate limit API-Football `/standings`; aguardar e repetir sync |

---

## Vercel CLI útil

```bash
vercel env ls
vercel domains inspect wc26.pt
vercel logs https://wc26.pt
```
