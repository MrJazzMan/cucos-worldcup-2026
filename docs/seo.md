# SEO — wc26.pt

Checklist para melhorar visibilidade no Google. **Estado base já feito em 0.2.0.**

---

## Já implementado (0.2.0)

- [x] Homepage **pública** — jogos no HTML (SSR) sem login
- [x] Canais TV **fora do HTML** para anónimos (não diluem SEO)
- [x] `robots.txt` — permite crawlers normais; bloqueia bots de IA
- [x] `sitemap.xml` — `/`, `/grupos`, `/privacidade`
- [x] Meta title/description em `layout.tsx`
- [x] `/privacidade` indexável (sem login)
- [x] HTTPS + domínio `wc26.pt`

---

## Próximos passos (manual)

### 1. Google Search Console (prioridade)

1. [search.google.com/search-console](https://search.google.com/search-console)
2. Adicionar propriedade **URL prefix:** `https://wc26.pt`
3. Verificar (DNS TXT no domínio ou ficheiro HTML)
4. Submeter sitemap: `https://wc26.pt/sitemap.xml`
5. Pedir indexação da homepage

### 2. Conteúdo e palavras-chave

Alvos naturais para o projecto:

- Mundial 2026 horários Portugal
- Jogos Mundial 2026 hoje
- Mundial 2026 canais TV Portugal
- WC26 calendário jogos

Sugestões no código (futuro):

- Títulos por página (`/grupos` → metadata específica)
- Texto introdutório na homepage (1 parágrafo estático)
- Página FAQ ou «Como ver o Mundial na TV»

### 3. Performance e Core Web Vitals

- Vercel Speed Insights já activo
- Imagens de bandeiras — verificar lazy load
- `revalidate = 60` na homepage — OK para frescura

### 4. Links externos

- Partilhar `wc26.pt` em redes sociais
- Backlinks de fóruns/comunidades de adeptos
- AdSense não substitui SEO — tráfego orgânico ajuda ambos

### 5. Internacionalização

- 12 idiomas activos — Google pode indexar com `hreflang` (não implementado ainda)
- Futuro: `<link rel="alternate" hreflang="…">` por língua

---

## O que evitar

- Voltar a bloquear a homepage com login modal (mata SEO)
- Expor canais TV no HTML sem login (conteúdo exclusivo perde-se no Google)
- `noindex` nas páginas principais

---

## Verificar indexação

```
site:wc26.pt
```

No Google — deve aparecer homepage, grupos, privacidade após alguns dias no Search Console.
