"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SettingsMenu } from "@/components/SettingsMenu";
import { AuthStatus } from "@/components/AuthStatus";
import { useT } from "@/components/SettingsProvider";

const links = [
  { href: "/", key: "nav.matches" },
  { href: "/grupos", key: "nav.groups" },
  { href: "/eliminatorias", key: "nav.knockouts" },
  { href: "/conta", key: "nav.account" },
];

export function AppHeader() {
  const pathname = usePathname();
  const t = useT();

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border-base bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-2 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-accent to-blue-400 text-lg shadow-lg shadow-accent/30">
            ⚽
          </span>
          <div>
            <p className="text-lg font-bold leading-tight text-foreground">
              WC26
            </p>
            <p className="text-xs text-muted">{t("header.subtitle")}</p>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <nav className="hidden gap-1 sm:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? "bg-foreground text-background"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {t(link.key)}
              </Link>
            ))}
          </nav>
          <AuthStatus />
          <SettingsMenu />
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t border-border-base px-3 py-2 sm:hidden">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              isActive(link.href)
                ? "bg-foreground text-background"
                : "text-muted hover:text-foreground"
            }`}
          >
            {t(link.key)}
          </Link>
        ))}
      </nav>
    </header>
  );
}
