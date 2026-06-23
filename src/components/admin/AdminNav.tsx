"use client";

import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Canais TV" },
  { href: "/admin/analytics", label: "Métricas" },
] as const;

/** Links nativos evitam 404 com bundle RSC em cache após deploy. */
export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2" aria-label="Admin">
      {LINKS.map(({ href, label }) => {
        const active = pathname === href;
        return (
          <a
            key={href}
            href={href}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              active
                ? "bg-accent text-white"
                : "bg-surface-2 text-muted hover:text-foreground"
            }`}
          >
            {label}
          </a>
        );
      })}
    </nav>
  );
}
