"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LangSwitcher } from "@/components/LangSwitcher";
import { SettingsMenu } from "@/components/SettingsMenu";
import { AuthStatus } from "@/components/AuthStatus";
import Logo from "@/components/Logo";
import { useT } from "@/components/SettingsProvider";

const links = [
  { href: "/", key: "nav.matches" },
  { href: "/grupos", key: "nav.groups" },
  { href: "/fasefinal", key: "nav.knockouts" },
] as const;

export function AppHeader() {
  const pathname = usePathname();
  const t = useT();

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border-base bg-background/80 backdrop-blur-xl">
      <div className="flex w-full items-center justify-between gap-2 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex flex-col justify-center gap-0.5">
            <Logo
              height={22}
              textColor="var(--foreground)"
              className="shrink-0 sm:hidden"
            />
            <Logo
              height={28}
              textColor="var(--foreground)"
              className="hidden shrink-0 sm:block"
            />
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
          <div className="hidden sm:block">
            <AuthStatus />
          </div>
          <LangSwitcher />
          <SettingsMenu />
        </div>
      </div>
    </header>
  );
}
