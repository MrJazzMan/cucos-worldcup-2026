# Configurar Google Analytics e AdSense — wc26.pt

Guia passo-a-passo para Miguel.

---

## Parte 1 — Google Analytics (15 min)

1. Abre [analytics.google.com](https://analytics.google.com) com a tua conta Google.
2. **Admin** (engrenagem) → **Criar** → **Propriedade**.
3. Nome: `Cucos WC26` | Fuso: `Portugal` | Moeda: `EUR`.
4. Fluxo de dados: **Web** → URL: `https://wc26.pt`.
5. Copia o **ID de medição** (formato `G-XXXXXXXXXX`).

### Adicionar na Vercel

```bash
cd /Users/miguelgarcia/Projects/CucosWorldCup2026

vercel env add NEXT_PUBLIC_GA_MEASUREMENT_ID production
# Cola o G-XXXXXXXXXX quando pedido

vercel env add NEXT_PUBLIC_GA_MEASUREMENT_ID preview
# Mesmo valor
```

Ou no dashboard: [vercel.com](https://vercel.com) → Projecto → Settings → Environment Variables.

---

## Parte 2 — Google AdSense (pode demorar dias)

### Pré-requisitos (já feitos no código)
- [x] Política de privacidade em `https://wc26.pt/privacidade`
- [x] Banner de cookies
- [x] `https://wc26.pt/ads.txt` (automático quando configurado)

### Candidatura

1. Abre [adsense.google.com](https://adsense.google.com).
2. **Sites** → **Adicionar site** → `wc26.pt`.
3. Cola o código no site — **já está integrado**; só precisas das variáveis.
4. Aguarda aprovação (1–14 dias). O Google revê conteúdo, privacidade e tráfego.

### Após aprovação

1. **Anúncios** → **Por unidade de anúncio** → **Anúncios display** → Responsivo.
2. Nome: `Homepage banner` → Criar.
3. Copia:
   - **ID do editor** (`ca-pub-XXXXXXXXXXXXXXXX`)
   - **ID do slot** (número, ex. `1234567890`)

### Adicionar na Vercel

```bash
vercel env add NEXT_PUBLIC_ADSENSE_CLIENT_ID production
# ca-pub-XXXXXXXXXXXXXXXX

vercel env add NEXT_PUBLIC_ADSENSE_SLOT_HOME production
# 1234567890

# Repetir para preview se quiseres testar em PRs
```

### Redeploy

```bash
vercel --prod
```

Ou: push para `main` (deploy automático) **depois** de guardar as variáveis.

---

## Parte 3 — Verificar

| URL | O que verificar |
|-----|-----------------|
| `https://wc26.pt/privacidade` | Página de privacidade |
| `https://wc26.pt/ads.txt` | Linha `google.com, pub-…` (só após AdSense configurado) |
| DevTools → Network | Pedidos a `google-analytics.com` após aceitar cookies |
| [analytics.google.com](https://analytics.google.com) → Tempo real | Visitas ao site |

---

## Variáveis — resumo

| Variável | Exemplo | Obrigatório para |
|----------|---------|------------------|
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | `G-ABC123XYZ` | Analytics |
| `NEXT_PUBLIC_ADSENSE_CLIENT_ID` | `ca-pub-1234567890123456` | Anúncios |
| `NEXT_PUBLIC_ADSENSE_SLOT_HOME` | `9876543210` | Anúncio na homepage |

---

## Notas

- Sem variáveis configuradas, o site funciona normalmente — só não há analytics nem ads.
- AdSense com pouco tráfego rende pouco; aprovação é o primeiro obstáculo.
- Para candidatura AdSense, convém ter algumas páginas com conteúdo (jogos, grupos) — já tens.
