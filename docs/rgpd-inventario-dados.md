# Inventário de dados pessoais — Cucos WC26

**Data do levantamento:** 2026-06-21  
**Âmbito:** diagnóstico apenas (sem alterações ao site).  
**Base legal de referência:** RGPD / política em `src/lib/privacy-content.ts`.

Legenda de regiões: **UE** = Espaço Económico Europeu; **EUA** = Estados Unidos; **Global** = rede edge/CDN multi-região.

---

## Resumo por tipo de dado

| Tipo de dado | Tabela / local | Como é recolhido | Onde fica guardado | Processadores e região | Retenção | Fora da UE |
|--------------|----------------|------------------|--------------------|-------------------------|----------|------------|
| Identificador de conta (UUID) | `auth.users.id` → FK em várias tabelas | Criação automática no registo | Supabase Auth + Postgres (`eu-central-1`, Frankfurt) | Supabase (UE) | Enquanto conta activa; CASCADE ao apagar user | Possível réplica/backoffice Supabase (EUA) conforme DPA Supabase |
| E-mail | `auth.users.email`, `profiles.email` | Google OAuth (Supabase Auth); cópia em `profiles` via `ProfileSync` / trigger `handle_new_user`; backfill admin/cron | Supabase | Supabase (UE); Google OAuth (EUA, possível processamento global Google) | Conta activa; eliminação a pedido | Google (EUA); ver SCCs Google |
| Nome de exibição | `profiles.display_name`, `auth.users` metadata | Google OAuth (`full_name`/`name`); editável em Definições → Perfil (`PATCH /api/profile`) | Supabase | Supabase (UE); Google no login | Conta activa | Google no login (EUA) |
| URL do avatar | `profiles.avatar_url`, metadata OAuth | Google OAuth | Supabase (URL aponta para Google CDN) | Supabase (UE); imagem hospedada Google | Conta activa | Google CDN (global) |
| Localização (texto livre) | `profiles.location` | Formulário de perfil; pré-preenchimento opcional via detecção IP (`ipapi.co` em `ProfileSync`) | Supabase | Supabase (UE); ipapi.co (EUA — ver nota) | Conta activa | ipapi.co: pedido browser→EUA |
| País/cidade de registo | `profiles.signup_country` | Uma vez, no primeiro login: `ProfileSync` + `ipapi.co` se campo vazio | Supabase | Idem | Conta activa | ipapi.co (EUA) |
| Idioma preferido | `profiles.preferred_lang` | `ProfileSync` ao mudar idioma na app | Supabase | Supabase (UE) | Conta activa | — |
| Papel interno (`user`/`admin`) | `profiles.role` | Definido na BD (default `user`); **não** pelo cliente | Supabase | Supabase (UE) | Conta activa | — |
| Última visita | `profiles.last_seen_at` | `page.tsx` actualiza em cada sessão autenticada | Supabase | Supabase (UE) | Conta activa | — |
| Token feed iCal | `profiles.calendar_token`, `calendar_token_created_at` | Gerado em `POST /api/profile/calendar` (service role) | Supabase | Supabase (UE) | 365 dias (`CALENDAR_TOKEN_MAX_AGE_MS`); depois feed inválido até regenerar | — |
| Equipas favoritas | `favourite_teams` (`team_id`, `team_name`) | UI favoritos / definições | Supabase | Supabase (UE) | Conta activa | — |
| Preferências de notificação | `notification_prefs` (booleans) | Definições → Notificações | Supabase | Supabase (UE) | Conta activa | — |
| Subscrição Web Push | `push_subscriptions` (`endpoint`, `p256dh`, `auth`) | Browser após consentimento; `POST /api/push` | Supabase | Supabase (UE); entrega via FCM/Mozilla/etc. do browser | Conta activa até remover subscrição | Push: endpoints dos browsers (ex. Google FCM EUA) |
| Log de notificações | `notification_log` (`user_id`, `fixture_id`, `type`, `sent_at`) | Cron `GET /api/push` | Supabase | Supabase (UE) | Sem política de purge automática no código; ligado à conta | — |
| Sessão / tokens JWT | Cookies Supabase (`sb-*`), storage auth | Login Google OAuth | Browser + Supabase Auth | Supabase (UE) | Duração da sessão / refresh Supabase | — |
| Consentimento cookies | `localStorage` `cucos-cookie-consent` | Banner `CookieConsent` | Apenas browser | — | Até utilizador apagar | — |
| Tema, idioma UI, fuso | `localStorage` `cucos-lang`, `cucos-theme`, `cucos-tz` | Definições (`SettingsProvider`) | Apenas browser | — | Até apagar | — |
| Analytics (se consentimento) | Cookies `_ga`, `_gid`, etc. | `GoogleAnalytics` após aceitar cookies | Google | Google Analytics (EUA; opção UE depende config GA4) | ~14–26 meses (política Google) | Sim, se não restrito a UE |
| Publicidade (se consentimento) | Cookies AdSense | `AdSenseUnit` após aceitar | Google | Google AdSense (EUA) | Conforme Google | Sim |
| Performance / Web Vitals | Dados agregados Vercel | `@vercel/analytics`, `@vercel/speed-insights` em `layout.tsx` | Vercel | Vercel (EUA, edge global) | Conforme Vercel | Sim (EUA) |
| IP no pedido HTTP | Logs Vercel / middleware | Qualquer visita | Vercel | Vercel | Conforme Vercel (~30 dias logs típicos) | Sim |
| IP para país (opcional) | Não persistido directamente | `fetch('https://ipapi.co/json/')` no browser | Resposta transitória; só `signup_country`/`location` persistem se guardados | ipapi.co | N/A no servidor | Pedido pode sair da UE |

**Dados não pessoais (contexto):** tabelas `matches`, `broadcasts`, `group_standings`, `live_sync_slots` — dados públicos de jogos/TV; sem identificação de utilizadores.

---

## Detalhe por fonte de recolha

### Login Google (OAuth)

- **Fluxo:** `AuthButtons` → `signInWithOAuth('google')` → callback `/auth/callback`.
- **Dados:** e-mail, nome, foto (metadata OAuth).
- **Destino:** `auth.users` (Supabase) + `profiles` via trigger `handle_new_user`.

### Perfil voluntário

- **Fluxo:** menu Definições; `GET/PATCH /api/profile` (display_name, location).
- **Limites:** 80 / 120 caracteres (`MAX_DISPLAY_NAME`, `MAX_LOCATION`).

### Sincronização automática de perfil

- **Componente:** `ProfileSync.tsx` — email, `preferred_lang`, `signup_country`, `location` (detecção).
- **Detecção de país:** chamada client-side a `ipapi.co` (incluído na CSP `connect-src`).

### Favoritos e notificações

- **Favoritos:** `MatchFavouriteToggle`, `SettingsFavourites` → `favourite_teams`.
- **Prefs:** `SettingsNotifications` → `notification_prefs`.
- **Push:** subscrição browser → `POST /api/push`; envio em cron com `VAPID_*`.

### Calendário iCal

- **Rotas:** `/api/profile/calendar`, feed público com token opaco na URL.
- **Risco:** quem tem o URL vê jogos das equipas favoritas desse utilizador (sem nome/email no feed).

### Admin / cron (sem dados de utilizadores finais no cliente)

- `sync-profiles`, `sync`, `sync-broadcasts`, `push` — usam service role no servidor; não expõem PII ao browser.

---

## Processadores externos

| Processador | Função | Região / notas | Dados pessoais envolvidos |
|-------------|--------|----------------|---------------------------|
| **Supabase** | Postgres, Auth, RLS | Projeto `eu-central-1` (Frankfurt, UE) | Todos os dados de conta/perfil listados acima |
| **Vercel** | Hosting, crons, Analytics, Speed Insights | Empresa EUA; execução edge global | IP, logs, métricas agregadas |
| **Google** | OAuth, Analytics, AdSense | EUA (infra global) | E-mail, nome, foto; analytics/ads se consentimento |
| **Upstash QStash** | Agendamento sync live por jogo | EUA (Upstash) | URL de callback (`SITE_URL`); sem PII directa nos payloads típicos |
| **API-Football** | Fixtures/resultados | Fornecedor terceiro (chave servidor) | Sem PII de utilizadores |
| **OndeBola** (scrape) | Canais TV | Portugal / servidor scrape | Sem PII |
| **ipapi.co** | Geolocalização aproximada por IP | EUA (inferido) | IP do visitante (pedido browser) |
| **Web Push (FCM/APNs/etc.)** | Entrega de notificações | Conforme browser/OS | `endpoint` + chaves push |

---

## Retenção e eliminação

| Categoria | Política actual no código / docs |
|-----------|-----------------------------------|
| Conta e perfil | Mantidos enquanto `auth.users` existir; **eliminação self-service** em Definições → Perfil → «Apagar conta» (`DELETE /api/account`); `ON DELETE CASCADE` limpa `profiles`, favoritos, prefs, push, `notification_log` |
| Token iCal | Expira ao fim de 365 dias desde `calendar_token_created_at`; utilizador pode regenerar |
| `notification_log` | Sem job de limpeza automática identificado |
| Cookies opcionais | Até retirar consentimento ou apagar storage |
| Analytics / Vercel | Políticas dos fornecedores (14–26 meses referido na política de privacidade) |

**Eliminação de conta:** implementada na UI (Definições → Perfil). Confirmação deliberada + `DELETE /api/account` com sessão validada no servidor; `auth.admin.deleteUser` com CASCADE nas tabelas `public.*`.

~~**Gap identificado:** não há fluxo self-service de «apagar conta» na UI; eliminação depende de pedido manual ao responsável (`miguelopesgarcia@gmail.com`).~~

**Resolvido (2026-06-21):** fluxo self-service «Apagar conta» no menu de definições.

---

## Transferências fora da UE (síntese)

| Fluxo | Provável transferência |
|-------|------------------------|
| Google OAuth / Analytics / AdSense | EUA (SCCs típicas Google) |
| Vercel hosting e analytics | EUA + edge global |
| QStash (Upstash) | EUA |
| ipapi.co (detecção país) | Pedido do browser para serviço fora da UE |
| Web Push | Endpoints Google/Mozilla conforme browser |
| Supabase `eu-central-1` | Dados primários na UE; ver DPA Supabase para subprocessadores |

---

## Próximos passos sugeridos (fora do âmbito deste diagnóstico)

1. Alinhar política de privacidade com este inventário (ipapi.co, QStash, Vercel Analytics).
2. Documentar DPA/SCCs por processador.
3. Definir política de retenção para `notification_log` e logs.
4. Avaliar substituto UE para geolocalização ou consentimento explícito.
5. ~~Implementar eliminação de conta (RGPD art. 17).~~ **Feito** — ver `DELETE /api/account` e `SettingsDeleteAccount`.
