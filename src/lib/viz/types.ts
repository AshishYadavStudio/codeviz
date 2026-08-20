/**
 * The scene model.
 *
 * Every visualization on CodeViz — C pointers today, JVM heaps and LINQ
 * pipelines later — is a sequence of `Scene` values rendered by one engine
 * (`<MemoryGrid />`). Topics are data, not bespoke components. If a new topic
 * needs a shape this file can't express, extend the model here rather than
 * hand-building a one-off visual.
 */

/** Visual state of a single cell. `active` is the only amber state. */
export type CellState =
  | "idle"
  | "active" // the live cell — amber, the reserved accent
  | "read" // being read this step
  | "written" // just mutated this step
  | "allocated" // freshly returned by malloc
  | "freed" // memory returned to the allocator; contents no longer valid
  | "padding" // compiler-inserted alignment gap
  | "garbage" // allocated but uninitialised
  | "success" // correct/valid result
  | "danger"; // out of bounds, dangling, undefined behaviour

export interface Cell {
  id: string;
  /** Variable or field name shown above the box. */
  name?: string;
  /** Rendered value. Keep it short — this is a box, not a table. */
  value?: string;
  /** Hex address label shown beneath the box. */
  address?: string;
  /** C type tag (`int`, `char *`) shown as a small chip. */
  type?: string;
  /** Width in bytes; drives relative cell width in `bytes` regions. */
  bytes?: number;
  state?: CellState;
  /** Short caption under the cell — use for "one past the end", etc. */
  note?: string;
  /**
   * Row within the frame, ascending. Put pointer variables on their own row so
   * their arrows travel through empty space instead of crossing other cells.
   */
  row?: number;
}

export type RegionKind =
  | "stack" // frames, grows downward, labelled
  | "heap" // allocation blocks
  | "static" // .rodata / string literals / globals
  | "blocks" // generic labelled groups — objects, pipeline stages, buckets
  | "bytes" // raw byte lane — struct layout, strings
  | "bits" // 8/16/32 bit lane — bitwise ops
  | "table" // rows and columns — dataframes, hash buckets, query results
  | "tree" // indented hierarchy — filesystem, inheritance chains
  | "nodes"; // positioned nodes joined by edges — BSTs, heaps, graphs, lists

export interface TableColumn {
  id: string;
  label: string;
  /** dtype, or any small caption under the header */
  note?: string;
  state?: CellState;
}

export interface TableRow {
  id: string;
  /** Row header — an index label, a key, a group name. */
  label?: string;
  state?: CellState;
  cells: Cell[];
  note?: string;
}

export interface TableSpec {
  columns: TableColumn[];
  rows: TableRow[];
  /** Rendered under the table, e.g. "3 of 8 rows kept". */
  footer?: string;
}

/**
 * A node in a positioned diagram. Placement is explicit rather than computed:
 * teaching diagrams need a stable, hand-tuned layout that does not jump between
 * steps, which an auto-layout would not guarantee.
 */
export interface GraphNode {
  id: string;
  label: string;
  /** Row, 0 at the top. */
  level: number;
  /** Horizontal position within the row. Fractional values are allowed. */
  slot: number;
  state?: CellState;
  /** Small caption under the node — an index, a distance, a pointer name. */
  note?: string;
  /** Renders as a rectangle instead of a circle. Use for list/array nodes. */
  shape?: "circle" | "box";
}

export interface TreeNode {
  id: string;
  label: string;
  /** Indent level, 0 at the root. */
  depth: number;
  kind?: "dir" | "file" | "link" | "device";
  state?: CellState;
  /** Right-aligned detail: permissions, size, inode. */
  meta?: string;
  note?: string;
}

export interface Frame {
  id: string;
  /** e.g. `main()`, `fact(3)` */
  label: string;
  state?: "idle" | "active" | "returning" | "popped";
  cells: Cell[];
  /** Right-aligned annotation on the frame header, e.g. `depth 3`. */
  badge?: string;
  note?: string;
}

export interface Region {
  id: string;
  kind: RegionKind;
  label: string;
  /** Fixed column count; omit to flow. */
  columns?: number;
  /** Grouped contents (stack/heap/blocks). */
  frames?: Frame[];
  /** Flat contents (bytes/bits/static). */
  cells?: Cell[];
  /** Contents for `table` regions. */
  table?: TableSpec;
  /** Contents for `tree` regions. */
  tree?: TreeNode[];
  /** Contents for `nodes` regions. Edges are ordinary arrows between node ids. */
  nodes?: GraphNode[];
  caption?: string;
}

/** A pointer drawn as a curve from one cell to another. */
export interface Arrow {
  id: string;
  /** Source cell id — the pointer variable. */
  from: string;
  /** Target cell id — what it points at. */
  to: string;
  label?: string;
  state?: "idle" | "active" | "danger";
  /** Dashed = invalid/dangling target. */
  dashed?: boolean;
}

export interface Callout {
  tone: "info" | "active" | "success" | "danger";
  text: string;
}

export interface Scene {
  regions: Region[];
  arrows?: Arrow[];
  /** One-line takeaway pinned under the canvas for this step. */
  callout?: Callout;
}

/** One step of a lesson: prose, code, and scene advance together. */
export interface Stage {
  id: string;
  title: string;
  /** Paragraphs. Inline `backticks` render as code. */
  body: string[];
  /** Code shown for this stage; usually constant across a lesson. */
  code?: string;
  /** 1-indexed lines to highlight as "currently executing" (amber). */
  activeLines?: number[];
  scene: Scene;
}

export type TrackId = "c" | "cpp" | "csharp" | "java" | "dsa" | "linux" | "data";

/** Languages the code pane can highlight. */
export type Language = "c" | "cpp" | "csharp" | "java" | "python" | "bash" | "sql";

export interface Lesson {
  slug: string;
  track: TrackId;
  title: string;
  /** Short hook shown on cards and under the page title. */
  tagline: string;
  /** Meta description. */
  description: string;
  difficulty: 1 | 2 | 3;
  minutes: number;
  /**
   * Monetization hook — the model supports gated content from day one so
   * practice sets can ship without a migration. Everything is `free` at launch.
   */
  access: "free" | "paid";
  /** Drives syntax highlighting and the code pane's filename. */
  language: Language;
  /** Filename shown on the code pane. Defaults from the language. */
  filename?: string;
  /** Search/SEO keywords. */
  keywords?: string[];
  stages: Stage[];
}

export interface Track {
  id: TrackId;
  title: string;
  /** Short label for nav and cards. */
  short: string;
  blurb: string;
  /** Tracks not yet built render as "coming soon" — no UI to build later. */
  status: "live" | "planned";
}
