# Operações do dia-a-dia

Última actualização: 2026-06-13.

## Sync de jogos (API-Football)

```bash
curl -H "Authorization: Bearer TEU_CRON_SECRET" https://wc26.pt/api/sync
```

Resposta esperada:

```json
{"ok":true,"synced":72,"source":"api-football"}
```

- `synced` varia conforme jogos publicados na API (máx. ~104)
- Se `source: mock-fallback` → API key em falta ou plano Free (sem 2026)

### Sync live (durante jogos)

```bash
curl -H "Authorization: Bearer TEU_CRON_SECRET" "https://wc26.pt/api/sync?mode=live"
```

No modo `live`, o sync usa:
- fixtures em directo (`live=all`)
- fixtures de **hoje**
- fixtures de **ontem**

Isto evita jogos presos em "Ao vivo" quando saem do feed live e passam a `finished`.

#### Automático (GitHub Actions)

Workflow `.github/workflows/live-sync.yml` — corre **de 5 em 5 minutos** (mínimo do
GitHub; o Vercel Hobby não permite cron mais frequente).

**Configurar uma vez no GitHub** (repo → Settings → Secrets and variables → Actions):

| Tipo | Nome | Valor |
|------|------|-------|
| Secret | `CRON_SECRET` | O mesmo que está no Vercel (`uma-password-qualquer-123`) |
| Variable (opcional) | `SITE_URL` | `https://wc26.pt` |

Testar manualmente: Actions → **Live sync** → **Run workflow**.

#### Auto-refresh na homepage

Com o separador **Hoje** aberto, a página refresca sozinha (~45s se há jogos ao
vivo, ~90s caso contrário). Os cartões mostram marcador, minuto e etiqueta
"Ao vivo / Live".

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

Canais disponíveis: RTP1, RTP2, RTP3, SIC, TVI, Sport TV, DAZN, **LV** (YouTube).

Clicar nos botões para activar/desactivar canais por jogo.

---

## Deploy

Push à `main` → Vercel deploy automático.

Manual:

```bash
vercel --prod --yes
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
| Jogo ficou preso em `live` (ex.: 75') | Correr `/api/sync?mode=live` manualmente; confirmar que o `updated_at` do `fixture_id` mudou |
| Safari falha no callback OAuth | Limpar Website Data (`wc26.pt`, `supabase.co`, `localhost`) e repetir login em `wc26.pt` |

---

## Vercel CLI útil

```bash
vercel env ls
vercel domains inspect wc26.pt
vercel logs https://wc26.pt
```
