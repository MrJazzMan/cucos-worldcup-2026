"use client";

import { useMemo } from "react";
import { BracketSlotCard } from "@/components/knockout/BracketSlotCard";
import { useSettings } from "@/components/SettingsProvider";
import type { KnockoutRoundColumn } from "@/lib/knockout-bracket";
import {
  buildSideTree,
  getCenterSlots,
  type BracketTreeNode,
} from "@/lib/knockout-bracket-tree";

type KnockoutBracketDesktopProps = {
  columns: KnockoutRoundColumn[];
  preview?: boolean;
};

function BracketConnector({ side }: { side: "left" | "right" }) {
  const stem =
    side === "left"
      ? "right-0 border-r border-border-base"
      : "left-0 border-l border-border-base";
  const topArm =
    side === "left"
      ? "left-0 right-1/2 top-[25%] border-t border-border-base"
      : "left-1/2 right-0 top-[25%] border-t border-border-base";
  const bottomArm =
    side === "left"
      ? "left-0 right-1/2 bottom-[25%] border-b border-border-base"
      : "left-1/2 right-0 bottom-[25%] border-b border-border-base";
  const outArm =
    side === "left"
      ? "left-1/2 right-0 top-1/2 border-t border-border-base"
      : "left-0 right-1/2 top-1/2 border-t border-border-base";

  return (
    <div
      className="relative w-5 shrink-0 self-stretch"
      aria-hidden
    >
      <span
        className={`absolute top-[25%] bottom-[25%] w-1/2 ${stem}`}
      />
      <span className={`absolute ${topArm}`} />
      <span className={`absolute ${bottomArm}`} />
      <span className={`absolute ${outArm}`} />
    </div>
  );
}

function BracketSubtree({
  node,
  side,
  tbd,
}: {
  node: BracketTreeNode;
  side: "left" | "right";
  tbd: string;
}) {
  if (!node.left || !node.right) {
    return (
      <div className="w-36 shrink-0 xl:w-40">
        <BracketSlotCard data={node.slot} tbd={tbd} compact />
      </div>
    );
  }

  const children = (
    <div className="flex flex-col justify-center gap-1">
      <BracketSubtree node={node.left} side={side} tbd={tbd} />
      <BracketSubtree node={node.right} side={side} tbd={tbd} />
    </div>
  );

  const slot = (
    <div className="w-32 shrink-0 xl:w-36">
      <BracketSlotCard data={node.slot} tbd={tbd} compact />
    </div>
  );

  if (side === "left") {
    return (
      <div className="flex items-center">
        {children}
        <BracketConnector side="left" />
        {slot}
      </div>
    );
  }

  return (
    <div className="flex items-center">
      {slot}
      <BracketConnector side="right" />
      {children}
    </div>
  );
}

export function KnockoutBracketDesktop({
  columns,
  preview = false,
}: KnockoutBracketDesktopProps) {
  const { t } = useSettings();
  const tbd = t("knockouts.tbd");

  const { leftTree, rightTree, center } = useMemo(
    () => ({
      leftTree: buildSideTree(columns, "left", preview),
      rightTree: buildSideTree(columns, "right", preview),
      center: getCenterSlots(columns, preview),
    }),
    [columns, preview]
  );

  return (
    <div className="hidden w-full lg:block">
      <div className="overflow-x-auto pb-2">
        <div className="mx-auto flex min-w-max items-center justify-center gap-0 px-2">
          <BracketSubtree node={leftTree} side="left" tbd={tbd} />

          <div className="flex shrink-0 flex-col items-center gap-3 px-4">
            <div className="w-40 xl:w-44">
              <p className="mb-1.5 text-center text-[10px] font-bold uppercase tracking-wide text-foreground">
                {t("knockouts.round.final")}
              </p>
              <BracketSlotCard data={center.final} tbd={tbd} />
            </div>
            <div className="w-40 xl:w-44">
              <p className="mb-1.5 text-center text-[10px] font-bold uppercase tracking-wide text-muted">
                {t("knockouts.round.third")}
              </p>
              <BracketSlotCard data={center.third} tbd={tbd} />
            </div>
          </div>

          <BracketSubtree node={rightTree} side="right" tbd={tbd} />
        </div>
      </div>
    </div>
  );
}
