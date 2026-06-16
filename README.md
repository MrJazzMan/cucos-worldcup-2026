# Cucos World Cup 2026

**v0.2.0** — Aplicação web responsiva para adeptos portugueses seguirem o Mundial FIFA 2026.

Responde rapidamente a:
- Que jogos há hoje?
- A que horas começam (hora de Portugal)?
- Que canais de TV portugueses transmitem?
- O jogo está por começar, ao vivo ou terminado?

## Stack

- **Frontend:** Next.js 15, TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, RLS)
- **Dados:** API-Football + curadoria manual de canais TV PT
- **Deploy:** Vercel

## Desenvolvimento local

```bash
cp .env.example .env.local
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

## Variáveis de ambiente

Ver [.env.example](.env.example).

## Documentação

Documentação completa em [`docs/`](docs/) (GitHub only — excluída do deploy Vercel).

- [docs/README.md](docs/README.md) — índice
- [CHANGELOG.md](CHANGELOG.md) — releases
- [docs/seo.md](docs/seo.md) — checklist SEO
- [docs/setup-analytics-ads.md](docs/setup-analytics-ads.md) — GA4 + AdSense

## Licença

Uso pessoal — Miguel Garcia, 2026.
