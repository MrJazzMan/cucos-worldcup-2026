"use client";

import { useEffect, useState } from "react";

type ThemeChoice = "system" | "light" | "dark";

const STORAGE_KEY = "cucos-theme";

const OPTIONS: { value: ThemeChoice; label: string; icon: string }[] = [
  { value: "system", label: "Sistema", icon: "🖥️" },
  { value: "light", label: "Claro", icon: "☀️" },
  { value: "dark", label: "Escuro", icon: "🌙" },
];

function systemPrefersDark(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

export function applyTheme(choice: ThemeChoice) {
  const resolved =
    choice === "system" ? (systemPrefersDark() ? "dark" : "light") : choice;
  document.documentElement.setAttribute("data-theme", resolved);
}

export function ThemeToggle() {
  const [choice, setChoice] = useState<ThemeChoice>("system");

  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) as ThemeChoice) || "system";
    setChoice(stored);
    applyTheme(stored);

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if ((localStorage.getItem(STORAGE_KEY) as ThemeChoice) === "system") {
        applyTheme("system");
      }
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  function select(next: ThemeChoice) {
    setChoice(next);
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  }

  return (
    <div className="flex items-center gap-0.5 rounded-full border border-border-base bg-surface-2 p-0.5">
      {OPTIONS.map((opt) => {
        const active = choice === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => select(opt.value)}
            title={opt.label}
            aria-label={`Tema ${opt.label}`}
            aria-pressed={active}
            className={`rounded-full px-2 py-1 text-sm transition-colors ${
              active
                ? "bg-accent text-white shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            {opt.icon}
          </button>
        );
      })}
    </div>
  );
}
