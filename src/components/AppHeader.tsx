"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Jogos" },
  { href: "/grupos", label: "Grupos" },
  { href: "/eliminatorias", label: "Eliminatórias" },
  { href: "/conta", label: "Conta" },
];

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/95 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">⚽</span>
          <div>
            <p className="text-lg font-bold leading-tight text-white">
              Cucos WC26
            </p>
            <p className="text-xs text-zinc-400">TV Portugal</p>
          </div>
        </Link>
        <nav className="flex gap-1">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-white text-zinc-900"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
