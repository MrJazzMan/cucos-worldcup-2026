"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSettingsMenu } from "@/components/SettingsMenuContext";
import { useT } from "@/components/SettingsProvider";

function IconBall({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  );
}

function IconGrid({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function IconTrophy({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

function IconStar({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function IconUser({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

type NavItemProps = {
  label: string;
  active: boolean;
  onClick?: () => void;
  href?: string;
  icon: ReactNode;
};

function NavItem({ label, active, onClick, href, icon }: NavItemProps) {
  const className = `flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-0.5 py-1 transition-colors ${
    active ? "text-accent" : "text-muted"
  }`;

  const content = (
    <>
      {icon}
      <span className="max-w-full truncate text-xs font-semibold leading-tight">
        {label}
      </span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className} prefetch>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useT();
  const { open: menuOpen, openTo } = useSettingsMenu();

  const favouritesActive =
    pathname === "/" && searchParams.get("favourites") === "1";
  const matchesActive = pathname === "/" && !favouritesActive;
  const groupsActive = pathname.startsWith("/grupos");
  const knockoutsActive =
    pathname.startsWith("/fasefinal") || pathname.startsWith("/eliminatorias");
  const profileActive =
    menuOpen || pathname.startsWith("/admin") || pathname === "/conta";

  function goTodayMatches() {
    router.push("/?today=1");
  }

  function goFavourites() {
    router.push("/?favourites=1");
  }

  function openProfile() {
    openTo("profile");
  }

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border-base bg-background/95 backdrop-blur-xl sm:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label={t("nav.bottom.label")}
    >
      <div className="mx-auto flex h-14 max-w-lg items-stretch justify-around px-1">
        <NavItem
          label={t("nav.bottom.matches")}
          active={matchesActive}
          onClick={goTodayMatches}
          icon={<IconBall className={matchesActive ? "text-accent" : undefined} />}
        />
        <NavItem
          label={t("nav.bottom.groups")}
          active={groupsActive}
          href="/grupos"
          icon={<IconGrid className={groupsActive ? "text-accent" : undefined} />}
        />
        <NavItem
          label={t("nav.bottom.knockouts")}
          active={knockoutsActive}
          href="/fasefinal"
          icon={
            <IconTrophy className={knockoutsActive ? "text-accent" : undefined} />
          }
        />
        <NavItem
          label={t("nav.bottom.favourites")}
          active={favouritesActive}
          onClick={goFavourites}
          icon={<IconStar className={favouritesActive ? "text-accent" : undefined} />}
        />
        <NavItem
          label={t("nav.bottom.profile")}
          active={profileActive}
          onClick={openProfile}
          icon={<IconUser className={profileActive ? "text-accent" : undefined} />}
        />
      </div>
    </nav>
  );
}
