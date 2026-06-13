# Notificações Web Push

Última actualização: 2026-06-13.

## Tipos de alerta

| Tipo | Momento |
|------|---------|
| `before_24h` | 24 horas antes do pontapé de saída |
| `before_1h` | 1 hora antes |
| `before_15m` | 15 minutos antes |
| `match_started` | Início do jogo |
| `final_result` | Resultado final |

## Fluxo

1. Utilizador activa notificações em `/conta`
2. Browser regista subscription → `push_subscriptions`
3. Vercel Cron (`/api/push`) corre a cada minuto
4. Para cada utilizador com equipas favoritas, verifica jogos próximos
5. Envia push via `web-push` (VAPID)
6. Regista em `notification_log` para evitar duplicados

## Requisitos

- Service Worker em `/public/sw.js`
- Chaves VAPID em variáveis de ambiente
- HTTPS em produção (Vercel)

## Equipas favoritas

Notificações só para jogos onde pelo menos uma equipa favorita participa.
