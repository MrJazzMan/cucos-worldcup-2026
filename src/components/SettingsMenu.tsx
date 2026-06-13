"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { useSettings } from "@/components/SettingsProvider";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { COMMON_TIMEZONES } from "@/lib/datetime";
import { LANGS } from "@/lib/i18n";

const THEME_OPTIONS = [
  { value: "system", key: "settings.theme.system", icon: "🖥️" },
  { value: "light", key: "settings.theme.light", icon: "☀️" },
  { value: "dark", key: "settings.theme.dark", icon: "🌙" },
] as const;

export function SettingsMenu() {
  const { t, lang, setLang, theme, setTheme, tzPref, setTzPref } = useSettings();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [streakDays, setStreakDays] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("mousedown", onClick);
      document.addEventListener("keydown", onKey);
    }
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const supabase = createSupabaseBrowser();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
    });
  }, [open]);

  useEffect(() => {
    if (!user) {
      setStreakDays(0);
      return;
    }

    const storageKey = `cucos-streak-${user.id}`;
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
      today.getDate()
    ).padStart(2, "0")}`;

    const saved = localStorage.getItem(storageKey);
    if (!saved) {
      localStorage.setItem(storageKey, JSON.stringify({ day: todayKey, streak: 1 }));
      setStreakDays(1);
      return;
    }

    try {
      const parsed = JSON.parse(saved) as { day?: string; streak?: number };
      const prevDay = parsed.day ?? "";
      const prevStreak = Math.max(1, parsed.streak ?? 1);

      if (prevDay === todayKey) {
        setStreakDays(prevStreak);
        return;
      }

      const prevDate = new Date(`${prevDay}T00:00:00`);
      const currDate = new Date(`${todayKey}T00:00:00`);
      const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / 86_400_000);

      const nextStreak = diffDays === 1 ? prevStreak + 1 : 1;
      localStorage.setItem(storageKey, JSON.stringify({ day: todayKey, streak: nextStreak }));
      setStreakDays(nextStreak);
    } catch {
      localStorage.setItem(storageKey, JSON.stringify({ day: todayKey, streak: 1 }));
      setStreakDays(1);
    }
  }, [user]);

  async function signOut() {
    const supabase = createSupabaseBrowser();
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/conta");
    router.refresh();
  }

  const username = user?.email?.split("@")[0] ?? "Convidado";
  const initial = username[0]?.toUpperCase() ?? "C";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={t("settings.title")}
        aria-expanded={open}
        className="grid h-9 w-9 place-items-center rounded-lg border border-border-base bg-surface-2 text-foreground transition-colors hover:brightness-110"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {open && (
        <>
          <button
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-black/35 backdrop-blur-[1px]"
            aria-label="Fechar menu"
          />
          <aside className="fixed right-0 top-0 z-50 h-dvh w-[min(24rem,88vw)] border-l border-border-base bg-surface p-5 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <p className="text-2xl font-extrabold text-foreground">
                Menu
              </p>
              <button
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-foreground"
                aria-label="Fechar menu"
              >
                ✕
              </button>
            </div>

            <div className="space-y-5">
              <section className="rounded-2xl bg-surface-2 p-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-accent text-sm font-bold text-white">
                    {initial}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-base font-bold text-foreground">
                      {username}
                    </p>
                    {user ? (
                      <p className="truncate text-sm text-orange-500">
                        🔥 {streakDays || 1} dia{(streakDays || 1) > 1 ? "s" : ""} seguidos
                      </p>
                    ) : (
                      <p className="truncate text-sm text-muted">Inicia sessão para guardar progresso</p>
                    )}
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-border-base bg-surface-2">
                <Link
                  href="/conta"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-3 py-3 text-base font-semibold text-foreground"
                >
                  <span>⚙️</span>
                  Definições
                </Link>
                <button
                  onClick={signOut}
                  className="flex w-full items-center gap-2 border-t border-border-base px-3 py-3 text-left text-base font-bold text-red-500"
                  type="button"
                >
                  <span>↪</span>
                  Sair
                </button>
              </section>

              <section>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted">
                  {t("settings.language")}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {LANGS.map((l) => (
                    <button
                      key={l.value}
                      onClick={() => setLang(l.value)}
                      className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                        lang === l.value
                          ? "bg-accent text-white"
                          : "bg-surface-2 text-muted hover:text-foreground"
                      }`}
                    >
                      <span className="mr-1">{l.flag}</span>
                      {l.label}
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted">
                  {t("settings.theme")}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {THEME_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setTheme(opt.value)}
                      className={`rounded-xl px-2 py-2.5 text-sm font-semibold transition-colors ${
                        theme === opt.value
                          ? "bg-accent text-white"
                          : "bg-surface-2 text-muted hover:text-foreground"
                      }`}
                    >
                      <span className="mr-1">{opt.icon}</span>
                      {t(opt.key)}
                    </button>
                  ))}
                </div>
              </section>

              <section>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted">
                  {t("settings.timezone")}
                </label>
                <select
                  value={tzPref}
                  onChange={(e) => setTzPref(e.target.value)}
                  className="w-full rounded-xl border border-border-base bg-surface-2 px-3 py-2.5 text-sm text-foreground"
                >
                  <option value="auto">{t("settings.timezone.auto")}</option>
                  {COMMON_TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </section>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
