"use client";

import { useCallback } from "react";
import type { CellState, GraphNode, Region } from "@/lib/viz/types";
import { useCellRegistry } from "./cell-registry";

/**
 * Positioned nodes joined by edges — BSTs, heaps, linked lists, graphs.
 *
 * Placement is explicit (`level` / `slot`) rather than auto-computed. A layout
 * algorithm would re-balance between steps and make nodes jump around, which is
 * exactly what a teaching diagram must not do: the learner is tracking one node
 * moving, so everything else has to stay put.
 *
 * Nodes register as cells, so edges are ordinary `Arrow`s drawn by the shared
 * arrow layer — no separate edge renderer.
 */

const SLOT_WIDTH = 68; // px between adjacent slots
const LEVEL_HEIGHT = 84; // px between levels
const NODE = 46; // node diameter / box height

const NODE_STATE: Record<CellState, string> = {
  idle: "border-border-strong bg-surface text-ink",
  active: "border-amber bg-amber-wash text-ink cv-cell-live",
  read: "border-steel bg-steel-wash text-ink",
  written: "border-steel bg-steel-wash text-ink",
  allocated: "border-steel bg-steel-wash text-ink",
  freed: "border-border-strong border-dashed bg-transparent text-muted cv-hatch",
  padding: "border-border border-dashed bg-transparent text-muted",
  garbage: "border-border-strong border-dashed bg-transparent text-muted cv-hatch",
  success: "border-green bg-green-wash text-ink",
  danger: "border-danger bg-danger-wash text-ink",
};

export function NodeRegion({ region }: { region: Region }) {
  const nodes = region.nodes ?? [];

  if (nodes.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border px-3 py-4 font-mono text-[0.6875rem] text-muted">
        empty
      </div>
    );
  }

  const maxLevel = Math.max(...nodes.map((n) => n.level));
  const maxSlot = Math.max(...nodes.map((n) => n.slot));
  const minSlot = Math.min(...nodes.map((n) => n.slot));

  // Leave a node's width of margin on each side so edge curves are not clipped.
  const width = (maxSlot - minSlot) * SLOT_WIDTH + NODE + 24;
  const height = maxLevel * LEVEL_HEIGHT + NODE + 28;

  return (
    <div className="relative" style={{ width, height }}>
      {nodes.map((node) => (
        <Node key={node.id} node={node} minSlot={minSlot} />
      ))}
    </div>
  );
}

function Node({ node, minSlot }: { node: GraphNode; minSlot: number }) {
  const { register } = useCellRegistry();

  const ref = useCallback(
    (el: HTMLDivElement | null) => {
      register(node.id, el);
    },
    [register, node.id],
  );

  const left = (node.slot - minSlot) * SLOT_WIDTH + 12;
  const top = node.level * LEVEL_HEIGHT + 8;
  const isBox = node.shape === "box";

  return (
    <div className="absolute flex flex-col items-center" style={{ left, top }}>
      <div
        ref={ref}
        data-cell={node.id}
        data-state={node.state ?? "idle"}
        className={[
          "flex items-center justify-center border-2 font-mono text-sm tabular-nums",
          "transition-[background-color,border-color,box-shadow] duration-300 ease-out",
          isBox ? "rounded-md px-2" : "rounded-full",
          NODE_STATE[node.state ?? "idle"],
        ].join(" ")}
        style={{ width: isBox ? "auto" : NODE, height: NODE, minWidth: NODE }}
      >
        {node.label}
      </div>

      {node.note && (
        <span className="mt-1 max-w-[6rem] text-center font-mono text-[0.625rem] leading-tight text-muted">
          {node.note}
        </span>
      )}
    </div>
  );
}
