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

## Como acrescentar entradas

No fim de cada trabalho relevante, adicionar uma subsecção `### yyyy-mm-dd — Título` na frente correcta (ou criar nova frente). Incluir: contexto, decisão/correcção, e lição reutilizável.
