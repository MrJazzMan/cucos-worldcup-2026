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
| `SITE_URL` | URL pública (`https://wc26.pt`) — callbacks QStash |
| `QSTASH_URL` | Região QStash (ex. `https://qstash-eu-central-1.upstash.io`) |
| `QSTASH_TOKEN` | Token Upstash QStash |
| `QSTASH_CURRENT_SIGNING_KEY` | Verificação webhooks QStash |
| `QSTASH_NEXT_SIGNING_KEY` | Rotação signing keys |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Chave pública Web Push |
| `VAPID_PRIVATE_KEY` | Chave privada Web Push |
| `NEXT_PUBLIC_SITE_URL` | URL de produção |

Gerar VAPID:
```bash
npx web-push generate-vapid-keys
```

### 5. Domínio custom

Domínio actual: **`wc26.pt`** (comprado em dominios.pt por 1€).

No Vercel → Settings → Domains → adicionar `wc26.pt`.

Registos DNS (zona em dominios.pt):

| Tipo | Nome | Valor |
|------|------|-------|
| A | `@` | `216.198.79.1` |
| CNAME | `www` | `cname.vercel-dns.com` |

Actualizar `NEXT_PUBLIC_SITE_URL=https://wc26.pt` e redirect URLs no Supabase.

#### Nota: actualização de IP do Vercel (Jun 2026)

O Vercel passou a recomendar um novo registo **A** devido à expansão da gama de IPs:

- **Antigo:** `76.76.21.21` (continua a funcionar)
- **Novo (recomendado):** `216.198.79.1` ✅ já aplicado

O IP antigo continua a servir, por isso a troca não causa downtime. Depois de
mudar o valor em dominios.pt, carrega em **Refresh** no Vercel → Domains para
revalidar. A propagação pode demorar de minutos a algumas horas.

### 6. Pós-deploy

```bash
# Sync inicial
curl -H "Authorization: Bearer $CRON_SECRET" https://<dominio>/api/sync

# Seed broadcasts Portugal
curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://<dominio>/api/seed-broadcasts
```

## Crons

Definidos em `vercel.json` (plano Hobby = 1×/dia cada):

| Hora UTC | Path | Função |
|----------|------|--------|
| 05:00 | `/api/sync/schedule` | Agenda slots QStash (próx. 48 h) |
| 06:00 | `/api/sync` | Sync completo API-Football + agenda |
| 07:00 | `/api/sync-broadcasts?today=1` | Canais OndeBola |

**Sync live durante jogos:** Upstash QStash (não Vercel cron). Ver [operacoes.md](operacoes.md).

O Vercel envia `Authorization: Bearer $CRON_SECRET` automaticamente nos crons.
