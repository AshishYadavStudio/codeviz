import type { Arrow, Cell, CellState, Lesson, Scene } from "@/lib/viz/types";
import { heapRegion, stackRegion } from "@/lib/viz/scene-helpers";

const CODE = `import java.util.ArrayList;
import java.util.LinkedList;

public class Main {
    public static void main(String[] args) {
        ArrayList<String> list = new ArrayList<>();

        list.add("a");     // lazily allocates capacity 10
        list.add("b");
        list.add("c");

        list.get(1);       // O(1): one index calculation
        list.add(0, "z");  // O(n): shifts everything right
        list.remove(0);    // O(n): shifts everything left

        ArrayList<String> sized = new ArrayList<>(1000);
    }
}`;

function scene(opts: {
  capacity: number;
  values: (string | null)[];
  activeIndex?: number;
  shifting?: number[];
  oldCapacity?: number;
  callout?: Scene["callout"];
}): Scene {
  const MAX = 10;
  const shown = Math.min(opts.capacity, MAX);

  const cells: Cell[] = Array.from({ length: shown }, (_, i) => {
    const value = opts.values[i] ?? null;
    let state: CellState = "idle";
    if (value === null) state = "garbage";
    if (opts.shifting?.includes(i)) state = "written";
    if (opts.activeIndex === i) state = "active";

    return {
      id: `slot-${i}`,
      name: `[${i}]`,
      value: value === null ? "null" : `"${value}"`,
      state,
      row: 0,
    };
  });

  if (opts.capacity > shown) {
    cells.push({
      id: "slot-rest",
      name: `[${shown}…${opts.capacity - 1}]`,
      value: `+${opts.capacity - shown}`,
      state: "garbage",
      note: "spare capacity",
      row: 0,
    });
  }

  const size = opts.values.filter((v) => v !== null).length;

  const stackCells: Cell[] = [
    {
      id: "list",
      name: "list",
      type: "ArrayList",
      value: "→ elementData",
      state: "read",
      row: 0,
    },
    { id: "size", name: "size", type: "int", value: String(size), state: "read", row: 0 },
  ];

  const arrows: Arrow[] = [
    { id: "list-arrow", from: "list", to: "slot-0", state: "idle", label: "elementData" },
  ];

  return {
    regions: [
      stackRegion([{ id: "main", label: "main()", state: "active", cells: stackCells }]),
      heapRegion(
        [
          {
            id: "backing",
            label: "Object[] elementData",
            state: "active",
            badge: `size ${size} · capacity ${opts.capacity}`,
            cells,
          },
        ],
        "an ArrayList is an array plus a size counter",
      ),
    ],
    arrows,
    callout: opts.callout,
  };
}

export const arrayListGrowth: Lesson = {
  slug: "arraylist-growth",
  track: "java",
  title: "ArrayList vs LinkedList",
  tagline: "One is an array that occasionally moves. The other is a chain of boxes scattered across the heap.",
  description:
    "Watch an ArrayList allocate, grow by half, and shift elements on insert — then see why LinkedList's O(1) insert is usually slower in practice than the O(n) one.",
  difficulty: 2,
  minutes: 10,
  access: "free",
  language: "java",
  keywords: ["ArrayList", "LinkedList", "capacity", "amortised", "big o", "java collections"],
  stages: [
    {
      id: "empty",
      title: "An ArrayList is an array and a counter",
      body: [
        "`new ArrayList<>()` does not allocate storage yet. It holds a shared empty array and waits until you actually add something.",
        "The two things it tracks are the backing array and `size` — how many slots are in use. Capacity and size are different numbers, and confusing them is the source of most surprises here.",
      ],
      code: CODE,
      activeLines: [6],
      scene: scene({
        capacity: 10,
        values: [],
        callout: { tone: "info", text: "size 0, capacity 10 once the first add triggers allocation." },
      }),
    },
    {
      id: "add",
      title: "add() writes at index size, then increments",
      body: [
        "Appending is the cheap operation: write into the next free slot and bump the counter. No searching, no shifting.",
        "That is genuinely O(1) — as long as there is spare capacity.",
      ],
      code: CODE,
      activeLines: [8, 9, 10],
      scene: scene({
        capacity: 10,
        values: ["a", "b", "c"],
        activeIndex: 2,
        callout: { tone: "active", text: "Three elements, seven unused slots the list already owns." },
      }),
    },
    {
      id: "get",
      title: "get(1) is arithmetic, not a search",
      body: [
        "The element's address is `base + index × elementSize`. One multiply, one add, one memory read — regardless of how large the list is.",
        "This is the property that makes `ArrayList` the right default: random access is free, and the elements sit contiguously in memory, which the CPU cache rewards heavily.",
      ],
      code: CODE,
      activeLines: [12],
      scene: scene({
        capacity: 10,
        values: ["a", "b", "c"],
        activeIndex: 1,
        callout: { tone: "active", text: "O(1) and cache-friendly. Neighbouring elements arrive in the same cache line." },
      }),
    },
    {
      id: "insert",
      title: "add(0, \"z\") has to move everything",
      body: [
        "Inserting at the front means every existing element must slide one slot to the right before the new value can be written.",
        "That is O(n), and it is a real memory copy. Inserting at the *end* stays cheap; inserting at the front of a large list does not.",
      ],
      code: CODE,
      activeLines: [13],
      scene: scene({
        capacity: 10,
        values: ["z", "a", "b", "c"],
        activeIndex: 0,
        shifting: [1, 2, 3],
        callout: {
          tone: "danger",
          text: "Three elements moved to insert one. At 10,000 elements this is 10,000 moves.",
        },
      }),
    },
    {
      id: "remove",
      title: "remove(0) shifts back the other way",
      body: [
        "Removal leaves a hole, and an array cannot have holes, so everything after the removed index slides left.",
        "The last slot is explicitly set to null so the garbage collector can reclaim the object — the array is still capacity-sized, only `size` shrank.",
      ],
      code: CODE,
      activeLines: [14],
      scene: scene({
        capacity: 10,
        values: ["a", "b", "c"],
        shifting: [0, 1, 2],
        callout: { tone: "active", text: "Capacity never shrinks on its own. A list that was once huge keeps its array." },
      }),
    },
    {
      id: "grow",
      title: "Past capacity, the array is replaced",
      body: [
        "When `size` reaches capacity, `ArrayList` allocates a new array — roughly 1.5× the old one — copies every element across, and drops the old array.",
        "Because growth is multiplicative, the copies amortise out: adding n elements is O(n) overall, even though individual `add` calls occasionally cost O(n).",
      ],
      code: CODE,
      activeLines: [8],
      scene: scene({
        capacity: 15,
        values: ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k"],
        activeIndex: 10,
        callout: {
          tone: "info",
          text: "10 → 15 → 22 → 33… Java grows by half, where C++'s vector typically doubles.",
        },
      }),
    },
    {
      id: "presize",
      title: "Give it a size if you know one",
      body: [
        "`new ArrayList<>(1000)` allocates once instead of growing through roughly a dozen intermediate arrays and copying thousands of references.",
        "Note that this sets *capacity*, not size — the list is still empty, and `get(0)` still throws.",
      ],
      code: CODE,
      activeLines: [16],
      scene: scene({
        capacity: 1000,
        values: [],
        callout: { tone: "success", text: "size 0, capacity 1000. One allocation instead of many." },
      }),
    },
    {
      id: "linked",
      title: "LinkedList trades layout for insertion",
      body: [
        "A `LinkedList` allocates a separate node object per element, each holding the value plus a previous and next reference. Inserting in the middle is O(1) *once you are already there* — just rewire two references, no shifting.",
        "But getting there is O(n), every node is a separate heap object with its own header, and they are scattered rather than contiguous, so traversal misses the cache constantly.",
        "In practice `ArrayList` wins almost every real benchmark, including inserts. Reach for `ArrayDeque` if you need cheap operations at both ends.",
      ],
      code: CODE,
      activeLines: [2, 16],
      scene: {
        regions: [
          heapRegion(
            [
              {
                id: "n1",
                label: "Node",
                state: "active",
                badge: "prev · value · next",
                cells: [
                  { id: "n1-v", name: "value", value: '"a"', state: "idle", row: 0 },
                  { id: "n1-next", name: "next", value: "→ Node", state: "read", row: 0 },
                ],
              },
              {
                id: "n2",
                label: "Node",
                state: "active",
                badge: "somewhere else entirely",
                cells: [
                  { id: "n2-v", name: "value", value: '"b"', state: "idle", row: 0 },
                  { id: "n2-next", name: "next", value: "null", state: "garbage", row: 0 },
                ],
              },
            ],
            "one object per element, plus two references each",
          ),
        ],
        arrows: [{ id: "chain", from: "n1-next", to: "n2-v", state: "active", label: "next" }],
        callout: {
          tone: "success",
          text: "Default to ArrayList. Choose LinkedList only with a measurement in hand, not from the Big-O table.",
        },
      },
    },
  ],
};
