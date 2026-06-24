# Changelog

Alterações notáveis do projeto Cucos WC26. Formato baseado em [Keep a Changelog](https://keepachangelog.com/).

Versão actual em produção: **0.5.0** (`wc26.pt`).

---

## [Unreleased]

### Adicionado
- **Suite de testes** (`tests/`, `npm test`) — `node:test` + loader de alias `@/`, sem dependências novas. 34 testes: Annex C (round-trip das 495 combinações), terceiros, locks, ordem FIFA e coerência da chave. Ver [docs/testes-fase-final.md](docs/testes-fase-final.md).
- **Melhores marcadores** na homepage (`TopScorers`) — agregação de `goal_events`, top 5 expandível até 15.
- **Pesquisa por equipa** na homepage (`TeamSearch`) — autocomplete, `?team=id`, todos os jogos da equipa.
- **Vista «Dia de jogos»** — dias do torneio com cutoff 06:00 (`tournament-days.ts`); toggle com «Por data» (`?view=calendar`).
- **Annex C FIFA** — 495 combinações de 3.ºs (`knockout-annex-c.ts`); ranking e resolução de slots (`third-place.ts`).
- **Ordem FIFA na chave** — `knockout-fifa-order.ts`, pairings explícitos na árvore, `orderMatchesInFifaSlots()`.
- Rótulos de seed nos cartões preview (`knockout-slot-labels.ts`: «1.º Gr. E», «3.º Gr. C»).
- Datas compactas nos cartões KO (`MatchCompactDate` em `BracketSlotCard`).

### Alterado
- **`KNOCKOUT_SKELETON`** — R32/R16 na ordem oficial M73–M96.
- **`buildSideTree()`** — deixa de usar emparelhamento binário simples; usa pairings FIFA.
- PT-PT: **«Melhores Marcadores»** (BR mantém «Artilharia»); **«Agendado»** para jogos por começar.
- PT-PT/PT-BR: nomenclatura eliminatórias (dezasseis-avos / oitavas vs fase de 32 / oitavos).

### Corrigido
- **Árvore desktop da chave (`buildSideTree`)** — quartos liam slots da coluna `r16` (mostravam jogos dos dezasseis-avos); split de metades contíguo emparelhava M97 com M99 em vez de M97 com M98 (meias-finais erradas). Topologia tabelada substituída por `SIDE_TREE_SPEC` declarativo, coberto por testes.
- Ordem errada dos jogos na chave `/fasefinal` (skeleton + árvore + colocação de jogos da BD).
- Crash ao alternar «Dia de jogos» ↔ «Por data» (`isCalendarDayKey`, `activeTab` derivado).
- Pesquisa por equipa só mostrava jogos futuros.
- Datas em falta nos cartões de jogo (`formatCompactMatchDate`).

### Documentação
- **`docs/sessao-handoff-2026-06-23.md`** — handoff completo desta sessão.

### Adicionado (anterior nesta release)
- **Dashboard admin de métricas** em `/admin/analytics` — KPIs, gráficos (30 dias) e tabelas (top páginas, últimos utilizadores).
- API **`GET /api/admin/analytics`** com RPC `get_admin_analytics` (uma query consolidada).
- Migration **`019_get_admin_analytics.sql`** — função RPC com agregações em `Europe/Lisbon`.
- Migration **`020_fix_admin_analytics_rpc.sql`** — remove check `is_site_admin()` no RPC (incompatível com service_role).
- Navegação admin entre **Canais TV** e **Métricas** (`AdminNav`).
- Documentação **`docs/admin-analytics.md`**.
- Canais TV visíveis apenas para utilizadores com sessão iniciada.
- Link inline «Inicia sessão» nos cartões de jogo para login Google directo.
- Chave `/fasefinal` preenche slots de grupo com equipas matematicamente qualificadas.

### Alterado
- Páginas admin com `noindex` e acesso restrito ao `SITE_ADMIN_USER_ID`.
- Nomenclatura PT: **«16 avos»** (primeira ronda eliminatória, 32 equipas).

## [0.5.0] — 2026-06-20 — Perfil, calendário e novidades

### Adicionado
- Rotas API **`/api/profile`** (GET/PATCH) e **`/api/profile/calendar`** (GET/POST) com service role.
- **`src/lib/supabase/route-auth.ts`** — autenticação de sessão nas rotas API.
- Painel **Novidades** mostra versão e data (`v0.5.0 · 2026-06-22`).
- Migration **`012_profiles_rls_admin.sql`** — função `is_site_admin()` (RLS sem recursão).
- Migration **`011_profiles_insert_own.sql`** — INSERT próprio perfil (RLS).

### Alterado
- Menu Perfil: ordem Perfil → Calendário → …; mobile **Perfil** abre directamente o painel.
- Perfil recarrega ao abrir o painel (sync entre dispositivos).

### Corrigido
- Gravar perfil («Could not save») — upsert client-side substituído por API servidor.
- Calendário iCal («Could not load calendar link») — geração de `calendar_token` no servidor.
- Leitura de nome/local vazia no desktop — GET `/api/profile` com fallback ao nome Google.

---

## [0.4.1] — 2026-06-21 — Sync live, marcadores e novidades

### Adicionado
- Painel **Novidades** na homepage (`WhatsNewBanner`).
- Sync live agendado por jogo via **Upstash QStash** (`/api/sync/live`, `/api/sync/schedule`).
- **Marcadores** (`goal_events`) nos cartões ao vivo/terminados.
- Feed **iCal** para equipas favoritas (login, `/calendar/[token]`).
- Migration `010_live_sync_slots.sql` (dedupe slots QStash).

### Alterado
- Tipografia maior: marcadores, cidade e estádio nos cartões.
- Sync de marcadores em batch (`/fixtures?ids=`) para evitar rate limit API-Football.
- GitHub Actions live-sync desactivado (backup manual); QStash substitui.
- Crons Vercel: +05:00 UTC `/api/sync/schedule`.

### Corrigido
- Hora de **kickoff** (não fim estimado) nos jogos terminados.
- Layout cartões com muitos marcadores (`items-start`, coluna central centrada).

---

## [0.4.0] — 2026-06-19 — Fase final, acesso público e UX

**Marco:** site read-only público com canais; chave eliminatória em `/fasefinal`; micro-animações; bottom nav mobile.

### Adicionado
- **`/fasefinal`** — chave eliminatória FIFA 2026 (preview + jogos reais quando existirem na DB).
- **Bracket desktop simétrico** (`KnockoutBracketDesktop`) — árvore com conectores; mobile mantém colunas com scroll.
- **`/eliminatorias`** — redirect permanente → `/fasefinal`.
- **`MatchFavouriteToggle`** — estrela clicável nos cards (favoritar ambas as equipas; login via menu Perfil).
- **`LivePulseDot`** — indicador ao vivo com anel pulsante (cards + destaque + refresh).
- **`knockout-bracket.ts` / `knockout-bracket-tree.ts`** — placeholders FIFA e construção da árvore.
- **Bottom nav mobile** (`BottomNav`, `AppChrome`) — Jogos, Grupos, Fase final, Favoritos, Perfil.
- Animações CSS: pop estrela (~280ms), hover card desktop (~200ms), pulso live (~1.4s); `prefers-reduced-motion` unificado.

### Alterado
- **Canais TV públicos** — visitantes anónimos veem badges; removido `ChannelLoginCta` e gate de login nos canais.
- **`getAllMatches` / `getMatchesForDay`** — broadcasts sempre incluídos (RLS já era público).
- **`LoginGate`** — deixou de bloquear o site; só banner de erro OAuth se montado.
- **Homepage layout** — contentor único `max-w-7xl` (barra dias, café, favoritos, grelha alinhados).
- **Grupos** — `table-fixed` + `colgroup` para alinhar colunas entre grupos.
- **Fase final copy (PT):** título «Fase Final - Eliminatórias»; hint curto sem «Chave prevista FIFA…».
- **Footer** — removido «Produção: Miguel Garcia».
- **Nav** — link eliminatórias → `/fasefinal`; sitemap actualizado.
- Removido **`KNOCKOUTS_ENABLED`** / `src/lib/features.ts` — página sempre acessível.

### Corrigido
- `/eliminatorias` redirect para `/` em prod (flag `NEXT_PUBLIC_SHOW_KNOCKOUTS` obsoleta).

### Removido
- `ChannelLoginCta.tsx`, `src/lib/features.ts`.

### Documentação
- `docs/sessao-handoff-jun-2026.md` — handoff para próxima sessão.
- `ARCHITECTURE.md`, `docs/README.md`, `historico-e-setup.md` actualizados.

### Pendente (próxima sessão)
- Indicador do dia activo a **deslizar** na barra de pills (~300ms).
- Cards a **entrar em sequência** ao trocar de dia (~80ms stagger, ~420ms fade-up).

---

## [0.3.0] — 2026-06-19 — Branding, layout desktop e jogo em destaque

**Marco:** nova identidade visual, homepage optimizada para ecrãs largos, feed RSS privado, canais TV multi-região.

### Adicionado
- **Logo SVG** (`Logo.tsx`) com Space Grotesk e sublinhado `var(--accent)`.
- **Favicon** novo (`app/icon.svg`, `public/icon.svg`) — «26» em coral.
- **Jogo em destaque** (`FeaturedMatch`) — card full-width com borda `--accent`; prioridade: Portugal (não terminado) → ao vivo → próximo → último final.
- **Bandeiras circulares** via pacote [`circle-flags`](https://github.com/HatScripts/circle-flags) — `TeamFlag` / `CircleFlag`; sync para `public/flags/` no `postinstall` e `build` (`scripts/sync-circle-flags.mjs`).
- **Feed RSS** em `/feed/{RSS_FEED_TOKEN}` — jogos + canais; variável `RSS_FEED_TOKEN` na Vercel (ver `docs/operacoes.md`).
- **Listas de canais por região** no admin: Portugal, UK, USA, Qatar (`src/lib/channels.ts`).
- **Merge de broadcasts** no sync OndeBola — preserva canais manuais ao actualizar scrape.
- **Badge Sport.TV** — styling para variantes OndeBola (`Sport.Tv1`, `Sport.TV5`, …).

### Alterado
- **Cor de acento** light/dark → `#E0451F` (coral); `--accent-soft` e `--glow` alinhados.
- **Header** full-width (`px-6`); logótipo usa `--accent` via CSS (sem cor hardcoded).
- **Homepage desktop** — controlos (dias, café, favoritos) em `max-w-2xl`; grelha de jogos em `max-w-7xl`, máx. **2 colunas**.
- **MatchCard** — bandeiras dominantes (76px), hora/resultado mais discretos; local em 2 linhas (cidade + bandeira anfitriã, estádio); canais alinhados na base do card (`mt-auto`).
- **Admin** — secções OndeBola/sync + toggles por região; removido `Sport TV` genérico em favor de `Sport.Tv1–5`.

### Corrigido
- Space Grotesk no logo SVG via `style` (não atributo `font-family`).
- Bandeiras 404 na Vercel — ficheiros estáticos em `public/flags/` em vez de `readFile` em `node_modules`.
- Hora duplicada no `FeaturedMatch` (removida do topo; mantida ao centro).

### Variáveis Vercel (novas)
| Variável | Uso |
|----------|-----|
| `RSS_FEED_TOKEN` | URL secreta do feed RSS (`/feed/…`) |

---

## [0.2.0] — 2026-06-16 — Site público, monetização e internacionalização

**Marco:** site indexável no Google, AdSense verificado, canais TV só para utilizadores registados.

### Adicionado
- **12 idiomas** (EN default): PT, BR, ES, FR, DE, IT, NL, PL + árabe 🇶🇦 🇦🇪 🇸🇦 com RTL.
- **LangSwitcher** no header (bandeiras).
- **3 temas visuais:** Cyberpunk, FIFA 2026, Japan Classic (`src/lib/themes.ts`).
- **ProfileSync** — email, idioma preferido e local (IP) no login Google.
- Migration `004_profile_email_location.sql` — `email`, `signup_country`, `preferred_lang`.
- Endpoint `/api/sync-profiles` — migration + backfill de emails.
- **GA4** (`G-BEVP34KWFW`) com Consent Mode RGPD.
- **AdSense** verificado — script literal no `<head>`, `/ads.txt`, Auto ads ON.
- Página `/privacidade` (PT/EN).
- Guia `docs/setup-analytics-ads.md` e checklist `docs/seo.md`.

### Alterado
- **Jogos públicos** (equipas, horários, resultados, estádio) — SEO.
- **Canais TV só com login** — dados removidos do HTML para visitantes anónimos.
- Modal de login obrigatório **removido** (substituído por CTA nos cartões de jogo).
- Eliminatorias ocultas até `NEXT_PUBLIC_SHOW_KNOCKOUTS=true`.
- Integração **Supabase ↔ Vercel** (env vars Postgres sincronizadas).

### Corrigido
- Script AdSense: tag `<script async>` no HTML inicial (crawler não via `next/script` preload).
- Import `ProfileSync` em `layout.tsx`.

### Variáveis Vercel (produção)
| Variável | Estado |
|----------|--------|
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | ✅ `G-BEVP34KWFW` |
| `NEXT_PUBLIC_ADSENSE_CLIENT_ID` | ✅ `ca-pub-0320022425990569` |
| `NEXT_PUBLIC_ADSENSE_SLOT_HOME` | ⏳ opcional (Auto ads activos) |

---

## [0.1.0] — 2026-06-13 — MVP com login e painel de definições

### Adicionado
- App Next.js 15 + Supabase (jogos API-Football, canais curados).
- Login Google OAuth com modal obrigatório (depois revertido em 0.2.0).
- Painel lateral ☰: Perfil, Notificações, Equipas favoritas, Aparência.
- Admin canais em `/admin`.
- Deploy Vercel + domínio `wc26.pt`.
- `CHANGELOG.md`, `ARCHITECTURE.md`, documentação em `docs/`.

### Alterado
- `/conta` redireciona para `/`; definições no painel lateral.
- Avatar no header abre o painel de definições.

---

## Histórico detalhado (0.1.0 → 0.2.0)

<details>
<summary>Commits por área (Jun 2026)</summary>

- **Auth & perfil:** login modal → público; ProfileSync; migration 004; sync-profiles API.
- **UI:** settings panel; temas Cyberpunk/FIFA/Japan; lang switcher header.
- **i18n:** 9 → 12 línguas; EN default; árabe RTL.
- **Analytics:** GA4, cookie consent, AdSense, ads.txt, verificação site.
- **SEO:** jogos no SSR sem canais; robots.txt; sitemap.

</details>
