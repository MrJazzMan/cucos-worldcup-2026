# Changelog

Alterações notáveis do projeto Cucos WC26. Formato baseado em [Keep a Changelog](https://keepachangelog.com/).

Versão actual em produção: **0.3.0** (`wc26.pt`).

---

## [Unreleased]

_(nada por agora)_

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
