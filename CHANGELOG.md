# Changelog

Alterações notáveis do projeto Cucos WC26. Formato baseado em [Keep a Changelog](https://keepachangelog.com/).

Versão actual em produção: **0.2.0** (`wc26.pt`).

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
