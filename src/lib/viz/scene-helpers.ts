import type { Cell, CellState, Frame, GraphNode, Region } from "./types";

/** Small constructors so lesson files stay declarative rather than fiddly. */

export const stackRegion = (frames: Frame[], caption?: string): Region => ({
  id: "stack",
  kind: "stack",
  label: "Stack",
  caption,
  frames,
});

export const heapRegion = (frames: Frame[], caption?: string): Region => ({
  id: "heap",
  kind: "heap",
  label: "Heap",
  caption,
  frames,
});

export const staticRegion = (frames: Frame[], caption?: string): Region => ({
  id: "static",
  kind: "static",
  label: "Static storage",
  caption,
  frames,
});

/** Generic labelled groups — processes, pipeline stages, objects. */
export const blocksRegion = (
  id: string,
  label: string,
  frames: Frame[],
  caption?: string,
): Region => ({ id, kind: "blocks", label, caption, frames });

export const byteRegion = (
  id: string,
  label: string,
  lanes: Frame[],
  caption?: string,
): Region => ({ id, kind: "bytes", label, caption, frames: lanes });

/** Positioned nodes joined by edges — BSTs, heaps, linked lists, graphs. */
export const nodeRegion = (
  id: string,
  label: string,
  nodes: GraphNode[],
  caption?: string,
): Region => ({ id, kind: "nodes", label, caption, nodes });

export const bitRegion = (
  id: string,
  label: string,
  lanes: Frame[],
  caption?: string,
): Region => ({ id, kind: "bits", label, caption, frames: lanes });

/** 8 bits, most significant first — the order people write them in. */
export function bits8(
  idPrefix: string,
  value: number,
  opts: { highlight?: (bit: number, index: number) => CellState | undefined } = {},
): Cell[] {
  return Array.from({ length: 8 }, (_, i) => {
    const position = 7 - i;
    const bit = (value >> position) & 1;
    return {
      id: `${idPrefix}-${position}`,
      value: String(bit),
      state: opts.highlight?.(bit, position) ?? (bit ? "read" : "idle"),
    } satisfies Cell;
  });
}

/** `0010 1100` — grouped, because unbroken binary is unreadable. */
export function bin8(value: number): string {
  const s = (value & 0xff).toString(2).padStart(8, "0");
  return `${s.slice(0, 4)} ${s.slice(4)}`;
}

export const hex = (n: number) => `0x${n.toString(16)}`;

/** Little-endian byte breakdown of a 32-bit value, as hex pairs. */
export function leBytes32(value: number): string[] {
  return [0, 8, 16, 24].map((shift) =>
    ((value >> shift) & 0xff).toString(16).padStart(2, "0"),
  );
}
