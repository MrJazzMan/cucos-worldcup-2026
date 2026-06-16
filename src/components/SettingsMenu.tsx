"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { AuthButtons } from "@/components/AuthButtons";
import { useSettings } from "@/components/SettingsProvider";
import { useSettingsMenu } from "@/components/SettingsMenuContext";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import { COMMON_TIMEZONES } from "@/lib/datetime";
import { LANGS } from "@/lib/i18n";

const ADMIN_USER_ID = "4764a298-fab5-401d-bbbb-3da03c86ce08";

const THEME_OPTIONS = [
  { value: "system", key: "settings.theme.system", icon: "🖥️" },
  { value: "light", key: "settings.theme.light", icon: "☀️" },
  { value: "dark", key: "settings.theme.dark", icon: "🌙" },
] as const;

export function SettingsMenu() {
  const { t, lang, setLang, theme, setTheme, tzPref, setTzPref } = useSettings();
  const { open, setOpen } = useSettingsMenu();
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [streakDays, setStreakDays] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [location, setLocation] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
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
  }, [open, setOpen]);

  useEffect(() => {
    const supabase = createSupabaseBrowser();

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!open || !user) return;

    const supabase = createSupabaseBrowser();
    supabase
      .from("profiles")
      .select("display_name, location, role")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        setDisplayName(data?.display_name ?? "");
        setLocation(data?.location ?? "");
        setIsAdmin(data?.role === "admin" || user.id === ADMIN_USER_ID);
      });
  }, [open, user]);

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

  async function saveProfile() {
    if (!user) return;
    setProfileSaving(true);
    setProfileSaved(false);
    const supabase = createSupabaseBrowser();
    await supabase
      .from("profiles")
      .update({ display_name: displayName || null, location: location || null })
      .eq("user_id", user.id);
    setProfileSaving(false);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  }

  async function signOut() {
    const supabase = createSupabaseBrowser();
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  const username =
    displayName.trim() ||
    user?.email?.split("@")[0] ||
    "Convidado";
  const initial = username[0]?.toUpperCase() ?? "C";
  const streakLabel =
    (streakDays || 1) === 1
      ? t("settings.streakDays").replace("{n}", String(streakDays || 1))
      : t("settings.streakDaysPlural").replace("{n}", String(streakDays || 1));

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
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
            aria-label={t("settings.closeMenu")}
          />
          <aside className="fixed right-0 top-0 z-50 flex h-dvh w-[min(24rem,88vw)] flex-col border-l border-border-base bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-border-base p-5">
              <p className="text-2xl font-extrabold text-foreground">
                {t("settings.menu")}
              </p>
              <button
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-foreground"
                aria-label={t("settings.closeMenu")}
              >
                ✕
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-5">
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
                      <>
                        <p className="truncate text-xs text-muted">{user.email}</p>
                        <p className="truncate text-sm text-orange-500">
                          🔥 {streakLabel}
                        </p>
                      </>
                    ) : (
                      <p className="truncate text-sm text-muted">
                        {t("settings.guestPrompt")}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {user ? (
                <>
                  <section>
                    <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
                      {t("profile.title")}
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">
                          {t("profile.displayName")}
                        </label>
                        <input
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder={user.email?.split("@")[0]}
                          className="w-full rounded-xl border border-border-base bg-surface px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-foreground">
                          {t("profile.location")}
                        </label>
                        <input
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder={t("profile.locationPlaceholder")}
                          className="w-full rounded-xl border border-border-base bg-surface px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
                        />
                      </div>
                      <button
                        onClick={saveProfile}
                        disabled={profileSaving}
                        className="w-full rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
                        type="button"
                      >
                        {profileSaved
                          ? `✓ ${t("profile.saved")}`
                          : profileSaving
                            ? t("profile.saving")
                            : t("profile.save")}
                      </button>
                    </div>
                  </section>

                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2 rounded-xl border border-accent/40 bg-accent/10 px-3 py-3 text-sm font-semibold text-accent transition hover:bg-accent/20"
                    >
                      ⚙️ {t("account.adminLink")}
                    </Link>
                  )}

                  <button
                    onClick={signOut}
                    className="flex w-full items-center gap-2 rounded-xl border border-border-base bg-surface-2 px-3 py-3 text-left text-base font-bold text-red-500"
                    type="button"
                  >
                    <span>↪</span>
                    {t("account.signOut")}
                  </button>
                </>
              ) : (
                <section>
                  <AuthButtons next={pathname} />
                </section>
              )}

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
                      type="button"
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
                      type="button"
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
