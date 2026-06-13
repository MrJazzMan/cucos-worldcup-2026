// Dicionário de traduções PT/EN para a interface.

export type Lang = "pt" | "en";

export const LANGS: { value: Lang; label: string; flag: string }[] = [
  { value: "pt", label: "Português", flag: "🇵🇹" },
  { value: "en", label: "English", flag: "🇬🇧" },
];

type Dict = Record<string, string>;

const pt: Dict = {
  "nav.matches": "Jogos",
  "nav.groups": "Grupos",
  "nav.knockouts": "Eliminatórias",
  "nav.account": "Conta",
  "header.subtitle": "TV Portugal",

  "day.yesterday": "Ontem",
  "day.today": "Hoje",
  "day.tomorrow": "Amanhã",

  "matches.empty.title": "Sem jogos neste dia",
  "matches.empty.subtitle": "Selecciona outro dia ou volta mais tarde.",
  "matches.loading": "A carregar jogos…",
  "matches.liveRefresh": "Actualização automática",
  "matches.count": "jogos",
  "matches.countOne": "jogo",

  "status.inHours": "Em {n} horas",
  "status.inMinutes": "Em {n} min",

  "status.live": "Ao vivo",
  "status.finished": "Terminado",
  "status.upcoming": "Por começar",

  "card.channelTBC": "Canal a confirmar",
  "card.flag": "Bandeira",

  "groups.title": "Grupos",
  "groups.subtitle": "Classificações do Mundial 2026",
  "groups.col.team": "Equipa",
  "groups.col.played": "J",
  "groups.col.won": "V",
  "groups.col.draw": "E",
  "groups.col.lost": "D",
  "groups.col.gd": "DG",
  "groups.col.points": "Pts",

  "knockouts.title": "Eliminatórias",
  "knockouts.subtitle": "Chave completa do torneio",
  "knockouts.empty.title": "Chave ainda não disponível",
  "knockouts.empty.subtitle":
    "Os jogos eliminatórios serão publicados à medida que o torneio avança.",

  "account.title": "Conta",
  "account.needSupabase": "Configura Supabase para activar autenticação.",
  "account.signInPrompt":
    "Inicia sessão para guardar equipas favoritas e receber notificações.",
  "account.yourAccount": "A tua conta",
  "account.signOut": "Terminar sessão",
  "account.favourites": "Equipas favoritas",
  "account.favouritesHint": "Destacadas na homepage e usadas para notificações.",
  "account.notifications": "Notificações",
  "account.notif.before24h": "24 horas antes",
  "account.notif.before1h": "1 hora antes",
  "account.notif.before15m": "15 minutos antes",
  "account.notif.started": "Jogo começou",
  "account.notif.final": "Resultado final",
  "account.enablePush": "Activar notificações push",
  "account.enabling": "A activar…",
  "auth.google": "Continuar com Google",
  "auth.apple": "Continuar com Apple",

  "settings.title": "Definições",
  "settings.language": "Idioma",
  "settings.theme": "Tema",
  "settings.theme.system": "Sistema",
  "settings.theme.light": "Claro",
  "settings.theme.dark": "Escuro",
  "settings.timezone": "Fuso horário",
  "settings.timezone.auto": "Automático (browser)",
  "settings.close": "Fechar",
};

const en: Dict = {
  "nav.matches": "Matches",
  "nav.groups": "Groups",
  "nav.knockouts": "Knockouts",
  "nav.account": "Account",
  "header.subtitle": "Portugal TV",

  "day.yesterday": "Yesterday",
  "day.today": "Today",
  "day.tomorrow": "Tomorrow",

  "matches.empty.title": "No matches on this day",
  "matches.empty.subtitle": "Pick another day or check back later.",
  "matches.loading": "Loading matches…",
  "matches.liveRefresh": "Auto-updating",
  "matches.count": "matches",
  "matches.countOne": "match",

  "status.inHours": "In {n} hours",
  "status.inMinutes": "In {n} min",

  "status.live": "Live",
  "status.finished": "Finished",
  "status.upcoming": "Upcoming",

  "card.channelTBC": "Channel TBC",
  "card.flag": "Flag",

  "groups.title": "Groups",
  "groups.subtitle": "2026 World Cup standings",
  "groups.col.team": "Team",
  "groups.col.played": "P",
  "groups.col.won": "W",
  "groups.col.draw": "D",
  "groups.col.lost": "L",
  "groups.col.gd": "GD",
  "groups.col.points": "Pts",

  "knockouts.title": "Knockouts",
  "knockouts.subtitle": "Full tournament bracket",
  "knockouts.empty.title": "Bracket not available yet",
  "knockouts.empty.subtitle":
    "Knockout matches will be published as the tournament progresses.",

  "account.title": "Account",
  "account.needSupabase": "Configure Supabase to enable authentication.",
  "account.signInPrompt":
    "Sign in to save favourite teams and receive notifications.",
  "account.yourAccount": "Your account",
  "account.signOut": "Sign out",
  "account.favourites": "Favourite teams",
  "account.favouritesHint": "Highlighted on the homepage and used for notifications.",
  "account.notifications": "Notifications",
  "account.notif.before24h": "24 hours before",
  "account.notif.before1h": "1 hour before",
  "account.notif.before15m": "15 minutes before",
  "account.notif.started": "Match started",
  "account.notif.final": "Final result",
  "account.enablePush": "Enable push notifications",
  "account.enabling": "Enabling…",
  "auth.google": "Continue with Google",
  "auth.apple": "Continue with Apple",

  "settings.title": "Settings",
  "settings.language": "Language",
  "settings.theme": "Theme",
  "settings.theme.system": "System",
  "settings.theme.light": "Light",
  "settings.theme.dark": "Dark",
  "settings.timezone": "Time zone",
  "settings.timezone.auto": "Automatic (browser)",
  "settings.close": "Close",
};

const DICTS: Record<Lang, Dict> = { pt, en };

export function translate(lang: Lang, key: string): string {
  return DICTS[lang][key] ?? DICTS.pt[key] ?? key;
}

export function localeFor(lang: Lang): string {
  return lang === "pt" ? "pt-PT" : "en-GB";
}
