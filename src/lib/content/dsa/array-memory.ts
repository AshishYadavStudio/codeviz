import type { CellState, Lesson, Scene } from "@/lib/viz/types";
import { blocksRegion } from "@/lib/viz/scene-helpers";

const CODE = `int arr[5] = {10, 20, 30, 40, 50};

// Indexing: base + i * sizeof(int)
arr[0];   // base + 0 = 0x100  → 10
arr[3];   // base + 12 = 0x10c → 40

// Inserting at index 1: shift everything right
// [10, 20, 30, 40, 50]
// [10, 15, 20, 30, 40, 50]  ← 4 elements moved

// Appending at the end: no shift
// [10, 20, 30, 40, 50, 60]  ← 0 elements moved

// Deleting at index 0: shift everything left
// [20, 30, 40, 50]          ← 4 elements moved`;

function scene(opts: {
  cells: { id: string; index: string; value: string; address: string; state?: CellState; note?: string }[];
  caption?: string;
  label?: string;
  callout?: Scene["callout"];
}): Scene {
  return {
    regions: [
      blocksRegion("arr", opts.label ?? "int arr[5]", [{
        id: "array",
        label: opts.label ?? "contiguous block",
        cells: opts.cells.map((c) => ({
          id: c.id,
          name: `[${c.index}]`,
          value: c.value,
          address: c.address,
          state: c.state ?? "idle",
          note: c.note,
        })),
      }], opts.caption ?? "one block, elements packed side by side"),
    ],
    callout: opts.callout,
  };
}

export const arrayMemory: Lesson = {
  slug: "array-memory",
  track: "dsa",
  title: "Arrays in memory",
  tagline: "One block, constant-time indexing, and O(n) insertion in the middle.",
  description:
    "See that an array is a single contiguous block where the address of any element is base + index × size, making random access O(1), but insertion and deletion O(n) because elements must shift.",
  difficulty: 1,
  minutes: 8,
  access: "free",
  language: "c",
  keywords: ["array", "contiguous memory", "indexing", "O(1) access", "O(n) insertion"],
  intro: [
    "An **array** is the simplest data structure there is: a block of memory with values packed side by side. That's it. Every other data structure gets compared to this one.",
    "The magic of arrays is that they give you constant-time access to any element — `arr[5000]` and `arr[0]` take the same time — because the CPU can compute the exact address from the index. The cost is that inserting a value in the middle means shifting every element after it, which is slow.",
    "This lesson visualises the block of memory, watches the address arithmetic for indexing, and shows why inserting is O(n) but appending is O(1).",
  ],
  stages: [
    {
      id: "layout",
      title: "One contiguous block",
      body: [
        "An array of 5 ints occupies 20 consecutive bytes: each int is 4 bytes, and they are packed side by side with no gaps.",
        "That contiguity is the single fact that explains everything else — why indexing is fast, why insertion is slow, and why cache performance is good.",
      ],
      code: CODE,
      activeLines: [1],
      scene: scene({
        cells: [
          { id: "a0", index: "0", value: "10", address: "0x100" },
          { id: "a1", index: "1", value: "20", address: "0x104" },
          { id: "a2", index: "2", value: "30", address: "0x108" },
          { id: "a3", index: "3", value: "40", address: "0x10c" },
          { id: "a4", index: "4", value: "50", address: "0x110" },
        ],
        callout: { tone: "info", text: "5 ints × 4 bytes = 20 bytes. Addresses increment by 4." },
      }),
    },
    {
      id: "index0",
      title: "arr[0]: just the base address",
      body: [
        "The array starts at address 0x100. `arr[0]` is `base + 0 × 4 = 0x100`. One addition, one memory read — O(1).",
        "This arithmetic is why arrays are zero-indexed. The first element is zero steps from the base.",
      ],
      code: CODE,
      activeLines: [4],
      scene: scene({
        cells: [
          { id: "a0b", index: "0", value: "10", address: "0x100", state: "active", note: "base + 0" },
          { id: "a1b", index: "1", value: "20", address: "0x104" },
          { id: "a2b", index: "2", value: "30", address: "0x108" },
          { id: "a3b", index: "3", value: "40", address: "0x10c" },
          { id: "a4b", index: "4", value: "50", address: "0x110" },
        ],
        callout: { tone: "active", text: "arr[0] = base + 0 × sizeof(int) = 0x100. O(1)." },
      }),
    },
    {
      id: "index3",
      title: "arr[3]: base + 12",
      body: [
        "`arr[3]` is `base + 3 × 4 = 0x100 + 12 = 0x10c`. The CPU does not scan from the start — it jumps directly to the address.",
        "This is what makes arrays O(1) for random access. Any element, anywhere in the array, costs the same.",
      ],
      code: CODE,
      activeLines: [5],
      scene: scene({
        cells: [
          { id: "a0c", index: "0", value: "10", address: "0x100" },
          { id: "a1c", index: "1", value: "20", address: "0x104" },
          { id: "a2c", index: "2", value: "30", address: "0x108" },
          { id: "a3c", index: "3", value: "40", address: "0x10c", state: "active", note: "base + 3×4 = 0x10c" },
          { id: "a4c", index: "4", value: "50", address: "0x110" },
        ],
        callout: { tone: "active", text: "arr[3] = 0x10c. One multiplication, one addition. Same cost as arr[0]." },
      }),
    },
    {
      id: "insert",
      title: "Insert at index 1: O(n) shifts",
      body: [
        "To insert 15 at index 1, every element from index 1 onward must shift right by one position. That is 4 moves for an array of 5.",
        "In general, inserting at position i moves n − i elements. Inserting at the front is O(n); inserting at the end is O(1).",
      ],
      code: CODE,
      activeLines: [8, 9],
      scene: scene({
        cells: [
          { id: "i0", index: "0", value: "10", address: "0x100" },
          { id: "i1", index: "1", value: "15", address: "0x104", state: "active", note: "inserted" },
          { id: "i2", index: "2", value: "20", address: "0x108", state: "read", note: "shifted →" },
          { id: "i3", index: "3", value: "30", address: "0x10c", state: "read", note: "shifted →" },
          { id: "i4", index: "4", value: "40", address: "0x110", state: "read", note: "shifted →" },
          { id: "i5", index: "5", value: "50", address: "0x114", state: "read", note: "shifted →" },
        ],
        label: "After insert(1, 15)",
        caption: "4 elements had to move",
        callout: { tone: "danger", text: "Insert at the middle: O(n). Every element after the slot shifts." },
      }),
    },
    {
      id: "append",
      title: "Append: O(1) — nothing shifts",
      body: [
        "Adding 60 at the end writes to the next address. No other element moves. This is O(1) — and it is why dynamic arrays (ArrayList, vector) append rather than insert.",
        "The catch: the array must have capacity. If it is full, a resize copies everything — but amortised over many appends, the cost is still O(1) per element.",
      ],
      code: CODE,
      activeLines: [12],
      scene: scene({
        cells: [
          { id: "p0", index: "0", value: "10", address: "0x100" },
          { id: "p1", index: "1", value: "20", address: "0x104" },
          { id: "p2", index: "2", value: "30", address: "0x108" },
          { id: "p3", index: "3", value: "40", address: "0x10c" },
          { id: "p4", index: "4", value: "50", address: "0x110" },
          { id: "p5", index: "5", value: "60", address: "0x114", state: "success", note: "no shift" },
        ],
        label: "After append(60)",
        caption: "0 elements moved",
        callout: { tone: "success", text: "Append is O(1). No shifting. This is the cheap end." },
      }),
    },
    {
      id: "recap",
      title: "The tradeoff",
      body: [
        "Arrays give O(1) random access because elements are contiguous and addresses are computed. But maintaining that contiguity costs O(n) for insertions and deletions in the middle.",
        "Linked lists trade in the opposite direction: O(1) insertion at a known position, O(n) access. The right choice depends on whether you access or modify more often.",
      ],
      code: CODE,
      activeLines: [4, 5, 9],
      scene: scene({
        cells: [
          { id: "r0", index: "0", value: "10", address: "0x100", state: "success", note: "O(1) read" },
          { id: "r1", index: "1", value: "20", address: "0x104", state: "success" },
          { id: "r2", index: "2", value: "30", address: "0x108", state: "success" },
          { id: "r3", index: "3", value: "40", address: "0x10c", state: "success", note: "O(1) read" },
          { id: "r4", index: "4", value: "50", address: "0x110", state: "success" },
        ],
        callout: {
          tone: "success",
          text: "Read: O(1). Append: O(1). Insert/delete in the middle: O(n). That is the deal.",
        },
      }),
    },
  ],
};
