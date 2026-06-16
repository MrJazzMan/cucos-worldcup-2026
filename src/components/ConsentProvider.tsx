"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  readConsent,
  updateGoogleConsent,
  writeConsent,
  type ConsentChoice,
} from "@/lib/consent";

type ConsentContextValue = {
  consent: ConsentChoice;
  accept: () => void;
  reject: () => void;
  adsAllowed: boolean;
  analyticsAllowed: boolean;
};

const ConsentContext = createContext<ConsentContextValue | null>(null);

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsent] = useState<ConsentChoice>("pending");

  useEffect(() => {
    setConsent(readConsent());
  }, []);

  const accept = useCallback(() => {
    writeConsent("accepted");
    setConsent("accepted");
    updateGoogleConsent(true);
  }, []);

  const reject = useCallback(() => {
    writeConsent("rejected");
    setConsent("rejected");
    updateGoogleConsent(false);
  }, []);

  const allowed = consent === "accepted";

  return (
    <ConsentContext.Provider
      value={{
        consent,
        accept,
        reject,
        adsAllowed: allowed,
        analyticsAllowed: allowed,
      }}
    >
      {children}
    </ConsentContext.Provider>
  );
}

export function useConsent() {
  const ctx = useContext(ConsentContext);
  if (!ctx) {
    throw new Error("useConsent deve ser usado dentro de ConsentProvider");
  }
  return ctx;
}
