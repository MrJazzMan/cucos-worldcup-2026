"use client";

import Script from "next/script";

const CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

/**
 * Script de verificação AdSense — tem de estar no <head> em todas as páginas,
 * mesmo sem consentimento de cookies (crawler do Google).
 * Os anúncios visíveis continuam gated em AdSenseUnit.
 */
export function AdSenseScript() {
  if (!CLIENT_ID) return null;

  return (
    <Script
      id="adsense-script"
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${CLIENT_ID}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
