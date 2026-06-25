# Documentação — Cucos WC26

Documentação interna do projecto. **Vai para o GitHub, não vai para o Vercel** (ver [`.vercelignore`](../.vercelignore)).

**Versão actual:** `0.5.0` — ver [sessao-handoff-2026-06-25.md](sessao-handoff-2026-06-25.md) (handoff mais recente).

## Índice

| Documento | Conteúdo |
|-----------|----------|
| [**sessao-handoff-2026-06-25.md**](sessao-handoff-2026-06-25.md) | **Handoff Jun 25** — testes do bracket, SEO/OG, rate limiting anti-scraping |
| [sessao-handoff-2026-06-23.md](sessao-handoff-2026-06-23.md) | Handoff Jun 23 — pesquisa, dia de jogos, marcadores, chave FIFA |
| [**sessao-handoff-2026-06-21-fase3.md**](sessao-handoff-2026-06-21-fase3.md) | Handoff Fase 3 — segurança, RGPD, homepage, cookies |
| [sessao-handoff-jun-2026.md](sessao-handoff-jun-2026.md) | Handoff anterior — QStash, classificações, perfil/calendário |
| [historico-e-setup.md](historico-e-setup.md) | Stack, Supabase, Vercel, domínio, dados reais |
| [deploy.md](deploy.md) | Vercel, variáveis, crons, pós-deploy |
| [setup-analytics-ads.md](setup-analytics-ads.md) | GA4 + AdSense (verificação, env vars) |
| [admin-analytics.md](admin-analytics.md) | Dashboard interno `/admin/analytics` (KPIs, gráficos) |
| [seo.md](seo.md) | Checklist SEO — Search Console, indexação |
| [google-auth.md](google-auth.md) | Sign in with Google |
| [data-sources.md](data-sources.md) | API-Football, OndeBola, sync |
| [notifications.md](notifications.md) | Web Push, preferências, cron |
| [operacoes.md](operacoes.md) | Comandos do dia-a-dia |
| [coding-guidelines.md](coding-guidelines.md) | Convenções de código |
| [testes-fase-final.md](testes-fase-final.md) | Suite de testes (`npm test`) + correcção da árvore do bracket |

## Estado actual (0.5.0)

| Área | Estado |
|------|--------|
| **Produção** | https://wc26.pt |
| **Perfil** | Nome/local via `PATCH /api/profile` (login) |
| **Calendário iCal** | Menu → Calendário; token em `profiles.calendar_token` |
| **Jogos** | Públicos (SEO) — equipas, horários, resultados, **canais TV** |
| **Homepage** | Pesquisa equipa, dia de jogos (cutoff 06:00), melhores marcadores |
| **Fase final** | https://wc26.pt/fasefinal — Annex C, ordem FIFA M73+, árvore com pairings correctos |
| **Layout homepage** | `max-w-7xl` alinhado; destaque + grelha 2 colunas |
| **Marcadores** | Golos por equipa (live + final) |
| **Sync live** | QStash + refresh 30s na homepage |
| **Calendário** | iCal favoritos (login) |
| **Novidades** | Banner 1× na homepage |
| **Mobile nav** | Bottom bar 5 itens (< 640px) |
| **Bandeiras** | `circle-flags` → `public/flags/` (build) |
| **Feed RSS** | `/feed/{RSS_FEED_TOKEN}` (secreto, env Vercel) |
| **GA4** | `G-BEVP34KWFW` — só após consentimento (Consent Mode v2) |
| **AdSense** | Verificado, Auto ads ON |
| **Idiomas** | 12 (EN default) |
| **Branding** | Logo SVG, coral `#E0451F`, favicon «26» |

## Modelo de acesso

```
Visitante anónimo  → jogos + grupos + fase final + canais TV + SEO
Utilizador logado  → + favoritos + notificações + perfil (menu)
Admin (hardcoded)  → /admin (canais) + /admin/analytics (métricas)
```

## Links rápidos

- **Produção:** https://wc26.pt
- **Privacidade:** https://wc26.pt/privacidade
- **ads.txt:** https://wc26.pt/ads.txt
- **Admin canais:** https://wc26.pt/admin
- **Admin métricas:** https://wc26.pt/admin/analytics
- **GitHub:** https://github.com/MrJazzMan/cucos-worldcup-2026
- **Vercel:** projecto `cucos-worldcup-2026`
- **Supabase:** projecto `vsbmdqzabegcvjupwcpj`

## Arquitectura resumida

Ver [ARCHITECTURE.md](../ARCHITECTURE.md).

```
API-Football ──► /api/sync ──► Supabase matches
OndeBola     ──► /api/sync-broadcasts ──► Supabase broadcasts
Supabase     ◄── Next.js (wc26.pt) ◄── Utilizador
GA4 + AdSense ──► após consentimento de cookies (GA não carrega antes de aceitar)
```

## Releases

| Versão | Data | Resumo |
|--------|------|--------|
| **0.4.0** | 2026-06-19 | Fase final, canais públicos, favoritos, animações, bottom nav |
| **0.3.0** | 2026-06-19 | Branding, destaque, layout 2 colunas, RSS, canais multi-região |
| **0.2.0** | 2026-06-16 | Público + SEO, AdSense, 12 línguas, temas |
| **0.1.0** | 2026-06-13 | MVP login + painel definições + deploy |

Ver [CHANGELOG.md](../CHANGELOG.md) para detalhe completo.
