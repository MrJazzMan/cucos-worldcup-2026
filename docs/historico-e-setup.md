# Histórico e setup completo

Última actualização: 2026-06-13.

Registo de tudo o que foi feito para pôr o **Cucos World Cup 2026** em produção.

---

## 0. Interface (UI/UX)

### Menu de definições (hambúrguer)

`src/components/SettingsMenu.tsx` no cabeçalho abre um **drawer lateral** (overlay + fechar),
com bloco de utilizador e acções rápidas (`Galeria de Troféus`, `Definições`, `Sair`), além
das definições geridas pelo `SettingsProvider` (`src/components/SettingsProvider.tsx`) e
guardadas em `localStorage`:

| Definição | Valores | Chave localStorage |
|-----------|---------|--------------------|
| Idioma | Português / English | `cucos-lang` |
| Tema | Sistema / Claro / Escuro | `cucos-theme` |
| Fuso horário | Automático (browser) / lista de fusos | `cucos-tz` |

### Bilingue PT/EN

- Dicionário em `src/lib/i18n.ts` (`translate(lang, key)`); idioma por defeito
  detetado do browser, alterável no menu.
- Componentes-ilha em `src/components/Display.tsx`: `<T>` (texto), `<TeamName>`
  (nome da equipa no idioma), `<KickoffTime>` (hora no fuso), `<TzLabel>`.
- Nomes das equipas: PT traduzido via `src/lib/team-names.ts`; EN usa o original.

### Fuso horário

- Por defeito segue o **fuso do browser**; o utilizador pode escolher outro.
- Utilitários em `src/lib/datetime.ts` (via `Intl`): `dateKeyInTz`, `timeInTz`,
  `dayKeyWithOffset`, `displayDate`.
- A homepage carrega todos os jogos e **agrupa por dia no fuso escolhido**
  (`src/components/MatchesView.tsx`), evitando inconsistências de data.
- O `match_date` guardado é calculado em `Europe/Lisbon` (sync), mas a
  apresentação respeita o fuso do utilizador.

### Tema e visual

- Cores via tokens semânticos em `globals.css` (`--background`, `--surface`,
  `--foreground`, `--muted`, `--accent`, …) com variante `data-theme`.
- Script anti-flash (FOUC) no `<head>` do `layout.tsx`.
- Fundo com gradientes, cartões com sombra/animação, indicador "ao vivo" a
  pulsar, badges de canais em destaque.
- Badges de TV com look aproximado de marca:
  - `SPORT TV`: preto + amarelo
  - `RTP`: azul + branco

### Rodapé

"© 2026 Cuco Enterprise" centrado no fundo de todas as páginas.

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

### Correcção live-sync (jogos presos em "ao vivo")

Problema detectado em produção: alguns jogos (ex.: Catar) ficavam presos em `live`
quando já tinham terminado.

Causa: `/api/sync?mode=live` usava apenas `/fixtures?live=all`; quando o jogo passa a
`FT`, sai desse endpoint e deixava de ser actualizado.

Solução aplicada em `src/lib/sync.ts`:
- no modo live, sincronizar `live + hoje + ontem`,
- deduplicar por `fixture_id`,
- fazer upsert normal.

Resultado: a transição `live -> finished` fica garantida no próximo ciclo.

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
| `/` | Homepage — seletor de dias, destaque, grelha |
| `/grupos` | Classificações (colunas alinhadas) |
| `/fasefinal` | Chave eliminatória — bracket desktop + preview |
| `/eliminatorias` | Redirect → `/fasefinal` |
| `/conta` | Redirect → `/` (conta no menu Perfil) |
| `/admin` | Curadoria manual de canais TV |

---

## 10. Canais TV no Admin

Lista em [`src/lib/channels.ts`](../src/lib/channels.ts):

RTP1, RTP2, RTP3, SIC, TVI, Sport TV, DAZN, **LV** (YouTube).

LV → https://www.youtube.com/channel/UCpcTrCXblq78GZrTUTLWeBw

---

## 11. Autenticação (estado actual)

- Google OAuth via Supabase Auth: **activo e validado em produção**
- Callback final: `https://wc26.pt/auth/callback`
- URL config Supabase:
  - Site URL: `https://wc26.pt`
  - Redirect URLs:
    - `https://wc26.pt/auth/callback`
    - `http://localhost:3000/auth/callback`
- Apple Sign in: UI pronta, provider ainda pendente de configuração no Apple Developer

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
| OAuth voltava para `localhost` em produção | `redirectTo` simplificado para callback puro + origem resolvida com `x-forwarded-host/proto` no middleware |
| `PKCE code verifier not found` / erros intermitentes OAuth | troca de código centralizada no middleware com cookies SSR |
| Safari falhava no callback (`FetchEvent` / resposta nula) | service worker endurecido: ignora navegação/auth/query params e limpa caches antigas |
| Menu hamburger básico face ao mock | drawer lateral com perfil e acções rápidas |
| Canais com visual genérico | badges por canal (`SPORT TV` e `RTP`) |

---

## 15. Próximos passos sugeridos

- [x] Activar Google OAuth no Supabase
- [ ] Activar Apple OAuth (conta Developer)
- [ ] Gerar chaves VAPID e activar push
- [ ] Sync manual diário durante o torneio (`curl` jogos + broadcasts)
- [ ] Completar canais em `/admin` quando OndeBola não tiver match
- [ ] Renovar API-Football Pro só durante o Mundial (sem auto-renew)
