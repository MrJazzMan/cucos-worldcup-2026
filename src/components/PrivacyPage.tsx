"use client";

import Link from "next/link";
import { useSettings } from "@/components/SettingsProvider";
import { PRIVACY } from "@/lib/privacy-content";

export function PrivacyPage() {
  const { lang } = useSettings();
  const content = PRIVACY[lang === "pt" ? "pt" : "en"];

  return (
    <article className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground">{content.title}</h1>
        <p className="mt-1 text-sm text-muted">{content.updated}</p>
        <p className="mt-4 text-sm leading-relaxed text-foreground">{content.intro}</p>
      </header>

      {content.sections.map((section) => (
        <section key={section.heading}>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            {section.heading}
          </h2>
          <div className="space-y-2">
            {section.paragraphs.map((p) => (
              <p key={p} className="text-sm leading-relaxed text-muted">
                {p}
              </p>
            ))}
          </div>
        </section>
      ))}

      <footer className="rounded-xl border border-border-base bg-surface-2 p-4">
        <p className="text-sm text-foreground">{content.contact}</p>
        <Link
          href="/"
          className="mt-3 inline-block text-sm font-semibold text-accent hover:underline"
        >
          ← wc26.pt
        </Link>
      </footer>
    </article>
  );
}
