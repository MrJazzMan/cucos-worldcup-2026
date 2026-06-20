"use client";

import { Suspense } from "react";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { SettingsMenuProvider } from "@/components/SettingsMenuContext";

export function AppChrome({ children }: { children: React.ReactNode }) {
  return (
    <SettingsMenuProvider>
      <AppHeader />
      {children}
      <Suspense fallback={null}>
        <BottomNav />
      </Suspense>
    </SettingsMenuProvider>
  );
}
