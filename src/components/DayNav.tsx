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
    <div className="flex gap-2 rounded-2xl border border-border-base bg-surface p-1.5">
      {tabs.map((tab) => {
        const isActive = tab.offset === activeOffset;
        const href = tab.offset === 0 ? "/" : `/?dia=${tab.offset}`;
        return (
          <Link
            key={tab.offset}
            href={href}
            className={`flex-1 rounded-xl py-3 text-center text-base font-semibold transition-all ${
              isActive
                ? "bg-gradient-to-br from-accent to-blue-400 text-white shadow-md shadow-accent/30"
                : "text-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
