# Changelog

Alterações notáveis do projeto Cucos WC26. Formato baseado em [Keep a Changelog](https://keepachangelog.com/).

---

## [2026-06-16] — Painel de definições unificado

### Adicionado
- `CHANGELOG.md` para registo de releases.
- Painel lateral com navegação por secções: Perfil, Notificações, Equipas favoritas e Aparência.
- `src/lib/admin.ts` — admin hardcoded apenas para o utilizador `4764a298-fab5-401d-bbbb-3da03c86ce08`.
- Componentes `SettingsFavourites` e `SettingsNotifications` no painel de definições.
- `src/lib/teams-client.ts` — carregamento de equipas no cliente.

### Alterado
- Perfil (nome, localização, fuso horário, idioma) movido para o painel direito.
- Notificações e equipas favoritas integradas no painel; página Conta deixou de ser necessária.
- «Terminar sessão» fixado no rodapé do painel lateral.
- Avatar no header abre o painel de definições em vez de ir para `/conta`.
- Link «Conta» removido da navegação principal.

### Removido
- `AccountPanel.tsx` — lógica migrada para o painel lateral.
- Entrada `/conta` no sitemap (`/conta` redireciona para `/`).

---

## [2026-06-16] — Login obrigatório com modal

### Adicionado
- Modal de login obrigatório (`LoginGate`) ao visitar o site sem sessão.
- Traduções PT/EN para o modal de autenticação.

### Alterado
- Fluxo OAuth preserva a página de destino após login.
- Erros de autenticação mostrados no modal em vez de redirecionar para `/conta`.

---
