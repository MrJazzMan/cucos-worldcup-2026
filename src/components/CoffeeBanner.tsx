"use client";

import { useSettings } from "@/components/SettingsProvider";

export function CoffeeBanner() {
  const { lang } = useSettings();

  return (
    <a
      href="https://www.buymeacoffee.com/miguelgarcia"
      target="_blank"
      rel="noopener noreferrer"
      className="flex w-full justify-center"
    >
      {lang === "en" ? (
        <img
          src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
          alt="Buy Me a Coffee"
          style={{ height: 50, width: "auto" }}
        />
      ) : (
        <span className="inline-flex items-center gap-2 rounded-xl border-2 border-black bg-[#FFDD00] px-5 py-2.5 font-bold text-black transition hover:brightness-105">
          <span className="text-xl">☕</span>
          Paga-me um Café
        </span>
      )}
    </a>
  );
}
