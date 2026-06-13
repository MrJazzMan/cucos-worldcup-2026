# Documentação — Cucos WC26

Documentação interna do projecto. **Vai para o GitHub, não vai para o Vercel** (ver [`.vercelignore`](../.vercelignore)).

Última actualização: 2026-06-13 (noite).

## Índice

| Documento | Conteúdo |
|-----------|----------|
| [historico-e-setup.md](historico-e-setup.md) | Tudo o que fizemos: stack, Supabase, Vercel, domínio, dados reais |
| [data-sources.md](data-sources.md) | API-Football, OndeBola, sync |
| [deploy.md](deploy.md) | Vercel, variáveis, crons, pós-deploy |
| [notifications.md](notifications.md) | Web Push, preferências, cron |
| [operacoes.md](operacoes.md) | Comandos do dia-a-dia (sync, admin, troubleshooting) |
| [google-auth.md](google-auth.md) | Sign in with Google (passo-a-passo) |

Notas recentes:
- OAuth Google estabilizado em produção (`wc26.pt`) com callback SSR e troubleshooting Safari.
- Live sync actualizado para fechar correctamente jogos que saem de `live` para `finished`.

## Links rápidos

- **Produção:** https://wc26.pt
- **Admin canais:** https://wc26.pt/admin
- **GitHub:** https://github.com/MrJazzMan/cucos-worldcup-2026
- **Vercel:** projecto `cucos-worldcup-2026`
- **Supabase:** projecto `cucos-worldcup-2026`

## Arquitectura resumida

Ver também [ARCHITECTURE.md](../ARCHITECTURE.md) na raiz do repo.

```
API-Football ──► /api/sync ──► Supabase matches
OndeBola     ──► /api/sync-broadcasts ──► Supabase broadcasts
Supabase     ◄── Next.js (wc26.pt) ◄── Utilizador
```
