"use client";

import { createContext, useContext, useState } from "react";

type SettingsMenuContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const SettingsMenuContext = createContext<SettingsMenuContextValue | null>(null);

export function SettingsMenuProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <SettingsMenuContext.Provider value={{ open, setOpen }}>
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
