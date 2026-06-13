"use client";

import { useEffect, useRef, useState } from "react";
import { useSettings } from "@/components/SettingsProvider";
import { COMMON_TIMEZONES } from "@/lib/datetime";
import { LANGS } from "@/lib/i18n";

const THEME_OPTIONS = [
  { value: "system", key: "settings.theme.system", icon: "🖥️" },
  { value: "light", key: "settings.theme.light", icon: "☀️" },
  { value: "dark", key: "settings.theme.dark", icon: "🌙" },
] as const;

export function SettingsMenu() {
  const { t, lang, setLang, theme, setTheme, tzPref, setTzPref } = useSettings();
  const [open, setOpen] = useState(false);
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
        <div className="absolute right-0 z-50 mt-2 w-72 origin-top-right rounded-2xl border border-border-base bg-surface p-4 shadow-xl">
          <p className="mb-3 text-sm font-bold text-foreground">
            {t("settings.title")}
          </p>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">
                {t("settings.language")}
              </label>
              <div className="flex gap-1.5">
                {LANGS.map((l) => (
                  <button
                    key={l.value}
                    onClick={() => setLang(l.value)}
                    className={`flex-1 rounded-lg px-2 py-2 text-sm font-medium transition-colors ${
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
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">
                {t("settings.theme")}
              </label>
              <div className="flex gap-1.5">
                {THEME_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setTheme(opt.value)}
                    className={`flex-1 rounded-lg px-2 py-2 text-sm font-medium transition-colors ${
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
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-muted">
                {t("settings.timezone")}
              </label>
              <select
                value={tzPref}
                onChange={(e) => setTzPref(e.target.value)}
                className="w-full rounded-lg border border-border-base bg-surface-2 px-3 py-2 text-sm text-foreground"
              >
                <option value="auto">{t("settings.timezone.auto")}</option>
                {COMMON_TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
