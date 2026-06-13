# Histórico e setup completo

Última actualização: 2026-06-13.

Registo de tudo o que foi feito para pôr o **Cucos World Cup 2026** em produção.

---

## 1. Objectivo do produto

Aplicação mobile-first para adeptos **portugueses** seguirem o Mundial FIFA 2026:

- Que jogos há hoje / ontem / amanhã?
- A que horas (hora de Portugal)?
- Que canais de TV transmitem em Portugal?
- O jogo está por começar, ao vivo ou terminado?

**Não compete** com Flashscore/Sofascore — foco em simplicidade e TV PT.

---

## 2. Decisões de stack

| Camada | Escolha | Porquê |
|--------|---------|--------|
| Frontend | Next.js 15 + TypeScript + Tailwind | SSR rápido, PWA, experiência tipo FotMob |
| Backend / DB | Supabase | Auth, PostgreSQL, RLS |
| Jogos | API-Football (API-Sports) | Mundial 2026, live scores, grupos |
| TV Portugal | OndeBola.com (scrape) | Port do [Leopardo](../Leopardo) — nenhuma API tem RTP/SIC bem |
| Deploy | Vercel | CDN, crons, domínio custom |
| Domínio | `wc26.pt` | 1€ no dominios.pt |

**Beira d'água (Bravenet) descartado** para esta app: não corre Next.js; PHP não cumpre OAuth Apple + Web Push + UX moderna. Continua excelente para Pai na UCI.

---

## 3. Repositório e estrutura

- **Pasta local:** `~/Projects/CucosWorldCup2026`
- **GitHub:** https://github.com/MrJazzMan/cucos-worldcup-2026
- **Convenções:** README, ARCHITECTURE.md, `docs/`, Conventional Commits

### Commits principais

| Commit | Descrição |
|--------|-----------|
| `0bd4bb8` | MVP Next.js + Supabase + homepage + auth + PWA |
| `c186e0c` | Crons Vercel ajustados ao plano Hobby |
| `9e55680` | Sync canais TV via OndeBola (port Leopardo) |
| `b51a0ad` | Remover jogos mock após sync API-Football Pro |

---

## 4. Supabase

### Projecto

- Nome: `cucos-worldcup-2026`
- Região: EU (Frankfurt)
- Plano: Free

### Schema

Ficheiro: [`supabase/migrations/001_initial_schema.sql`](../supabase/migrations/001_initial_schema.sql)

Tabelas:

- `matches` — jogos (API-Football)
- `broadcasts` — canais TV por `fixture_id`
- `profiles`, `favourite_teams`, `notification_prefs`, `push_subscriptions`, `notification_log`

### Setup (resumo IKEA)

1. Criar projecto em [supabase.com](https://supabase.com)
2. SQL Editor → colar migration → Run
3. Settings → API → copiar URL + anon + service_role
4. `.env.local` com as 3 chaves
5. Authentication → Redirect URLs: `https://wc26.pt/auth/callback`

### Chaves (nomes no `.env`)

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

Formato novo Supabase (2026): `sb_publishable_...` e `sb_secret_...`.

---

## 5. Vercel

### Projecto

- Nome: `cucos-worldcup-2026`
- Team: Miguel's projects (Hobby)
- URL default: `cucos-worldcup-2026.vercel.app`
- **Domínio custom:** `wc26.pt`

### Ligação Git

- Branch `main` → deploy automático em cada push
- CLI: `vercel link` + `vercel --prod`

### Variáveis de ambiente (Production)

| Variável | Uso |
|----------|-----|
| `NEXT_PUBLIC_SUPABASE_URL` | Cliente + servidor |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Cliente público |
| `SUPABASE_SERVICE_ROLE_KEY` | Sync, push, admin API |
| `API_FOOTBALL_KEY` | Sync jogos |
| `CRON_SECRET` | Proteger `/api/sync*` e `/api/push` |
| `NEXT_PUBLIC_SITE_URL` | `https://wc26.pt` |

Opcionais (notificações): `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`.

### Crons (`vercel.json`)

| Horário (UTC) | Endpoint | Função |
|---------------|----------|--------|
| 06:00 | `/api/sync` | Jogos API-Football |
| 07:00 | `/api/sync-broadcasts?today=1` | Canais OndeBola |

Nota: plano Hobby limita frequência real dos crons; sync manual via `curl` é fiável.

### Documentação não deployada

A pasta `docs/` está em [`.vercelignore`](../.vercelignore) — só GitHub, não Vercel.

---

## 6. Domínio wc26.pt

### Compra

- Registador: dominios.pt
- Preço: **1€** (promoção)
- DNS: registos NS `host-redirect.com` (normal do dominios.pt)

### Registos DNS

| Tipo | Nome | Valor |
|------|------|-------|
| A | `@` | `76.76.21.21` |
| CNAME | `www` | `cname.vercel-dns.com` |

### Vercel

Settings → Domains → `wc26.pt` → Valid Configuration quando DNS propagar.

---

## 7. Dados reais

### API-Football (jogos)

- Dashboard: [api-football.com](https://www.api-football.com) / API-Sports
- Liga: `league=1`, `season=2026`
- **Plano Free:** só épocas 2022–2024 — **não serve para WC26**
- **Plano Pro:** $19/mês — necessário; inclui todas as competições
- Sync devolveu **72 jogos** (eliminatórias futuras ainda não publicadas na API)

Módulo: [`src/lib/api-football.ts`](../src/lib/api-football.ts)  
Sync: [`src/lib/sync.ts`](../src/lib/sync.ts) → `GET /api/sync`

Após upgrade Pro, mocks (IDs 1001–1005) são **apagados** automaticamente no sync completo.

### OndeBola (canais TV)

Port directo do projecto Leopardo (`briefing/fontes/ondebola.py`):

- Módulo: [`src/lib/ondebola.ts`](../src/lib/ondebola.ts)
- Sync: [`src/lib/sync-broadcasts.ts`](../src/lib/sync-broadcasts.ts) → `GET /api/sync-broadcasts`
- Match fuzzy: nomes de equipas + hora ±90 min (como `canal_para_jogo` no Leopardo)
- Cache HTML: 6 horas

Primeiro sync em produção: **6 canais** associados de **32** jogos na agenda OndeBola.

### Leopardo vs Cucos

| | Leopardo | Cucos |
|---|----------|-------|
| Jogos | football-data.org (4 equipas) | API-Football (Mundial completo) |
| TV | OndeBola scrape | OndeBola scrape (mesma lógica) |
| Storage | Nenhum (texto Telegram) | Supabase |
| Quando | Cron 07:30 | Cron + curl manual |

---

## 8. Comandos operacionais

```bash
# Sync jogos (após Pro activo)
curl -H "Authorization: Bearer $CRON_SECRET" https://wc26.pt/api/sync

# Sync canais TV
curl -H "Authorization: Bearer $CRON_SECRET" https://wc26.pt/api/sync-broadcasts

# Deploy manual
vercel --prod --yes
```

Ver [operacoes.md](operacoes.md) para mais detalhe.

---

## 9. Páginas da aplicação

| Rota | Função |
|------|--------|
| `/` | Homepage — Ontem / Hoje / Amanhã |
| `/grupos` | Classificações |
| `/eliminatorias` | Chave eliminatória |
| `/conta` | Google + Apple, favoritos, notificações |
| `/admin` | Curadoria manual de canais TV |

---

## 10. Canais TV no Admin

Lista em [`src/lib/channels.ts`](../src/lib/channels.ts):

RTP1, RTP2, RTP3, SIC, TVI, Sport TV, DAZN, **LV** (YouTube).

LV → https://www.youtube.com/channel/UCpcTrCXblq78GZrTUTLWeBw

---

## 11. Autenticação (pendente / parcial)

- Google + Apple via Supabase Auth — UI em `/conta`
- Falta activar providers no Supabase Dashboard
- Redirect URL produção: `https://wc26.pt/auth/callback`
- Apple Developer ($99/ano) necessário para Sign in with Apple

---

## 12. Notificações PWA (implementado, requer VAPID)

- Service Worker: `public/sw.js`
- Endpoint: `/api/push`
- 5 tipos: 24h, 1h, 15m, kickoff, final
- Ver [notifications.md](notifications.md)

---

## 13. Desenvolvimento local

```bash
cd ~/Projects/CucosWorldCup2026
cp .env.example .env.local
# preencher chaves Supabase + API_FOOTBALL_KEY + CRON_SECRET
npm install
npm run dev
```

Ficheiro visível (opcional): `env.local` — cópia sem ponto para editar no Finder; **não commitar**.

---

## 14. Problemas resolvidos

| Problema | Solução |
|----------|---------|
| Vercel sem deploy inicial | Push + crons Hobby (não cada minuto) |
| `wc26.pt` Invalid Configuration | Registo A → 76.76.21.21 |
| API Free sem 2026 | Upgrade Pro $19/mês |
| Jogos mock + reais misturados | `purgeMockMatches` após sync API |
| OndeBola `synced: 0` | Normal até haver jogos reais na BD; depois match fuzzy |
| Chave API no chat | Regenerar no dashboard se preocupação |

---

## 15. Próximos passos sugeridos

- [ ] Activar Google OAuth no Supabase
- [ ] Activar Apple OAuth (conta Developer)
- [ ] Gerar chaves VAPID e activar push
- [ ] Sync manual diário durante o torneio (`curl` jogos + broadcasts)
- [ ] Completar canais em `/admin` quando OndeBola não tiver match
- [ ] Renovar API-Football Pro só durante o Mundial (sem auto-renew)
