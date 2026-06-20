import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import { AppChrome } from "@/components/AppChrome";
import { ConsentProvider } from "@/components/ConsentProvider";
import { CookieConsent } from "@/components/CookieConsent";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { ProfileSync } from "@/components/ProfileSync";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { SettingsProvider } from "@/components/SettingsProvider";
import { T } from "@/components/Display";
import { THEME_INIT_SCRIPT } from "@/lib/themes";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: "700",
});

export const metadata: Metadata = {
  title: "Cucos WC26 — Jogos e TV Portugal",
  description:
    "Mundial FIFA 2026: jogos de hoje, horários em Portugal e canais de TV.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Cucos WC26",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      dir="ltr"
      data-theme="dark"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <GoogleAnalytics />
        {ADSENSE_CLIENT_ID ? (
          // Tag literal no HTML inicial — obrigatório para verificação AdSense (crawler não vê preload do next/script)
          <script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
            crossOrigin="anonymous"
          />
        ) : null}
      </head>
      <body
        className="flex min-h-screen flex-col font-sans text-foreground antialiased"
      >
        <SettingsProvider>
          <ConsentProvider>
            <ProfileSync />
            <AppChrome>
            <main className="w-full flex-1 px-4 py-6 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] sm:pb-6 lg:px-6">
              {children}
            </main>
            <footer className="mt-10 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] text-center text-xs text-muted sm:pb-8">
              <p className="text-muted/60">🐱 Dedicado ao Miiuuu</p>
              <p className="mt-1">
                <a href="/privacidade" className="text-muted hover:text-accent hover:underline">
                  <T k="footer.privacy" />
                </a>
              </p>
              <p className="mt-0.5">© 2026 Cuco Enterprise</p>
            </footer>
            </AppChrome>
            <CookieConsent />
            <ServiceWorkerRegister />
            <Analytics />
            <SpeedInsights />
          </ConsentProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
