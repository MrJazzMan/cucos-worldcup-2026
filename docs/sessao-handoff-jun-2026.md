# Handoff de sessão — Junho 2026

Documento para retomar trabalho noutra sessão. **Última actualização:** 2026-06-19.  
**Commits recentes em `main`:** `d92df4e` → `91c628e` → `04fe67e` (ver `git log`).

---

## Estado em produção (https://wc26.pt)

| Área | Estado |
|------|--------|
| Homepage | Pública; canais visíveis **sem login**; layout `max-w-7xl` alinhado |
| Favoritos | Estrela clicável nos cards (login opcional); filtro «Os meus jogos» |
| `/fasefinal` | Chave eliminatória — preview FIFA 2026 + bracket simétrico desktop |
| `/eliminatorias` | Redirect 308 → `/fasefinal` |
| `/grupos` | Tabelas com colunas alinhadas (`table-fixed` + `colgroup`) |
| Mobile nav | Bottom bar (Jogos, Grupos, Fase final, Favoritos, Perfil) |
| Animações | Pop estrela (1), hover card (2), pulso ao vivo (3) — ver `globals.css` |

**Já não é necessário:** `NEXT_PUBLIC_SHOW_KNOCKOUTS` (flag removida; `src/lib/features.ts` apagado).

---

## Rotas

| Rota | Ficheiro | Notas |
|------|----------|-------|
| `/` | `src/app/page.tsx` | `MatchesView`; canais sempre carregados |
| `/grupos` | `src/app/grupos/page.tsx` | Classificações API-Football |
| `/fasefinal` | `src/app/fasefinal/page.tsx` | Página canónica eliminatórias |
| `/eliminatorias` | `src/app/eliminatorias/page.tsx` | `permanentRedirect("/fasefinal")` |
| `/conta` | `src/app/conta/page.tsx` | Redirect → `/` (conta no menu Perfil) |

---

## Fase Final — arquitectura

```
src/lib/knockout-bracket.ts      — rondas, placeholders FIFA (KNOCKOUT_SKELETON), buildKnockoutColumns()
src/lib/knockout-bracket-tree.ts — árvore recursiva metade esquerda/direita
src/components/KnockoutBracket.tsx           — wrapper: desktop + mobile
src/components/knockout/KnockoutBracketDesktop.tsx  — lg+: chave simétrica + conectores
src/components/knockout/BracketSlotCard.tsx  — card partilhado (match / preview / TBD)
```

- **Desktop (`lg+`):** metade esquerda (8×32 avos → meia) | centro (Final + 3.º) | metade direita espelhada.
- **Mobile (`< lg`):** colunas horizontais com scroll (layout anterior).
- **Sem jogos na DB:** `preview={true}` — placeholders `2A`, `V73`, etc.
- **Com jogos:** calendário com `MatchCard` abaixo da chave.

Dados: `getKnockoutRounds()` em `matches.ts` — Supabase primeiro, API-Football fallback; broadcasts incluídos.

---

## Modelo de acesso (actualizado)

```
Visitante anónimo  → jogos + grupos + fase final + canais TV + SEO
Utilizador logado  → + favoritos (estrela nos cards) + notificações + perfil
Admin              → /admin (canais)
```

- `ChannelLoginCta` **removido**; `MatchChannels` mostra badges directamente.
- `LoginGate` **não bloqueia** — só banner opcional de erro OAuth (não montado no layout).
- Estrela sem login → abre menu Perfil (`SettingsMenu`).

---

## Micro-animações (`src/app/globals.css`)

| Classe / keyframes | Onde | Duração | reduced-motion |
|--------------------|------|---------|----------------|
| `favourite-pop` / `.favourite-star-pop` | `MatchFavouriteToggle` | 280ms | `animation: none` |
| `.match-card` hover | `MatchCard` (não Featured) | 200ms | sem translateY |
| `live-pulse-ring` / `.live-pulse` | `LivePulseDot` | 1.4s loop | anel off, ponto fixo |
| `rise` / `.animate-rise` | entrada de cards (mount) | 400ms | — |

**Pendente (diff proposto, não aplicado):**

1. **Indicador do dia a deslizar** — barra de pills em `MatchesView.tsx`; medir `getBoundingClientRect`; `.day-tab-indicator` 300ms; sem slide no mount inicial.
2. **Entrada em sequência ao trocar dia** — reutilizar/estender `@keyframes rise`; `animation-delay` ~80ms por card; `key={selectedDay}` no contentor; saída instantânea.

Ver conversa / diff guardado no histórico do agente para Peça 1.

---

## Layout homepage

- Contentor único `max-w-7xl` para barra de dias, café, favoritos e grelha.
- Barra de dias: pills `flex-1` no desktop; indicador coral ainda **inline no botão** (não deslizante).
- Featured + grelha 2 colunas; featured excluído da grelha via `pickFeaturedMatch`.

---

## i18n — Fase Final (PT)

| Chave | Valor |
|-------|-------|
| `knockouts.title` | Fase Final - Eliminatórias |
| `knockouts.previewHint` | Os jogos reais aparecem aqui à medida que o torneio avança. |
| `nav.knockouts` | Eliminatórias (header — ainda não renomeado) |
| `nav.bottom.knockouts` | Fase final |

Subtítulo `knockouts.subtitle` deixou de ser renderizado em `/fasefinal`.

---

## Ficheiros tocados nesta sessão (referência)

**Novos:** `fasefinal/page.tsx`, `KnockoutBracket.tsx`, `knockout/*`, `knockout-bracket.ts`, `knockout-bracket-tree.ts`, `MatchFavouriteToggle.tsx`, `LivePulseDot.tsx`

**Removidos:** `ChannelLoginCta.tsx`, `features.ts`

**Principais alterações:** `MatchesView`, `MatchCard`, `FeaturedMatch`, `MatchChannels`, `matches.ts`, `LoginGate`, `AppHeader`, `BottomNav`, `grupos/page.tsx`, `globals.css`, todos os `locales/*.ts`, `layout.tsx` (footer sem «Produção»)

---

## Workflow acordado

1. Implementar → **commit & push** → utilizador valida em prod (hard refresh).
2. Animações / refactors grandes: **mostrar diff → confirmar → aplicar → commit**.
3. Versão npm: ainda `0.3.0` em `package.json`; changelog preparado como **0.4.0** abaixo.

---

## Próximos passos sugeridos

- [ ] Aplicar Peça 1 + 2 (transição de dia)
- [ ] Actualizar `auth.modal.subtitle` (ainda menciona canais só com login)
- [ ] Opcional: renomear nav header «Eliminatórias» → «Fase final»
- [ ] Quando existirem jogos KO na DB: validar ordem FIFA vs `KNOCKOUT_SKELETON`
- [ ] Refinar conectores do bracket desktop (espessura / alinhamento vertical)
- [ ] Bump `package.json` → `0.4.0` no próximo release tag

---

## Comandos úteis

```bash
npm run dev
npm run build
git log -5 --oneline
vercel --prod   # se deploy manual necessário
```
