"use client";

import { useCallback } from "react";
import type { Cell, CellState } from "@/lib/viz/types";
import { useCellRegistry } from "./cell-registry";

/**
 * State -> box styling. Amber (`active`) is the reserved "this is live right
 * now" accent and appears in exactly one row of this table on purpose.
 */
const BOX_STATE: Record<CellState, string> = {
  idle: "border-border-strong bg-surface",
  active: "border-amber bg-amber-wash cv-cell-live",
  read: "border-steel bg-steel-wash",
  written: "border-steel bg-steel-wash",
  allocated: "border-steel bg-steel-wash",
  freed: "border-border-strong border-dashed bg-transparent cv-hatch",
  padding: "border-border border-dashed bg-transparent cv-hatch",
  garbage: "border-border-strong border-dashed bg-transparent cv-hatch",
  success: "border-green bg-green-wash",
  danger: "border-danger bg-danger-wash",
};

/** Value text colour, kept separate so dimmed states don't dim their border. */
const VALUE_STATE: Record<CellState, string> = {
  idle: "text-ink",
  active: "text-ink",
  read: "text-ink",
  written: "text-ink",
  allocated: "text-ink",
  freed: "text-muted line-through",
  padding: "text-muted",
  garbage: "text-muted",
  success: "text-ink",
  danger: "text-ink",
};

/** Tiny corner tag, for states that need naming rather than just colouring. */
const STATE_TAG: Partial<Record<CellState, { label: string; className: string }>> = {
  // Filled chips read against the page in both themes only if the fill is a
  // text-weight colour and the label takes the page background.
  allocated: { label: "new", className: "bg-steel text-bg" },
  freed: { label: "freed", className: "bg-muted text-bg" },
  garbage: { label: "?", className: "bg-muted text-bg" },
  danger: { label: "!", className: "bg-danger text-bg" },
};

export type CellShape = "box" | "byte" | "bit";

interface Props {
  cell: Cell;
  shape?: CellShape;
}

/**
 * One box of memory.
 *
 * Name, value and address all live *inside* the box. That is a deliberate
 * layout constraint, not a style choice: pointer arrows land on box edges, so
 * anything printed outside a box would sit in an arrow's path.
 */
export function MemoryCell({ cell, shape = "box" }: Props) {
  const { register } = useCellRegistry();
  const state = cell.state ?? "idle";
  const tag = STATE_TAG[state];

  const ref = useCallback(
    (el: HTMLDivElement | null) => {
      register(cell.id, el);
    },
    [register, cell.id],
  );

  const box = (
    <div
      ref={ref}
      data-cell={cell.id}
      data-state={state}
      className={[
        "relative flex flex-col justify-center rounded-md border-2 font-mono",
        "transition-[background-color,border-color,box-shadow] duration-300 ease-out",
        shape === "box" ? "min-w-[6.75rem] px-2 py-1.5" : "",
        shape === "byte" ? "w-full px-1 py-1" : "",
        shape === "bit" ? "h-9 w-8 items-center px-0 py-0" : "",
        BOX_STATE[state],
      ].join(" ")}
    >
      {/* name + type, inside the box so arrows have clear air outside it */}
      {shape !== "bit" && (cell.name || cell.type) && (
        <div className="flex items-baseline justify-between gap-2 leading-none">
          <span className="truncate text-[0.6875rem] text-ink/85">{cell.name}</span>
          {cell.type && shape === "box" && (
            <span className="shrink-0 text-[0.625rem] text-muted">{cell.type}</span>
          )}
        </div>
      )}

      <div
        className={[
          "flex items-center justify-center tabular-nums",
          shape === "box" ? "py-0.5 text-[0.9375rem]" : "",
          shape === "byte" ? "text-xs" : "",
          shape === "bit" ? "h-full text-sm" : "",
          VALUE_STATE[state],
        ].join(" ")}
      >
        {cell.value ?? " "}
      </div>

      {cell.address && shape !== "bit" && (
        <div className="text-center text-[0.625rem] leading-none text-muted tabular-nums">
          {cell.address}
        </div>
      )}

      {tag && shape === "box" && (
        <span
          className={[
            "absolute -top-2 -right-1.5 rounded-sm px-1 py-px",
            "text-[0.5625rem] leading-tight uppercase tracking-wide",
            tag.className,
          ].join(" ")}
        >
          {tag.label}
        </span>
      )}
    </div>
  );

  if (!cell.note) {
    return shape === "byte" ? <div className="w-full">{box}</div> : box;
  }

  return (
    <div className={`flex flex-col items-center gap-1 ${shape === "byte" ? "w-full" : ""}`}>
      {box}
      <span className="max-w-[9rem] text-center font-mono text-[0.625rem] leading-tight text-muted">
        {cell.note}
      </span>
    </div>
  );
}
