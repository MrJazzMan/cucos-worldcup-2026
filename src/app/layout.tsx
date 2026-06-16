import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppHeader } from "@/components/AppHeader";
import { LoginGate } from "@/components/LoginGate";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { SettingsProvider } from "@/components/SettingsProvider";
import { T } from "@/components/Display";
import { createSupabaseServer } from "@/lib/supabase/server";
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

const themeInitScript = `(function(){try{var c=localStorage.getItem('cucos-theme')||'system';var d=c==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):c;document.documentElement.setAttribute('data-theme',d);}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let initialLoggedIn = false;
  const supabase = await createSupabaseServer();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    initialLoggedIn = !!user;
  }

  return (
    <html lang="pt-PT" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} flex min-h-screen flex-col font-sans text-foreground antialiased`}
      >
        <SettingsProvider>
          <LoginGate initialLoggedIn={initialLoggedIn} />
          <AppHeader />
          <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
            {children}
          </main>
          <footer className="mt-10 pb-8 text-center text-xs text-muted">
            <p className="text-muted/60">🐱 Dedicado ao Miiuuu</p>
            <p className="mt-1"><T k="footer.production" />: Miguel Garcia</p>
            <p className="mt-0.5">© 2026 Cuco Enterprise</p>
          </footer>
          <ServiceWorkerRegister />
          <Analytics />
          <SpeedInsights />
        </SettingsProvider>
      </body>
    </html>
  );
}
