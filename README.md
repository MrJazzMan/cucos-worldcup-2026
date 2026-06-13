# Cucos World Cup 2026

Aplicação web responsiva para adeptos portugueses seguirem o Mundial FIFA 2026.

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
- [docs/historico-e-setup.md](docs/historico-e-setup.md) — tudo o que fizemos
- [docs/operacoes.md](docs/operacoes.md) — sync, admin, troubleshooting
- [ARCHITECTURE.md](ARCHITECTURE.md)
- [docs/data-sources.md](docs/data-sources.md)
- [docs/deploy.md](docs/deploy.md)
- [docs/notifications.md](docs/notifications.md)

## Licença

Uso pessoal — Miguel Garcia, 2026.
