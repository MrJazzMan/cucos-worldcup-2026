# Autenticação Google (Sign in with Google)

Última actualização: 2026-06-13 (noite).

O fluxo está implementado e validado em produção (`wc26.pt`). Este guia documenta
a configuração correcta e o troubleshooting dos erros reais que aconteceram.

---

## 1. Google Cloud Console

Projecto criado: **cucos-wc26** ✓  
OAuth client criado ✓ (ficheiro `client_secret_....json` com redirect Supabase correcto)

1. Abre [Google Cloud Console](https://console.cloud.google.com/) → projecto **cucos-wc26**
2. Menu lateral: **Google Auth Platform → Overview**
3. Clica **Create OAuth client** (no ecrã diz "You haven't configured any OAuth clients yet")
4. Tipo: **Web application**
5. Name: `Cucos WC26 Web`
6. **Authorized JavaScript origins:**
   - `https://wc26.pt`
   - `http://localhost:3000`
7. **Authorized redirect URIs** (copiar exactamente):
   ```
   https://vsbmdqzabegcvjupwcpj.supabase.co/auth/v1/callback
   ```
   > ⚠️ É o URL do **Supabase**, não `wc26.pt/auth/callback`. Confirma em
   > Supabase → Authentication → Google → "Callback URL (for OAuth)".
8. **Create** → copia **Client ID** e **Client Secret**

### OAuth consent screen (se ainda não fizeste)

Menu: **Google Auth Platform → Branding** (ou Audience)
- App name: `Cucos WC26`
- User support email: o teu email
- Authorized domains: `wc26.pt`

---

## 2. Supabase

> ⚠️ **Não uses** Settings → OAuth Apps (nível organização "Cuco's Org").
> Isso é para publicar apps que integram *com* o Supabase — não é o login Google.

### Caminho correcto

1. Abre o **projecto** (não a org):  
   [supabase.com/dashboard/project/vsbmdqzabegcvjupwcpj](https://supabase.com/dashboard/project/vsbmdqzabegcvjupwcpj)
2. Menu esquerdo: **Authentication** → **Sign In / Providers** → **Google**
   - Link directo: [Providers → Google](https://supabase.com/dashboard/project/vsbmdqzabegcvjupwcpj/auth/providers?provider=Google)
3. **Enable Google**: ON
4. Colar do ficheiro `.json` do Google (`client_secret_....json`):
   - **Client ID:** campo `client_id` (termina em `.apps.googleusercontent.com`)
   - **Client Secret:** campo `client_secret` (começa por `GOCSPX-`)
5. **Save**

### URL Configuration

**Authentication → URL Configuration**

- **Site URL:** `https://wc26.pt`
- **Redirect URLs** (adicionar **exactamente** estes paths):
  - `https://wc26.pt/auth/callback`
  - `http://localhost:3000/auth/callback`

> ⚠️ Não basta `http://localhost:3000` — tem de incluir `/auth/callback`.
> Se o `code` cair em `/?code=...` em vez de `/auth/callback`, o login falha (500).

---

## 3. Testar

1. Abre https://wc26.pt/conta
2. Clica **Continuar com Google** / **Continue with Google**
3. Autoriza → deve voltar a `/conta` com sessão activa

### Local (localhost:3000)

Para testar login **em local**, confirma também:

**Google Cloud** → Authorized JavaScript origins: `http://localhost:3000`

**Supabase** → Redirect URLs inclui: `http://localhost:3000/auth/callback`

> O botão Google usa `window.location.origin` — em local volta para
> `localhost`, em produção para `wc26.pt`. Isto é normal.

**Supabase Site URL:** pode ser `https://wc26.pt` mesmo testando local; o
`redirectTo` na app sobrepõe-se para o callback correcto.

---

## Troubleshooting

| Erro | Solução |
|------|---------|
| `redirect_uri_mismatch` | O redirect URI no Google deve ser **exactamente** o callback do Supabase (`...supabase.co/auth/v1/callback`), não o da app |
| `unexpected_failure` no login Google | Correr `supabase/migrations/002_fix_auth_trigger.sql` no SQL Editor |
| Volta a `localhost:3000/?code=...` em produção | Confirmar `Site URL = https://wc26.pt` em Supabase URL Configuration; no código o `redirectTo` deve ser `https://wc26.pt/auth/callback` (sem query extra) |
| Volta a `/conta?error=auth` | Verificar Redirect URLs no Supabase; cookies/HTTPS em produção |
| `OAuth client not found` | Client ID errado no Supabase |
| `PKCE code verifier not found in storage` | Garantir que a troca de código acontece no servidor/middleware (`@supabase/ssr`) e não num callback client-only |
| Safari abre página em branco / `FetchEvent.respondWith ... response is null` no callback | Limpar dados de `wc26.pt`/`supabase.co` no Safari e actualizar service worker; versões novas do `sw.js` já ignoram navegação/auth |

### Nota prática (Safari recente)

Em algumas versões, o menu `Develop` pode não aparecer mesmo com opções activadas.
Nesses casos:

1. `Safari > Settings > Privacy > Manage Website Data...`
2. Remover dados de `wc26.pt`, `supabase.co` e `localhost`
3. Fechar e reabrir Safari
4. Testar login novamente em `https://wc26.pt/conta`

---

## Apple (opcional, depois)

Mesmo fluxo em Supabase → Apple, com Apple Developer Service ID e Key.
