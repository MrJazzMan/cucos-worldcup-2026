export type ThemeChoice =
  | "system"
  | "light"
  | "dark"
  | "cyberpunk"
  | "fifa2026"
  | "japan";

export const CLASSIC_THEME_OPTIONS = [
  { value: "system", key: "settings.theme.system", icon: "🖥️" },
  { value: "light", key: "settings.theme.light", icon: "☀️" },
  { value: "dark", key: "settings.theme.dark", icon: "🌙" },
] as const satisfies readonly { value: ThemeChoice; key: string; icon: string }[];

export const STYLE_THEME_OPTIONS = [
  { value: "cyberpunk", key: "settings.theme.cyberpunk", icon: "🌃" },
  { value: "fifa2026", key: "settings.theme.fifa2026", icon: "🏆" },
  { value: "japan", key: "settings.theme.japan", icon: "⛩️" },
] as const satisfies readonly { value: ThemeChoice; key: string; icon: string }[];

export function resolveTheme(choice: ThemeChoice): string {
  if (choice === "system") {
    if (typeof window === "undefined") return "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return choice;
}

export function applyTheme(choice: ThemeChoice) {
  document.documentElement.setAttribute("data-theme", resolveTheme(choice));
}

/** Inline script em layout.tsx — evita flash antes do React. */
export const THEME_INIT_SCRIPT = `(function(){try{var c=localStorage.getItem('cucos-theme')||'system';var d=c==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):c;document.documentElement.setAttribute('data-theme',d);}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;
