# Autenticação Google (Sign in with Google)

Última actualização: 2026-06-13.

O código da app já está pronto (`AuthButtons`, `/auth/callback`). Falta configurar
**Google Cloud** e **Supabase**.

---

## 1. Google Cloud Console

1. Abre [Google Cloud Console](https://console.cloud.google.com/)
2. Cria um projecto (ex.: `cucos-wc26`) ou usa um existente
3. **APIs & Services → OAuth consent screen**
   - Tipo: **External** (ou Internal se for Workspace)
   - App name: `Cucos WC26`
   - User support email: o teu email
   - Authorized domains: `wc26.pt`, `supabase.co`
   - Guardar
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
   - Application type: **Web application**
   - Name: `Cucos WC26 Web`
   - **Authorized JavaScript origins:**
     - `https://wc26.pt`
     - `http://localhost:3000`
   - **Authorized redirect URIs:**
     - `https://vsbmdqzabegcvjupwcpj.supabase.co/auth/v1/callback`
     - (copia o URL exacto em Supabase → Authentication → Google → Callback URL)
5. Copia o **Client ID** e **Client Secret**

---

## 2. Supabase

1. [Supabase Dashboard](https://supabase.com/dashboard) → projecto `cucos-worldcup-2026`
2. **Authentication → Providers → Google**
   - Enable: **ON**
   - Client ID: colar do Google
   - Client Secret: colar do Google
   - Guardar
3. **Authentication → URL Configuration**
   - Site URL: `https://wc26.pt`
   - Redirect URLs (adicionar todos):
     - `https://wc26.pt/auth/callback`
     - `http://localhost:3000/auth/callback`

---

## 3. Testar

1. Abre https://wc26.pt/conta
2. Clica **Continuar com Google** / **Continue with Google**
3. Autoriza → deve voltar a `/conta` com sessão activa

### Local

```bash
npm run dev
# http://localhost:3000/conta
```

---

## Troubleshooting

| Erro | Solução |
|------|---------|
| `redirect_uri_mismatch` | O redirect URI no Google deve ser **exactamente** o callback do Supabase (`...supabase.co/auth/v1/callback`), não o da app |
| Volta a `/conta?error=auth` | Verificar Redirect URLs no Supabase; cookies/HTTPS em produção |
| `OAuth client not found` | Client ID errado no Supabase |

---

## Apple (opcional, depois)

Mesmo fluxo em Supabase → Apple, com Apple Developer Service ID e Key.
