# Lições aprendidas — Cucos WC26

Registo cumulativo em português de Portugal. Organizado por **frente** e **data** (`yyyy-mm-dd`). Entradas curtas e didáticas para reutilizar em projetos futuros.

---

## Segurança

### 2026-06-21 — Escalonamento de privilégios via `profiles.role` (achado crítico)

**Problema:** A política RLS `profiles_update_own` permitia que qualquer utilizador autenticado fizesse `UPDATE` na própria linha de `profiles`. Como a coluna `role` estava incluída nesse update, um atacante podia enviar `{ role: 'admin' }` com a **chave anónima** no browser e tornar-se administrador.

**Princípio:** Com Supabase no cliente, a `NEXT_PUBLIC_SUPABASE_ANON_KEY` é pública. A proteção real dos dados é o **RLS + privilégios de coluna**, não esconder a chave.

**Correcção (defesa em profundidade, migration `015`):**

1. `REVOKE UPDATE ON profiles` para `anon` e `authenticated`.
2. `GRANT UPDATE` apenas nas colunas legítimas (`display_name`, `location`, `email`, etc.) — **não** em `role` nem `calendar_token`.
3. Trigger `protect_profile_sensitive_columns` repõe `role` e `calendar_token` se alguém contornar os GRANTs.
4. `REVOKE EXECUTE` em funções `SECURITY DEFINER` expostas ao PostgREST.

**Armadilha PostgreSQL:** `REVOKE UPDATE (role) ON profiles` **não basta** quando existe `GRANT UPDATE` na tabela inteira — o grant de tabela prevalece. É preciso revogar UPDATE na tabela e voltar a conceder só coluna a coluna.

**Verificação:** `scripts/test-profiles-rls-escalation.mjs` — utilizador temporário tenta `UPDATE role = 'admin'`; deve falhar com *permission denied* ou sem efeito na BD.

---

### 2026-06-21 — Painel admin separado do `CRON_SECRET`

**Problema:** O painel `/admin` guardava `CRON_SECRET` em `localStorage` e enviava-o nos pedidos. Quem tivesse acesso ao browser (ou XSS) podia reutilizar o segredo para endpoints de cron.

**Correcção:**

- Admin humano: sessão Google + verificação `isSiteAdmin(user.id)` em `requireAdminOrCron()`.
- Scripts/cron Vercel: header `Authorization: Bearer CRON_SECRET` com comparação `timingSafeEqual`.
- Removido armazenamento do segredo no cliente.

**Lição:** Segredos de automação (cron) e autenticação humana (OAuth) devem ser canais distintos. Nunca persistir segredos de servidor no browser.

---

### 2026-06-21 — Endpoints admin e PII

**Problema:** `GET /api/sync-profiles` devolvia emails de todos os perfis a quem tivesse o `CRON_SECRET`.

**Correcção:** GET restrito ao admin autenticado (apenas contagem). POST de backfill mantém-se para cron/admin mas a resposta não inclui PII.

**Lição:** Endpoints com poder elevado devem assumir que credenciais vazam; minimizar dados na resposta.

---

### 2026-06-21 — CSP e cabeçalhos de segurança

**Lição:** Em apps Next.js com OAuth, Analytics e AdSense, uma CSP restritiva (`src/lib/security-headers.ts`) reduz superfície XSS. Combinar com HSTS em produção.

---

### 2026-06-24 — Anti-scraping em camadas (a porta nunca fecha 100%)

**Contexto:** Um site público para SEO é, por definição, copiável — o mesmo canal que serve o Google serve o scraper. Não há cadeado; só dissuasores que aumentam o custo de copiar.

**Camadas (cada uma fecha um buraco da anterior):**
1. `robots.txt` — pedido educado; só bots honestos respeitam.
2. Middleware bloqueia por **User-Agent** conhecido (`403`) — apanha quem se identifica.
3. Middleware faz **rate limiting por IP** (`429`, default 60/min) — apanha o scraper com UA de browser falso, que as camadas 1–2 não distinguem de um humano.

**Princípios de implementação:** o rate limiter é **no-op sem config** (não parte dev nem deploy antes do Redis) e **fail-open** em erro de infra (nunca bloqueia utilizador real). Isenta `/api/`, `/feed/`, `/calendar/` (crons/QStash/URLs secretas).

**Lição:** Camadas agressivas demais bloqueiam o Google e partilhas legítimas (já aconteceu: `robots` bloqueava o `FacebookBot` → previews partidos). O ativo a proteger não é o HTML (vem da API-Football) mas a **curadoria** — e essa já está atrás de login. Rate-limitar por *comportamento* protege sem tocar no SEO.

---

### 2026-06-24 — Investigar utilizador suspeito (humano vs bot)

**Contexto:** Apareceu um utilizador «bot bot» (`botebotas23@gmail.com`). Como o login é **Google OAuth apenas**, qualquer perfil tem um email verificado por uma pessoa — scrapers automáticos não fazem login. Era um humano curioso (2 páginas, 1 sessão, ~40s, 0 ativações).

**Ferramenta:** `scripts/inspect-user.mjs <email>` — relatório read-only (identidade, `page_visits`, favoritos/push) + heurística de cadência. O **IP não está na BD**; vê-se nos logs da Vercel pelos timestamps.

**Lição:** O risco de scraping vem de **anónimos disfarçados** (camada 3), não de utilizadores logados. Distinguir os dois evita banir humanos por engano.

---

## RGPD e privacidade

### 2026-06-21 — Google Analytics antes do consentimento (Consent Mode v2)

**Achado:** O banner já controlava o AdSense (unidades só com `adsAllowed`), mas o GA4 carregava `gtag/js` e chamava `gtag('config', …, { send_page_view: true })` **sempre** — mesmo com `analytics_storage: denied`, o script fazia pedidos a `google-analytics.com` antes do utilizador decidir.

**Correcção:** Consent Mode v2 inline no `<head>` **antes** de qualquer script Google (`ad_*` e `analytics_storage: denied`). O GA4 só é injectado em `loadGoogleAnalytics()` depois de aceitar no banner; `gtag('consent', 'update')` sem reload. AdSense mantém tag no HTML (verificação crawler) mas com `ad_storage: denied` até aceitar; unidades continuam gated por `adsAllowed`.

**Lição:** Consent Mode «denied» por defeito não basta se o `gtag('config')` corre na mesma — para e-Privacy/RGPD, **não carregar** o script de Analytics até consentimento. Testar na rede (DevTools) em janela anónima.

---

### 2026-06-21 — Eliminação de conta (direito ao esquecimento)

**O quê:** `DELETE /api/account` — valida sessão no servidor (`getUser`), apaga só o utilizador autenticado (nunca ID do cliente). UI em zona de perigo no perfil com checkbox de confirmação.

**Como:** `auth.admin.deleteUser` com service role. Tabelas `profiles`, `favourite_teams`, `notification_prefs`, `push_subscriptions`, `notification_log` têm `ON DELETE CASCADE` em `auth.users` — um único delete cobre tudo.

**Lição:** Operações destrutivas exigem confirmação deliberada na UI e autorização só via sessão servidor. Bloquear conta admin do site (`isSiteAdmin`) para evitar lockout acidental.

---

### 2026-06-21 — Inventário antes de políticas

**Lição:** Antes de actualizar a política de privacidade ou DPA, fazer inventário de dados (tabelas, cookies, terceiros, regiões). Ver `docs/rgpd-inventario-dados.md`. O código e a política publicada devem estar alinhados.

---

## Base de dados e Supabase

### 2026-06-21 — Tokens iCal com expiração

**Decisão:** `calendar_token` + `calendar_token_created_at`; feed rejeita tokens com mais de 365 dias. Rotação pelo utilizador no menu. Coluna protegida contra UPDATE pelo cliente (como `role`).

---

## Frontend e i18n

### 2026-06-21 — Skeletons de carregamento na homepage

**Problema:** Entre abrir a página e os dados do Supabase chegarem, a homepage mostrava ecrã vazio (`Suspense fallback={null}`) ou blocos genéricos `animate-pulse` sem forma reconhecível (só durante hidratação do `SettingsProvider`).

**Correcção:** Componentes skeleton em `src/components/skeleton/` que imitam a forma real — grelha de dias, jogo em destaque, cards da grelha, «Próximos jogos de Portugal» e «Classificações do dia». Shimmer subtil (~1,5s, ease-in-out) via `.skeleton-shimmer` em `globals.css`; estático com `prefers-reduced-motion`. `src/app/loading.tsx` durante o fetch RSC; `HomePageSkeleton` reutilizado em `MatchesView` enquanto `!mounted`. Sem skeleton em secções instantâneas (banners, AdSense) nem em `router.refresh()` (dados actualizam in-place).

**Lição:** Skeletons devem reservar o layout final (bandeiras circulares, badges de canal, tabelas compactas) e aparecer só no intervalo de espera real — não substituir estados vazios legítimos (`PortugalUpcoming` / `DayStandings` devolvem `null` quando não há dados).

---

### 2026-06-21 — Módulo «Classificações do dia» na homepage

**O quê:** Resumo contextual das classificações dos grupos com jogos no dia seleccionado na grelha, mais o grupo de Portugal enquanto estiver na fase de grupos (mesmo sem jogo nesse dia).

**Como:** `getDayStandingsGroups()` em `day-standings.ts` cruza jogos do dia com `group_standings`; `DayStandings` reage a `selectedDay` no cliente; tabela compacta extraída para `GroupStandingsTable` (variante `compact` vs `full` em `/grupos`).

**Lição:** Reutilizar dados e ordenação de `getGroupStandings()` — não recalcular desempates no módulo. Esconder o bloco inteiro quando não há grupos relevantes (ex. dia só de eliminatórias).

---

### 2026-06-20 — `pt-PT` `month: "short"` devolve mês numérico

**Problema:** `Intl.DateTimeFormat("pt-PT", { month: "short" })` pode devolver `"06"` em vez de `"jun."`.

**Correcção:** Em `formatShortMatchDate`, detectar mês só numérico e usar `month: "long"` como fallback.

---

## Dados e integrações

### 2026-06-20 — Canal «LV» na TV

**Descoberta:** «LV» não vinha da API nem do scrape OndeBola — era preset manual no admin (`LiveModeTv`, YouTube `UCpcTrCXblq78GZrTUTLWeBw`). O sync preserva canais manuais via `mergeBroadcastChannels`.

---

## Testes e qualidade

### 2026-06-23 — Primeira suite de testes + bug na árvore do bracket

**Contexto:** O projecto não tinha testes. Ao escrever testes para a lógica da fase final, a validação de topologia revelou dois bugs na árvore desktop (`buildSideTree`).

**Infra (sem dependências novas):** `node:test` + type-stripping nativo (Node ≥ 22.18) + um loader ESM (`scripts/test-support/ts-alias-loader.mjs`) que resolve o alias `@/`. `npm test` corre `tests/*.test.mjs`.

**Bugs encontrados:**
1. **Slots de QF lidas de `r16`** — a coluna de quartos mostrava jogos dos dezasseis-avos.
2. **Split de metades contíguo** (`r16Base 0..3 / 4..7`) incompatível com `SF M101 = V97 vs V98` — emparelhava M97 com M99 em vez de M97 com M98.

**Correcção:** Topologia tabelada (índices) → **especificação declarativa** (`SIDE_TREE_SPEC` em `knockout-fifa-order.ts`, árvore literal de números FIFA) + walk recursivo `buildNode`. Ver [testes-fase-final.md](testes-fase-final.md).

**Lições:**
- **Topologia de bracket descreve-se com dados declarativos, não tabelas de índices** — a árvore literal é auto-documentada e impossível de desalinhar das meias-finais.
- **O `KNOCKOUT_SKELETON` é a fonte de verdade**; qualquer vista (mobile/desktop) tem de o reproduzir. O teste compara a árvore com ele por identidade de referência.
- **Testes de invariantes** («cada ronda consome a anterior uma vez», «cada nó = vencedores dos filhos») apanham bugs estruturais invisíveis em modo preview.

---

## Como acrescentar entradas

No fim de cada trabalho relevante, adicionar uma subsecção `### yyyy-mm-dd — Título` na frente correcta (ou criar nova frente). Incluir: contexto, decisão/correcção, e lição reutilizável.
