"use client";

import { BracketSlotCard } from "@/components/knockout/BracketSlotCard";
import { KnockoutBracketDesktop } from "@/components/knockout/KnockoutBracketDesktop";
import { useSettings } from "@/components/SettingsProvider";
import type { KnockoutRoundColumn } from "@/lib/knockout-bracket";

type KnockoutBracketProps = {
  columns: KnockoutRoundColumn[];
  preview?: boolean;
};

export function KnockoutBracket({ columns, preview = false }: KnockoutBracketProps) {
  const { t } = useSettings();
  const tbd = t("knockouts.tbd");

  return (
    <>
      <KnockoutBracketDesktop columns={columns} preview={preview} />

      {/* Mobile / tablet: colunas com scroll horizontal */}
      <div className="relative -mx-4 lg:hidden sm:mx-0">
        <div className="overflow-x-auto pb-2 sm:pb-4">
          <div className="flex min-w-max gap-3 px-4 sm:gap-4 sm:px-0">
            {columns.map((column) => {
              const slots = Array.from({ length: column.slotCount }, (_, i) => ({
                match: column.matches[i],
                preview:
                  preview && !column.matches[i]
                    ? column.previews[i]
                    : undefined,
              }));

              return (
                <section
                  key={column.key}
                  className="flex w-36 shrink-0 flex-col sm:w-40"
                >
                  <h2 className="sticky top-0 z-10 mb-2 rounded-lg border border-border-base bg-surface px-1 py-1.5 text-center text-[10px] font-bold uppercase tracking-wide text-foreground sm:text-[11px]">
                    {t(column.labelKey)}
                  </h2>
                  <div className="flex flex-col gap-2">
                    {slots.map((data, index) => (
                      <BracketSlotCard
                        key={
                          data.match?.fixture_id ??
                          `${column.key}-${index}`
                        }
                        data={data}
                        tbd={tbd}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
        <p className="mt-2 text-center text-[10px] text-muted">
          ← {t("knockouts.scrollHint")} →
        </p>
      </div>
    </>
  );
}
