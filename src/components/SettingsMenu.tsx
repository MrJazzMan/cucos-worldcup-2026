"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { AuthButtons } from "@/components/AuthButtons";
import { SettingsFavourites } from "@/components/settings/SettingsFavourites";
import { SettingsCalendarFeed } from "@/components/settings/SettingsCalendarFeed";
import { SettingsNotifications } from "@/components/settings/SettingsNotifications";
import { useSettings } from "@/components/SettingsProvider";
import { useSettingsMenu } from "@/components/SettingsMenuContext";
import { isSiteAdmin } from "@/lib/admin";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import type { SettingsPanelView } from "@/lib/settings-menu-views";
import { browserTimeZone } from "@/lib/datetime";
import { COMMON_TIMEZONES } from "@/lib/datetime";
import { CLASSIC_THEME_OPTIONS, STYLE_THEME_OPTIONS } from "@/lib/themes";

type PanelView = SettingsPanelView;

const MENU_ITEMS: { view: Exclude<PanelView, "home">; icon: string; labelKey: string }[] = [
  { view: "profile", icon: "👤", labelKey: "settings.section.profile" },
  { view: "calendar", icon: "📅", labelKey: "settings.section.calendar" },
  { view: "notifications", icon: "🔔", labelKey: "settings.section.notifications" },
  { view: "favourites", icon: "⭐", labelKey: "settings.section.favourites" },
  { view: "appearance", icon: "🎨", labelKey: "settings.section.appearance" },
];

const VIEW_TITLE: Record<Exclude<PanelView, "home">, string> = {
  profile: "settings.section.profile",
  notifications: "settings.section.notifications",
  favourites: "settings.section.favourites",
  calendar: "settings.section.calendar",
  appearance: "settings.section.appearance",
};

export function SettingsMenu() {
  const { t, theme, setTheme, tzPref, setTzPref } = useSettings();
  const { open, setOpen, openTo, pendingView, clearPendingView } = useSettingsMenu();
  const router = useRouter();
  const pathname = usePathname();
  const [view, setView] = useState<PanelView>("home");
  const [user, setUser] = useState<User | null>(null);
  const [streakDays, setStreakDays] = useState(0);
  const [displayName, setDisplayName] = useState("");
  const [location, setLocation] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const detectedTz = browserTimeZone();

  useEffect(() => {
    if (!open) {
      setView("home");
      return;
    }
    if (pendingView) {
      setView(pendingView);
      clearPendingView();
    }
  }, [open, pendingView, clearPendingView]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (view !== "home") setView("home");
        else setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", onClick);
      document.addEventListener("keydown", onKey);
    }
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen, view]);

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
    if (!user) {
      setDisplayName("");
      setLocation("");
      return;
    }

    const supabase = createSupabaseBrowser();
    supabase
      .from("profiles")
      .select("display_name, location")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          console.warn("[profile load]", error.message);
          return;
        }
        setDisplayName(data?.display_name ?? "");
        setLocation(data?.location ?? "");
      });
  }, [user]);

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
    setProfileError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: displayName.trim(),
          location: location.trim(),
        }),
      });
      if (!res.ok) {
        console.error("[profile save]", await res.text());
        setProfileError(t("profile.error"));
        return;
      }
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    } catch (err) {
      console.error("[profile save]", err);
      setProfileError(t("profile.error"));
    } finally {
      setProfileSaving(false);
    }
  }

  async function signOut() {
    const supabase = createSupabaseBrowser();
    await supabase.auth.signOut();
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  const username =
    displayName.trim() || user?.email?.split("@")[0] || "Convidado";
  const initial = username[0]?.toUpperCase() ?? "C";
  const streakLabel =
    (streakDays || 1) === 1
      ? t("settings.streakDays").replace("{n}", String(streakDays || 1))
      : t("settings.streakDaysPlural").replace("{n}", String(streakDays || 1));
  const showAdmin = isSiteAdmin(user?.id);

  function renderContent() {
    if (!user) {
      return (
        <section>
          <AuthButtons next={pathname} />
        </section>
      );
    }

    if (view === "home") {
      return (
        <nav className="space-y-1">
          {MENU_ITEMS.map((item) => (
            <button
              key={item.view}
              onClick={() => setView(item.view)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-base font-semibold text-foreground transition hover:bg-surface-2"
              type="button"
            >
              <span>{item.icon}</span>
              {t(item.labelKey)}
              <span className="ml-auto text-muted">›</span>
            </button>
          ))}
          {showAdmin && (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl border border-accent/40 bg-accent/10 px-3 py-3 text-base font-semibold text-accent transition hover:bg-accent/20"
            >
              <span>⚙️</span>
              {t("account.adminLink")}
            </Link>
          )}
        </nav>
      );
    }

    if (view === "profile") {
      return (
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              {t("profile.displayName")}
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={user.email?.split("@")[0]}
              className="w-full rounded-xl border border-border-base bg-surface-2 px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
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
              className="w-full rounded-xl border border-border-base bg-surface-2 px-3 py-2.5 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted">
              {t("settings.timezone")}
            </label>
            <select
              value={tzPref}
              onChange={(e) => setTzPref(e.target.value)}
              className="w-full rounded-xl border border-border-base bg-surface-2 px-3 py-2.5 text-sm text-foreground"
            >
              <option value="auto">
                {t("settings.timezone.auto")} ({detectedTz.replace(/_/g, " ")})
              </option>
              {COMMON_TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz.replace(/_/g, " ")}
                </option>
              ))}
            </select>
            {tzPref === "auto" && (
              <p className="mt-1.5 text-xs text-muted">{t("profile.timezoneAutoHint")}</p>
            )}
          </div>
          {profileError && (
            <p className="text-sm text-red-500">{profileError}</p>
          )}
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
      );
    }

    if (view === "notifications") {
      return <SettingsNotifications userId={user.id} />;
    }

    if (view === "favourites") {
      return <SettingsFavourites userId={user.id} />;
    }

    if (view === "calendar") {
      return <SettingsCalendarFeed userId={user.id} />;
    }

    if (view === "appearance") {
      return (
        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted">
              {t("settings.theme")}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CLASSIC_THEME_OPTIONS.map((opt) => (
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
          </div>
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted">
              {t("settings.theme.styles")}
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {STYLE_THEME_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setTheme(opt.value)}
                  className={`rounded-xl px-3 py-3 text-sm font-semibold transition-colors ${
                    theme === opt.value
                      ? "bg-accent text-white shadow-lg shadow-accent/25"
                      : "bg-surface-2 text-muted hover:text-foreground"
                  }`}
                  type="button"
                >
                  <span className="mr-1.5">{opt.icon}</span>
                  {t(opt.key)}
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return null;
  }

  const headerTitle =
    view === "home"
      ? t("settings.menu")
      : t(VIEW_TITLE[view as Exclude<PanelView, "home">]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => (open ? setOpen(false) : openTo("home"))}
        aria-label={t("settings.title")}
        aria-expanded={open}
        className="grid h-9 w-9 place-items-center rounded-lg border border-border-base bg-surface-2 text-foreground transition-colors hover:brightness-110"
        type="button"
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
            <div className="flex items-center gap-2 border-b border-border-base p-5">
              {view !== "home" && (
                <button
                  onClick={() => setView("home")}
                  className="grid h-9 w-9 place-items-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-foreground"
                  aria-label={t("settings.back")}
                  type="button"
                >
                  ←
                </button>
              )}
              <p className="flex-1 text-xl font-extrabold text-foreground">
                {headerTitle}
              </p>
              <button
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-lg text-muted transition hover:bg-surface-2 hover:text-foreground"
                aria-label={t("settings.closeMenu")}
                type="button"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {view === "home" && (
                <section className="mb-5 rounded-2xl bg-surface-2 p-3">
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
              )}

              {renderContent()}
            </div>

            {user && (
              <div className="border-t border-border-base p-5">
                <button
                  onClick={signOut}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-3 text-base font-bold text-red-500 transition hover:bg-red-500/15"
                  type="button"
                >
                  <span>↪</span>
                  {t("account.signOut")}
                </button>
              </div>
            )}
          </aside>
        </>
      )}
    </div>
  );
}
