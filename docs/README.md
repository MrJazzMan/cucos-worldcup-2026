# Documentação — Cucos WC26

Documentação interna do projecto. **Vai para o GitHub, não vai para o Vercel** (ver [`.vercelignore`](../.vercelignore)).

**Versão actual:** `0.3.0` (2026-06-19) — branding, layout desktop, jogo em destaque, RSS.

## Índice

| Documento | Conteúdo |
|-----------|----------|
| [historico-e-setup.md](historico-e-setup.md) | Stack, Supabase, Vercel, domínio, dados reais |
| [deploy.md](deploy.md) | Vercel, variáveis, crons, pós-deploy |
| [setup-analytics-ads.md](setup-analytics-ads.md) | GA4 + AdSense (verificação, env vars) |
| [seo.md](seo.md) | Checklist SEO — Search Console, indexação |
| [google-auth.md](google-auth.md) | Sign in with Google |
| [data-sources.md](data-sources.md) | API-Football, OndeBola, sync |
| [notifications.md](notifications.md) | Web Push, preferências, cron |
| [operacoes.md](operacoes.md) | Comandos do dia-a-dia |
| [coding-guidelines.md](coding-guidelines.md) | Convenções de código |

## Estado actual (0.3.0)

| Área | Estado |
|------|--------|
| **Produção** | https://wc26.pt |
| **Jogos** | Públicos (SEO) — equipas, horários, resultados |
| **Layout homepage** | Destaque full-width + grelha 2 colunas (desktop) |
| **Bandeiras** | `circle-flags` → `public/flags/` (build) |
| **Canais TV** | Só com login Google; OndeBola + curadoria PT/UK/USA/Qatar |
| **Feed RSS** | `/feed/{RSS_FEED_TOKEN}` (secreto, env Vercel) |
| **GA4** | `G-BEVP34KWFW` + Consent Mode |
| **AdSense** | Verificado, Auto ads ON (`ca-pub-0320022425990569`) |
| **Idiomas** | 12 (EN default) |
| **Temas** | Sistema / Claro / Escuro + Cyberpunk / FIFA 2026 / Japan |
| **Branding** | Logo SVG, coral `#E0451F`, favicon «26» |
| **Supabase** | Integração directa com Vercel |

## Modelo de acesso

```
Visitante anónimo  → jogos + grupos + SEO
Utilizador logado  → + canais TV + favoritos + notificações + perfil
Admin (hardcoded)  → /admin (canais)
```

## Links rápidos

- **Produção:** https://wc26.pt
- **Privacidade:** https://wc26.pt/privacidade
- **ads.txt:** https://wc26.pt/ads.txt
- **Admin canais:** https://wc26.pt/admin
- **GitHub:** https://github.com/MrJazzMan/cucos-worldcup-2026
- **Vercel:** projecto `cucos-worldcup-2026`
- **Supabase:** projecto `vsbmdqzabegcvjupwcpj`

## Arquitectura resumida

Ver [ARCHITECTURE.md](../ARCHITECTURE.md).

```
API-Football ──► /api/sync ──► Supabase matches
OndeBola     ──► /api/sync-broadcasts ──► Supabase broadcasts
Supabase     ◄── Next.js (wc26.pt) ◄── Utilizador
GA4 + AdSense ──► após consentimento de cookies (anúncios visíveis)
```

## Releases

| Versão | Data | Resumo |
|--------|------|--------|
| **0.3.0** | 2026-06-19 | Branding, destaque, layout 2 colunas, RSS, canais multi-região |
| **0.2.0** | 2026-06-16 | Público + SEO, AdSense, 12 línguas, temas |
| **0.1.0** | 2026-06-13 | MVP login + painel definições + deploy |

Ver [CHANGELOG.md](../CHANGELOG.md) para detalhe completo.
