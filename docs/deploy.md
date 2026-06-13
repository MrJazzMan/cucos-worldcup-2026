# Deploy Vercel

Última actualização: 2026-06-13.

> A pasta `docs/` **não é enviada para o Vercel** — ver [`.vercelignore`](../.vercelignore). Fica só no GitHub.

## Pré-requisitos

1. Conta [Vercel](https://vercel.com)
2. Projecto [Supabase](https://supabase.com) com migration aplicada
3. Chave API-Football (opcional — fallback para dados mock)
4. Conta Apple Developer (Sign in with Apple)

## Passos

### 1. Supabase

```bash
# No dashboard Supabase → SQL Editor
# Executar supabase/migrations/001_initial_schema.sql
```

Configurar Auth providers:
- Google OAuth (Client ID + Secret)
- Apple OAuth (Service ID, Key, Team ID)

Redirect URLs:
- `https://<dominio>/auth/callback`
- `http://localhost:3000/auth/callback`

### 2. GitHub

```bash
git init
git add .
git commit -m "feat: MVP Cucos World Cup 2026"
git remote add origin git@github.com:MrJazzMan/cucos-worldcup-2026.git
git push -u origin main
```

### 3. Vercel

1. Importar repo no Vercel
2. Framework: Next.js (auto-detectado)
3. Adicionar variáveis de ambiente (ver `.env.example`)
4. Deploy

### 4. Variáveis obrigatórias

| Variável | Descrição |
|----------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anon |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role (sync, push, admin) |
| `API_FOOTBALL_KEY` | Chave API-Football |
| `CRON_SECRET` | Token para proteger crons |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Chave pública Web Push |
| `VAPID_PRIVATE_KEY` | Chave privada Web Push |
| `NEXT_PUBLIC_SITE_URL` | URL de produção |

Gerar VAPID:
```bash
npx web-push generate-vapid-keys
```

### 5. Domínio custom

No Vercel → Settings → Domains → adicionar domínio (ex: `wc26.cucos.pt`).

Actualizar `NEXT_PUBLIC_SITE_URL` e redirect URLs no Supabase.

### 6. Pós-deploy

```bash
# Sync inicial
curl -H "Authorization: Bearer $CRON_SECRET" https://<dominio>/api/sync

# Seed broadcasts Portugal
curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://<dominio>/api/seed-broadcasts
```

## Crons

Definidos em `vercel.json`:
- Sync live: cada minuto
- Sync completo: cada 5 minutos
- Push notifications: cada minuto

Nota: plano Vercel Hobby limita crons a 1x/dia. Para produção durante o torneio, usar plano Pro ou Supabase Edge Functions como alternativa.
