"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { DayOffset } from "@/types";

const tabs: { offset: DayOffset; label: string }[] = [
  { offset: -1, label: "Ontem" },
  { offset: 0, label: "Hoje" },
  { offset: 1, label: "Amanhã" },
];

export function DayNav() {
  const searchParams = useSearchParams();
  const current = Number(searchParams.get("dia") ?? "0") as DayOffset;
  const activeOffset = [-1, 0, 1].includes(current) ? current : 0;

  return (
    <div className="flex gap-2 rounded-2xl bg-zinc-900 p-1.5">
      {tabs.map((tab) => {
        const isActive = tab.offset === activeOffset;
        const href = tab.offset === 0 ? "/" : `/?dia=${tab.offset}`;
        return (
          <Link
            key={tab.offset}
            href={href}
            className={`flex-1 rounded-xl py-3 text-center text-base font-semibold transition-all ${
              isActive
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
