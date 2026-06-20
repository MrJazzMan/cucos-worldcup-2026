"use client";

import { createContext, useCallback, useContext, useState } from "react";
import type { SettingsPanelView } from "@/lib/settings-menu-views";

type SettingsMenuContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  /** Abre o painel directamente numa secção (ex.: Perfil no telemóvel). */
  openTo: (view: SettingsPanelView) => void;
  pendingView: SettingsPanelView | null;
  clearPendingView: () => void;
};

const SettingsMenuContext = createContext<SettingsMenuContextValue | null>(null);

export function SettingsMenuProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpenState] = useState(false);
  const [pendingView, setPendingView] = useState<SettingsPanelView | null>(null);

  const setOpen = useCallback((next: boolean) => {
    setOpenState(next);
    if (!next) setPendingView(null);
  }, []);

  const openTo = useCallback((view: SettingsPanelView) => {
    setPendingView(view);
    setOpenState(true);
  }, []);

  const clearPendingView = useCallback(() => {
    setPendingView(null);
  }, []);

  return (
    <SettingsMenuContext.Provider
      value={{ open, setOpen, openTo, pendingView, clearPendingView }}
    >
      {children}
    </SettingsMenuContext.Provider>
  );
}

export function useSettingsMenu() {
  const ctx = useContext(SettingsMenuContext);
  if (!ctx) {
    throw new Error("useSettingsMenu deve ser usado dentro de SettingsMenuProvider");
  }
  return ctx;
}
