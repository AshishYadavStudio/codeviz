"use client";

import { useCallback } from "react";
import type { CellState, Region, TreeNode } from "@/lib/viz/types";
import { useCellRegistry } from "./cell-registry";

/**
 * An indented hierarchy: filesystem paths, inheritance chains.
 *
 * Nodes register as cells so a symlink can be drawn as an arrow to its target,
 * and so a "current working directory" marker can be highlighted like any other
 * live element.
 */

const NODE_STATE: Record<CellState, string> = {
  idle: "text-ink",
  active: "bg-amber-wash text-ink",
  read: "bg-steel-wash text-ink",
  written: "bg-steel-wash text-ink",
  allocated: "bg-steel-wash text-ink",
  freed: "text-muted line-through opacity-60",
  padding: "text-muted",
  garbage: "text-muted italic",
  success: "bg-green-wash text-ink",
  danger: "bg-danger-wash text-ink",
};

const GLYPH: Record<NonNullable<TreeNode["kind"]>, string> = {
  dir: "▸",
  file: "·",
  link: "→",
  device: "◇",
};

export function TreeRegion({ region }: { region: Region }) {
  const nodes = region.tree;
  if (!nodes?.length) return null;

  return (
    <div className="inline-block min-w-[16rem] max-w-full rounded-md border border-border-strong bg-surface py-1.5">
      {nodes.map((node) => (
        <TreeRow key={node.id} node={node} />
      ))}
    </div>
  );
}

function TreeRow({ node }: { node: TreeNode }) {
  const { register } = useCellRegistry();
  const state = node.state ?? "idle";

  const ref = useCallback(
    (el: HTMLDivElement | null) => {
      register(node.id, el);
    },
    [register, node.id],
  );

  return (
    <div
      ref={ref}
      data-cell={node.id}
      data-state={state}
      className={[
        "flex items-center gap-2 px-2 py-0.5 font-mono text-xs transition-colors duration-300",
        NODE_STATE[state],
      ].join(" ")}
      style={{ paddingLeft: `${0.5 + node.depth * 1.15}rem` }}
    >
      <span
        aria-hidden
        className={node.kind === "dir" ? "text-steel" : "text-muted"}
      >
        {GLYPH[node.kind ?? "file"]}
      </span>

      <span className={node.kind === "dir" ? "font-medium" : undefined}>{node.label}</span>

      {node.note && <span className="text-[0.625rem] text-muted">{node.note}</span>}

      {node.meta && (
        <span className="ml-auto pl-4 text-[0.625rem] text-muted tabular-nums">{node.meta}</span>
      )}
    </div>
  );
}
