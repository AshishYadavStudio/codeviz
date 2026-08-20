"use client";

import type { Cell, Frame, Region } from "@/lib/viz/types";
import { MemoryCell, type CellShape } from "./MemoryCell";
import { TableRegion } from "./TableRegion";
import { TreeRegion } from "./TreeRegion";
import { NodeRegion } from "./NodeRegion";

/** Width of one byte in a `bytes` lane. Scales with classroom mode. */
const BYTE_UNIT = "var(--byte-unit, 2.125rem)";

const FRAME_STATE: Record<NonNullable<Frame["state"]>, string> = {
  idle: "border-border-strong bg-surface",
  active: "border-steel bg-surface shadow-[0_0_0_3px_var(--steel-wash)]",
  returning: "border-green bg-surface shadow-[0_0_0_3px_var(--green-wash)]",
  popped: "border-border border-dashed bg-transparent opacity-55",
};

export function RegionView({ region }: { region: Region }) {
  return (
    <section className="flex flex-col gap-2" aria-label={region.label}>
      <header className="flex items-baseline gap-2">
        <h4 className="cv-eyebrow !text-ink/70">{region.label}</h4>
        {region.caption && (
          <span className="font-mono text-[0.625rem] text-muted">{region.caption}</span>
        )}
      </header>

      {region.kind === "stack" && <StackRegion region={region} />}
      {region.kind === "heap" && <BlockRegion region={region} />}
      {region.kind === "blocks" && <BlockRegion region={region} />}
      {region.kind === "static" && <BlockRegion region={region} muted />}
      {region.kind === "bytes" && <LaneRegion region={region} shape="byte" />}
      {region.kind === "bits" && <LaneRegion region={region} shape="bit" />}
      {region.kind === "table" && <TableRegion region={region} />}
      {region.kind === "tree" && <TreeRegion region={region} />}
      {region.kind === "nodes" && <NodeRegion region={region} />}
    </section>
  );
}

/* -------------------------------------------------------------------------- */

function StackRegion({ region }: { region: Region }) {
  const frames = region.frames ?? [];

  return (
    <div className="relative flex flex-col gap-2 pl-5">
      {/* rail: the stack grows downward as calls nest */}
      <div
        aria-hidden
        className="absolute left-0 top-1 bottom-1 w-px bg-border-strong"
      />
      <span
        aria-hidden
        className="absolute -left-0.5 bottom-0 text-[0.625rem] leading-none text-muted"
      >
        ▼
      </span>

      {frames.map((frame) => (
        <FrameCard key={frame.id} frame={frame} />
      ))}

      {frames.length === 0 && <EmptyNote>stack empty</EmptyNote>}
    </div>
  );
}

function FrameCard({ frame }: { frame: Frame }) {
  return (
    <div
      data-frame={frame.id}
      className={[
        "rounded-md border-2 transition-[border-color,box-shadow,opacity] duration-300",
        FRAME_STATE[frame.state ?? "idle"],
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-1.5">
        <span className="font-mono text-xs font-medium text-ink">{frame.label}</span>
        {frame.badge && (
          <span className="font-mono text-[0.625rem] text-muted">{frame.badge}</span>
        )}
      </div>

      <div className="flex flex-col gap-8 px-4 py-4">
        {groupRows(frame.cells).map((row, i) => (
          <div key={i} className="flex flex-wrap items-start gap-x-5 gap-y-6">
            {row.map((cell) => (
              <MemoryCell key={cell.id} cell={cell} />
            ))}
          </div>
        ))}
        {frame.cells.length === 0 && (
          <span className="py-2 font-mono text-[0.6875rem] text-muted">no locals yet</span>
        )}
      </div>

      {frame.note && (
        <p className="border-t border-border px-3 py-1.5 font-mono text-[0.625rem] text-muted">
          {frame.note}
        </p>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

/** Heap allocations and static storage: labelled blocks, not call frames. */
function BlockRegion({ region, muted }: { region: Region; muted?: boolean }) {
  const frames = region.frames ?? [];

  return (
    <div className="flex flex-col gap-2">
      {frames.map((frame) => (
        <div
          key={frame.id}
          data-frame={frame.id}
          className={[
            "rounded-md border-2 transition-[border-color,box-shadow,opacity] duration-300",
            frame.state === "popped"
              ? "border-border border-dashed bg-transparent opacity-60"
              : muted
                ? "border-border bg-transparent"
                : FRAME_STATE[frame.state ?? "idle"],
          ].join(" ")}
        >
          <div className="flex items-center justify-between gap-3 border-b border-border px-3 py-1.5">
            <span className="font-mono text-xs text-ink">{frame.label}</span>
            {frame.badge && (
              <span className="font-mono text-[0.625rem] text-muted">{frame.badge}</span>
            )}
          </div>
          <div className="flex flex-col gap-8 px-4 py-4">
            {groupRows(frame.cells).map((row, i) => (
              <div key={i} className="flex flex-wrap items-start gap-x-5 gap-y-6">
                {row.map((cell) => (
                  <MemoryCell key={cell.id} cell={cell} />
                ))}
              </div>
            ))}
          </div>
          {frame.note && (
            <p className="border-t border-border px-3 py-1.5 font-mono text-[0.625rem] text-muted">
              {frame.note}
            </p>
          )}
        </div>
      ))}

      {region.cells && region.cells.length > 0 && (
        <div className="flex flex-wrap items-start gap-x-5 gap-y-6">
          {region.cells.map((cell) => (
            <MemoryCell key={cell.id} cell={cell} />
          ))}
        </div>
      )}

      {frames.length === 0 && !region.cells?.length && <EmptyNote>nothing allocated</EmptyNote>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

/**
 * Contiguous lanes — struct bytes, string characters, bit patterns. Cells sit
 * flush against each other so the layout reads as one block of memory.
 */
function LaneRegion({ region, shape }: { region: Region; shape: CellShape }) {
  const lanes: Frame[] =
    region.frames ?? [{ id: `${region.id}-lane`, label: "", cells: region.cells ?? [] }];

  return (
    <div className="flex flex-col gap-3">
      {lanes.map((lane) => (
        <div key={lane.id} className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {lane.label && (
            <span className="min-w-[3.5rem] font-mono text-xs text-ink">{lane.label}</span>
          )}

          <div className="flex items-end gap-px">
            {lane.cells.map((cell, i) => (
              <div
                key={cell.id}
                style={
                  shape === "byte"
                    ? { width: `calc(${BYTE_UNIT} * ${cell.bytes ?? 1})` }
                    : undefined
                }
                className={
                  // group bits into nibbles for readability
                  shape === "bit" && i > 0 && i % 4 === 0 ? "ml-2" : undefined
                }
              >
                <MemoryCell cell={cell} shape={shape} />
              </div>
            ))}
          </div>

          {lane.badge && (
            <span className="font-mono text-xs text-muted tabular-nums">{lane.badge}</span>
          )}
        </div>
      ))}
    </div>
  );
}

/** Splits a frame's cells into visual rows by their `row` index. */
function groupRows(cells: Cell[]): Cell[][] {
  const rows = new Map<number, Cell[]>();
  for (const cell of cells) {
    const key = cell.row ?? 0;
    const bucket = rows.get(key);
    if (bucket) bucket.push(cell);
    else rows.set(key, [cell]);
  }
  return [...rows.entries()].sort((a, b) => a[0] - b[0]).map(([, cells]) => cells);
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-dashed border-border px-3 py-4 font-mono text-[0.6875rem] text-muted">
      {children}
    </div>
  );
}
