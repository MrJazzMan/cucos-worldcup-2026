"use client";

import { useEffect, useRef, useState } from "react";
import { useSettings } from "@/components/SettingsProvider";
import { LANGS } from "@/lib/i18n";

export function LangSwitcher() {
  const { lang, setLang, mounted } = useSettings();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = LANGS.find((l) => l.value === lang) ?? LANGS[0];

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  if (!mounted) {
    return (
      <span className="grid h-9 w-9 place-items-center rounded-lg border border-border-base bg-surface-2 text-base">
        🇬🇧
      </span>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Language"
        aria-expanded={open}
        className="grid h-9 min-w-9 place-items-center rounded-lg border border-border-base bg-surface-2 px-2 text-base transition hover:brightness-110"
      >
        {current.flag}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 max-h-72 w-52 overflow-y-auto rounded-xl border border-border-base bg-surface py-1 shadow-xl">
          {LANGS.map((l) => (
            <button
              key={l.value}
              type="button"
              onClick={() => {
                setLang(l.value);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition hover:bg-surface-2 ${
                lang === l.value
                  ? "bg-accent/10 font-semibold text-accent"
                  : "text-foreground"
              }`}
            >
              <span className="text-base">{l.flag}</span>
              <span className="truncate">{l.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
