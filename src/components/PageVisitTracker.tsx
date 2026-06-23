"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackPageVisit } from "@/lib/page-visits";

/** Regista uma visita por carregamento ou mudança de rota (App Router). */
export function PageVisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    void trackPageVisit(pathname);
  }, [pathname]);

  return null;
}
