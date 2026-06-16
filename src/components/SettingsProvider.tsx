"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { browserTimeZone } from "@/lib/datetime";
import { localeFor, translate, detectLangFromBrowser, type Lang } from "@/lib/i18n";

export type ThemeChoice = "system" | "light" | "dark";
export type TzPref = "auto" | string;

interface SettingsContextValue {
  mounted: boolean;
  lang: Lang;
  setLang: (l: Lang) => void;
  theme: ThemeChoice;
  setTheme: (t: ThemeChoice) => void;
  tzPref: TzPref;
  setTzPref: (tz: TzPref) => void;
  /** Fuso resolvido (Lisboa antes de montar, para SSR estável). */
  tz: string;
  locale: string;
  t: (key: string) => string;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

const LS = {
  lang: "cucos-lang",
  theme: "cucos-theme",
  tz: "cucos-tz",
};

function systemPrefersDark(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

function applyTheme(choice: ThemeChoice) {
  const resolved =
    choice === "system" ? (systemPrefersDark() ? "dark" : "light") : choice;
  document.documentElement.setAttribute("data-theme", resolved);
}

function detectLang(): Lang {
  return detectLangFromBrowser();
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [lang, setLangState] = useState<Lang>("pt");
  const [theme, setThemeState] = useState<ThemeChoice>("system");
  const [tzPref, setTzPrefState] = useState<TzPref>("auto");

  useEffect(() => {
    const storedLang = localStorage.getItem(LS.lang) as Lang | null;
    const storedTheme = localStorage.getItem(LS.theme) as ThemeChoice | null;
    const storedTz = localStorage.getItem(LS.tz);

    setLangState(storedLang ?? detectLang());
    setThemeState(storedTheme ?? "system");
    setTzPrefState(storedTz ?? "auto");
    setMounted(true);

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if ((localStorage.getItem(LS.theme) ?? "system") === "system") {
        applyTheme("system");
      }
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem(LS.lang, l);
    document.documentElement.lang = localeFor(l);
  }, []);

  const setTheme = useCallback((t: ThemeChoice) => {
    setThemeState(t);
    localStorage.setItem(LS.theme, t);
    applyTheme(t);
  }, []);

  const setTzPref = useCallback((tz: TzPref) => {
    setTzPrefState(tz);
    localStorage.setItem(LS.tz, tz);
  }, []);

  const tz = useMemo(() => {
    if (!mounted) return "Europe/Lisbon";
    return tzPref === "auto" ? browserTimeZone() : tzPref;
  }, [mounted, tzPref]);

  const value = useMemo<SettingsContextValue>(
    () => ({
      mounted,
      lang,
      setLang,
      theme,
      setTheme,
      tzPref,
      setTzPref,
      tz,
      locale: localeFor(lang),
      t: (key: string) => translate(lang, key),
    }),
    [mounted, lang, setLang, theme, setTheme, tzPref, setTzPref, tz]
  );

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings deve ser usado dentro de SettingsProvider");
  }
  return ctx;
}

export function useT() {
  return useSettings().t;
}
