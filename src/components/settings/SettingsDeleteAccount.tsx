"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSettings } from "@/components/SettingsProvider";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

export function SettingsDeleteAccount() {
  const { t } = useSettings();
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openDialog() {
    setConfirmed(false);
    setError(null);
    setDialogOpen(true);
  }

  function closeDialog() {
    if (deleting) return;
    setDialogOpen(false);
    setConfirmed(false);
    setError(null);
  }

  async function handleDelete() {
    if (!confirmed || deleting) return;
    setDeleting(true);
    setError(null);

    try {
      const res = await fetch("/api/account", {
        method: "DELETE",
        credentials: "same-origin",
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? t("deleteAccount.error"));
        setDeleting(false);
        return;
      }

      const supabase = createSupabaseBrowser();
      await supabase.auth.signOut();
      setDialogOpen(false);
      router.push("/?accountDeleted=1");
      router.refresh();
    } catch (err) {
      console.error("[delete account]", err);
      setError(t("deleteAccount.error"));
      setDeleting(false);
    }
  }

  const listItems = [
    t("deleteAccount.list.profile"),
    t("deleteAccount.list.favourites"),
    t("deleteAccount.list.calendar"),
    t("deleteAccount.list.notifications"),
  ];

  return (
    <>
      <section
        aria-labelledby="delete-account-heading"
        className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/5 p-4"
      >
        <h3
          id="delete-account-heading"
          className="text-sm font-bold text-red-600 dark:text-red-400"
        >
          {t("deleteAccount.title")}
        </h3>
        <p className="mt-2 text-sm text-muted">{t("deleteAccount.summary")}</p>
        <button
          type="button"
          onClick={openDialog}
          className="mt-3 w-full rounded-xl border border-red-500/40 bg-transparent px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-500/10 dark:text-red-400"
        >
          {t("deleteAccount.openDialog")}
        </button>
      </section>

      {dialogOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/45 p-4 sm:items-center"
          role="presentation"
          onClick={closeDialog}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-dialog-title"
            className="w-full max-w-md rounded-2xl border border-border-base bg-surface p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h4
              id="delete-account-dialog-title"
              className="text-lg font-bold text-foreground"
            >
              {t("deleteAccount.dialogTitle")}
            </h4>
            <p className="mt-2 text-sm text-muted">{t("deleteAccount.dialogBody")}</p>

            <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-foreground">
              {listItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-border-base bg-surface-2 p-3">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                disabled={deleting}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-border-base text-red-600 focus:ring-red-500/40"
              />
              <span className="text-sm text-foreground">
                {t("deleteAccount.confirmLabel")}
              </span>
            </label>

            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeDialog}
                disabled={deleting}
                className="rounded-xl border border-border-base bg-surface-2 px-4 py-2.5 text-sm font-semibold text-foreground transition hover:brightness-95 disabled:opacity-50"
              >
                {t("deleteAccount.cancel")}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={!confirmed || deleting}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? t("deleteAccount.deleting") : t("deleteAccount.button")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
