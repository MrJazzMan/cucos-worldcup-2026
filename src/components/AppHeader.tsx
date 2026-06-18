"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LangSwitcher } from "@/components/LangSwitcher";
import { SettingsMenu } from "@/components/SettingsMenu";
import { SettingsMenuProvider } from "@/components/SettingsMenuContext";
import { AuthStatus } from "@/components/AuthStatus";
import { KNOCKOUTS_ENABLED } from "@/lib/features";
import Logo from "@/components/Logo";
import { useT } from "@/components/SettingsProvider";

const links = [
  { href: "/", key: "nav.matches" },
  { href: "/grupos", key: "nav.groups" },
  { href: "/eliminatorias", key: "nav.knockouts", knockouts: true },
] as const;

export function AppHeader() {
  const pathname = usePathname();
  const t = useT();

  function isActive(href: string) {
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  }

  const visibleLinks = links.filter(
    (link) => !("knockouts" in link && link.knockouts) || KNOCKOUTS_ENABLED
  );

  return (
    <SettingsMenuProvider>
    <header className="sticky top-0 z-50 border-b border-border-base bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-2 px-4 py-3">
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
            {visibleLinks.map((link) => (
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
          <LangSwitcher />
          <SettingsMenu />
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t border-border-base px-3 py-2 sm:hidden">
        {visibleLinks.map((link) => (
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
    </SettingsMenuProvider>
  );
}
