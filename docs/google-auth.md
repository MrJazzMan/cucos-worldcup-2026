# Autenticação Google (Sign in with Google)

Última actualização: 2026-06-13.

O código da app já está pronto (`AuthButtons`, `/auth/callback`). Falta configurar
**Google Cloud** e **Supabase**.

---

## 1. Google Cloud Console

Projecto criado: **cucos-wc26** ✓

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
