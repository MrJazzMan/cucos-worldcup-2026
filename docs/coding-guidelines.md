# Coding Guidelines (Humano + AI)

Última actualização: 2026-06-13.

Este guia define como manter o código legível, consistente e fácil de manter,
sem transformar os ficheiros em "paredes" de comentários.

> Nota: a pasta `docs/` fica no GitHub e está excluída do deploy na Vercel.

---

## 1) Princípio base

- Código deve ser claro por si: nomes bons primeiro, comentários depois.
- Comentários explicam o **porquê** e a decisão, não o óbvio.
- Estruturar por blocos curtos para leitura rápida (humano e AI).

---

## 2) Comentários: quando usar

Usar comentário quando houver:

- regra de negócio não evidente;
- workaround técnico;
- trade-off importante;
- comportamento inesperado de API/serviço externo.

Evitar comentário quando apenas repete o código.

### Bom exemplo

```ts
// Live feed pode remover jogos assim que passam para FT.
// Incluímos hoje/ontem para garantir transição live -> finished.
```

### Mau exemplo

```ts
// Incrementa i em 1
i++;
```

---

## 3) Estrutura por blocos (ficheiros grandes)

Em componentes/rotas com muita lógica, separar com secções curtas:

- `// Helpers`
- `// Derived state`
- `// Effects`
- `// Handlers`
- `// Render`

Objetivo: permitir "scan" rápido sem scroll infinito confuso.

---

## 4) Nomes e funções

- Preferir nomes explícitos: `fetchFixturesByDate` > `fetchData`.
- Funções pequenas e com 1 responsabilidade.
- Se função crescer, extrair para helper com nome semântico.
- Evitar siglas locais pouco claras.

---

## 5) Regras para código orientado a AI

- Manter imports e tipos limpos (sem lixo morto).
- Evitar duplicação: extrair utilitários.
- Em decisões sensíveis (auth, sync, segurança), deixar comentário curto de contexto.
- Não esconder lógica crítica em "magic values" sem explicação.

---

## 6) Segurança (obrigatório)

- Não confiar em IDs enviados pelo cliente para ações sensíveis.
- Em rotas administrativas/cron: falhar fechado se segredo ausente.
- Nunca commitar segredos (`.env`, keys, tokens).
- Validar input de API (`400`) e autenticação (`401`) sempre que aplicável.

---

## 7) Estilo de commits

- Prefixos: `feat`, `fix`, `docs`, `refactor`, `security`.
- Mensagem curta no título + 1 bloco de contexto no corpo.
- Focar no impacto ("porquê"), não só no detalhe técnico.

---

## 8) Checklist rápida antes de push

- `npm run build` sem erros.
- Rotas alteradas com validação de auth adequada.
- Comentários apenas onde ajudam.
- Sem segredos nos diffs.
- Documentação atualizada se o comportamento mudou.
