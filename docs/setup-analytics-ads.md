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

## Parte 2 — Google AdSense

### Estado actual (0.2.0)

- [x] Site **wc26.pt verificado** no AdSense
- [x] **Auto ads** activos (Ads → By site)
- [x] Script no `<head>` — `src/app/layout.tsx` (tag literal, não `next/script`)
- [x] `https://wc26.pt/ads.txt` → `google.com, pub-0320022425990569, DIRECT, …`
- [x] Variável Vercel: `NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-0320022425990569`

### Verificação do site (se precisares de repetir)

**Método A — AdSense code snippet** (recomendado)

O código já está no site. No painel AdSense: ☑ I've placed the code → **Verify**.

**Método B — Ads.txt snippet**

Usar `https://wc26.pt/ads.txt` como alternativa.

> O crawler AdSense **não aceita cookies**. O script tem de aparecer como `<script async src="…adsbygoogle.js?client=ca-pub-…">` no HTML inicial — não basta preload.

### Candidatura / revisão

1. [adsense.google.com](https://adsense.google.com) → Sites → `wc26.pt`
2. Após verificação: **Request review** (1–14 dias)
3. Com **Auto ads ON**, não é obrigatório `NEXT_PUBLIC_ADSENSE_SLOT_HOME` — útil só para unidades manuais na homepage

### Unidade manual (opcional)

1. **Anúncios** → **Por unidade de anúncio** → Display responsivo
2. Copiar **slot ID** → `NEXT_PUBLIC_ADSENSE_SLOT_HOME` na Vercel

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
