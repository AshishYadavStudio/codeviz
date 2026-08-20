import type { Arrow, Cell, CellState, Lesson, Scene } from "@/lib/viz/types";
import { heapRegion, hex, stackRegion } from "@/lib/viz/scene-helpers";

const CODE = `#include <vector>
#include <cstdio>

int main() {
    std::vector<int> v;

    for (int i = 1; i <= 5; ++i) {
        v.push_back(i);
        printf("size %zu  cap %zu\\n", v.size(), v.capacity());
    }

    int *danger = &v[0];   // valid...
    v.push_back(6);        // ...until this reallocates
    // *danger is now dangling

    v.reserve(16);         // one allocation, no surprises
    return 0;
}`;

interface Snapshot {
  size: number;
  capacity: number;
  base: number;
  /** Previous buffer, still shown as freed after a reallocation. */
  oldBase?: number;
  oldCapacity?: number;
  activeIndex?: number;
  dangling?: boolean;
  callout?: Scene["callout"];
}

function scene(s: Snapshot): Scene {
  const stackCells: Cell[] = [
    {
      id: "v",
      name: "v",
      type: "vector<int>",
      value: hex(s.base),
      address: "0x7ffd3300",
      state: "read",
      row: 0,
    },
    {
      id: "meta",
      name: "size / cap",
      value: `${s.size} / ${s.capacity}`,
      state: s.activeIndex !== undefined ? "active" : "idle",
      row: 0,
    },
  ];

  if (s.dangling !== undefined) {
    stackCells.push({
      id: "danger",
      name: "danger",
      type: "int *",
      value: hex(s.oldBase ?? s.base),
      address: "0x7ffd3310",
      state: s.dangling ? "danger" : "read",
      row: 1,
    });
  }

  // Wide buffers are truncated: past 8 slots the shape is the point, not the
  // individual boxes.
  const MAX_SLOTS = 8;

  const buffer = (
    id: string,
    base: number,
    capacity: number,
    used: number,
    freed: boolean,
  ) => {
    const shown = Math.min(capacity, MAX_SLOTS);
    const cells: Cell[] = Array.from({ length: shown }, (_, i) => {
      const state: CellState = freed
        ? "freed"
        : i >= used
          ? "garbage"
          : s.activeIndex === i
            ? "active"
            : "idle";
      return {
        id: `${id}-${i}`,
        name: i < used ? `[${i}]` : undefined,
        value: i < used ? String(i + 1) : "",
        address: hex(base + i * 4),
        state,
        row: 0,
      };
    });

    if (capacity > shown) {
      cells.push({
        id: `${id}-rest`,
        name: `[${shown}…${capacity - 1}]`,
        value: `+${capacity - shown}`,
        state: "garbage",
        note: "unused capacity",
        row: 0,
      });
    }

    return {
      id,
      label: `buffer · ${capacity * 4} bytes`,
      state: (freed ? "popped" : "active") as "popped" | "active",
      badge: freed ? "freed after copy" : `capacity ${capacity}`,
      cells,
    };
  };

  const frames = [buffer("buf", s.base, s.capacity, s.size, false)];
  if (s.oldBase !== undefined && s.oldCapacity !== undefined) {
    frames.unshift(buffer("old", s.oldBase, s.oldCapacity, s.oldCapacity, true));
  }

  const arrows: Arrow[] = [{ id: "v-buf", from: "v", to: "buf-0", state: "active", label: "data()" }];
  if (s.dangling !== undefined) {
    arrows.push({
      id: "danger-arrow",
      from: "danger",
      to: s.dangling ? "old-0" : "buf-0",
      state: s.dangling ? "danger" : "idle",
      dashed: s.dangling,
      label: s.dangling ? "dangling" : undefined,
    });
  }

  return {
    regions: [
      stackRegion([{ id: "main", label: "main()", state: "active", cells: stackCells }]),
      heapRegion(frames, "the elements never live in the vector object itself"),
    ],
    arrows,
    callout: s.callout,
  };
}

const A = 0x600100;
const B = 0x600200;
const C = 0x600400;

export const vectorGrowth: Lesson = {
  slug: "vector-growth",
  track: "cpp",
  title: "How std::vector grows",
  tagline: "Contiguous, dynamic, and occasionally it moves everything you own.",
  description:
    "Watch capacity double, elements get copied to a fresh buffer, and every existing pointer and iterator go stale — then see why reserve() exists.",
  difficulty: 2,
  minutes: 10,
  access: "free",
  language: "cpp",
  keywords: ["std::vector", "capacity", "reallocation", "iterator invalidation", "reserve"],
  stages: [
    {
      id: "empty",
      title: "An empty vector owns nothing",
      body: [
        "`std::vector<int> v;` creates a small object on the stack — typically three pointers — with size 0 and capacity 0. No heap allocation has happened yet.",
        "The elements will never live inside `v`. `v` only ever holds the address of a buffer, plus how much of it is used.",
      ],
      code: CODE,
      activeLines: [5],
      scene: scene({
        size: 0,
        capacity: 1,
        base: A,
        callout: { tone: "info", text: "size = how many elements exist. capacity = how many fit before the buffer must be replaced." },
      }),
    },
    {
      id: "first",
      title: "push_back(1) allocates",
      body: [
        "The first insertion has nowhere to put anything, so the vector asks the heap for a buffer and copies the new element in.",
        "The exact starting capacity is implementation-defined — 1 here — but the growth *policy* that follows is what matters.",
      ],
      code: CODE,
      activeLines: [8],
      scene: scene({
        size: 1,
        capacity: 1,
        base: A,
        activeIndex: 0,
        callout: { tone: "active", text: "size 1, capacity 1 — completely full already." },
      }),
    },
    {
      id: "realloc",
      title: "push_back(2) cannot fit — so everything moves",
      body: [
        "There is no room, so the vector allocates a **new, larger** buffer, copies or moves every existing element across, frees the old one, and only then appends.",
        "This is the expensive case. It is O(n), and it happens at unpredictable moments from the caller's point of view.",
      ],
      code: CODE,
      activeLines: [8],
      scene: scene({
        size: 2,
        capacity: 2,
        base: B,
        oldBase: A,
        oldCapacity: 1,
        activeIndex: 1,
        callout: {
          tone: "active",
          text: "New address, new buffer. The old one is gone — and so is anything that pointed into it.",
        },
      }),
    },
    {
      id: "doubling",
      title: "Capacity doubles, so reallocation gets rare",
      body: [
        "Growth is multiplicative, not additive: 1, 2, 4, 8, 16… Adding n elements triggers about log₂(n) reallocations and copies roughly 2n elements in total.",
        "That is what makes `push_back` *amortised* O(1): individual calls are occasionally expensive, but the average over many calls is constant.",
      ],
      code: CODE,
      activeLines: [7, 8, 9],
      scene: scene({
        size: 5,
        capacity: 8,
        base: C,
        activeIndex: 4,
        callout: {
          tone: "info",
          text: "5 elements, capacity 8 — three slots of unused, uninitialised memory the vector already owns.",
        },
      }),
    },
    {
      id: "valid-pointer",
      title: "A pointer into the buffer is fine — for now",
      body: [
        "`int *danger = &v[0]` takes the address of the first element. Right now that is a perfectly ordinary, valid pointer into the heap buffer.",
        "Nothing about the code so far is wrong. The bug is in the future.",
      ],
      code: CODE,
      activeLines: [13],
      scene: scene({
        size: 5,
        capacity: 8,
        base: C,
        dangling: false,
        callout: { tone: "info", text: "Two things now point into the same buffer: the vector, and you." },
      }),
    },
    {
      id: "invalidated",
      title: "One push_back too many",
      body: [
        "Once size reaches capacity, the next `push_back` reallocates — and `danger` still holds the *old* address. The vector updated its own pointer; it has no way to update yours.",
        "Every iterator, reference and pointer into a vector is invalidated by any operation that can reallocate: `push_back`, `insert`, `resize`, `reserve`.",
      ],
      code: CODE,
      activeLines: [14, 15],
      scene: scene({
        size: 9,
        capacity: 16,
        base: 0x600800,
        oldBase: C,
        oldCapacity: 8,
        dangling: true,
        callout: {
          tone: "danger",
          text: "Use-after-free, with no crash and no warning. This is the single most common std::vector bug.",
        },
      }),
    },
    {
      id: "reserve",
      title: "reserve() buys the room up front",
      body: [
        "If you know roughly how many elements are coming, `v.reserve(16)` allocates once. No doubling, no intermediate copies, and no reallocation while you are holding references.",
        "It changes capacity only — size stays where it was, and no elements are constructed.",
      ],
      code: CODE,
      activeLines: [17],
      scene: scene({
        size: 5,
        capacity: 16,
        base: 0x600800,
        callout: {
          tone: "success",
          text: "reserve when the size is predictable; otherwise let doubling do its job and never hold a raw pointer across a mutation.",
        },
      }),
    },
  ],
};
