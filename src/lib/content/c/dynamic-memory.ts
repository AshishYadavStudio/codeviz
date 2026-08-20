import type { Arrow, Cell, CellState, Frame, Lesson, Scene } from "@/lib/viz/types";
import { heapRegion, hex, stackRegion } from "@/lib/viz/scene-helpers";

const HEAP_BASE = 0x55a1c2e0;
const NUMS_ADDR = "0x7ffdb410";

const CODE = `#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int *nums = malloc(4 * sizeof(int));
    if (nums == NULL)
        return 1;

    nums[0] = 7;
    nums[1] = 9;

    free(nums);
    nums = NULL;
    return 0;
}`;

type BlockState = "none" | "garbage" | "live" | "freed";

function scene(opts: {
  numsValue: string;
  numsState?: CellState;
  block: BlockState;
  values?: (string | undefined)[];
  activeIndex?: number;
  arrow?: "none" | "idle" | "active" | "danger";
  dashed?: boolean;
  arrowLabel?: string;
  leaked?: boolean;
  callout?: Scene["callout"];
}): Scene {
  const stackCells: Cell[] = [
    {
      id: "nums",
      name: "nums",
      type: "int *",
      value: opts.numsValue,
      address: NUMS_ADDR,
      state: opts.numsState ?? "idle",
      row: 0,
    },
  ];

  const frames: Frame[] = [];
  const arrows: Arrow[] = [];

  if (opts.block !== "none") {
    const cellState = (i: number): CellState => {
      if (opts.block === "freed") return "freed";
      if (opts.activeIndex === i) return "active";
      if (opts.block === "garbage") return "garbage";
      return opts.values?.[i] ? "idle" : "garbage";
    };

    frames.push({
      id: "block",
      label: `block · 16 bytes`,
      state: opts.block === "freed" ? "popped" : opts.block === "garbage" ? "idle" : "active",
      badge: opts.block === "freed" ? "returned to the allocator" : `malloc(4 * sizeof(int))`,
      note: opts.leaked ? "still allocated, and nothing points at it any more" : undefined,
      cells: Array.from({ length: 4 }, (_, i) => ({
        id: `h${i}`,
        name: `nums[${i}]`,
        value: opts.block === "garbage" ? "?" : (opts.values?.[i] ?? "?"),
        address: hex(HEAP_BASE + i * 4),
        state: cellState(i),
        row: 0,
      })),
    });
  }

  if (opts.arrow && opts.arrow !== "none") {
    arrows.push({
      id: "nums-arrow",
      from: "nums",
      to: "h0",
      state: opts.arrow,
      dashed: opts.dashed,
      label: opts.arrowLabel,
    });
  }

  return {
    regions: [
      stackRegion([{ id: "main", label: "main()", state: "active", cells: stackCells }]),
      heapRegion(frames, "lives until you free it — not until the function returns"),
    ],
    arrows,
    callout: opts.callout,
  };
}

export const dynamicMemory: Lesson = {
  slug: "dynamic-memory",
  track: "c",
  title: "Dynamic memory: malloc & free",
  tagline: "The heap gives you memory that outlives the frame that asked for it — and never cleans up after you.",
  description:
    "Watch a heap block appear from malloc, get written, get freed, and leave behind a dangling pointer — plus what a leak looks like in the same diagram.",
  difficulty: 3,
  minutes: 11,
  access: "free",
  language: "c",
  keywords: ["malloc", "free", "heap", "dangling pointer", "memory leak", "use after free"],
  stages: [
    {
      id: "before",
      title: "Two regions, two lifetimes",
      body: [
        "Stack memory is tied to a frame: it appears on call and vanishes on return, automatically.",
        "Heap memory is tied to nothing. It appears when you ask, and stays until you say otherwise — even after the function that created it has returned. That is the whole reason to use it.",
      ],
      code: CODE,
      activeLines: [4],
      scene: scene({
        numsValue: "?",
        numsState: "garbage",
        block: "none",
        callout: { tone: "info", text: "`nums` lives on the stack. What it will point to will not." },
      }),
    },
    {
      id: "malloc",
      title: "malloc(16) returns an address",
      body: [
        "`4 * sizeof(int)` is 16, so this asks for 16 bytes. `malloc` finds a suitable region and returns its starting address, which gets stored in `nums`.",
        "The bytes are **not** zeroed. Whatever was in that memory before is still there — reading `nums[0]` now gives you a leftover, not a 0. Use `calloc` if you want zeros.",
      ],
      code: CODE,
      activeLines: [5],
      scene: scene({
        numsValue: hex(HEAP_BASE),
        numsState: "active",
        block: "garbage",
        arrow: "active",
        arrowLabel: "nums",
        callout: {
          tone: "active",
          text: "16 bytes reserved at 0x55a1c2e0. Note how far this address is from the stack ones.",
        },
      }),
    },
    {
      id: "null-check",
      title: "malloc can fail, and says so quietly",
      body: [
        "If the allocation cannot be satisfied, `malloc` returns `NULL` rather than crashing. If you skip this check, the crash happens later, on the first dereference, far from the actual cause.",
        "This is two lines of code that turn a confusing bug into an obvious one.",
      ],
      code: CODE,
      activeLines: [6, 7],
      scene: scene({
        numsValue: hex(HEAP_BASE),
        numsState: "read",
        block: "garbage",
        arrow: "idle",
        callout: { tone: "info", text: "nums != NULL, so the allocation succeeded and it is safe to continue." },
      }),
    },
    {
      id: "write-0",
      title: "nums[0] = 7 writes into the heap",
      body: [
        "`nums[0]` is `*(nums + 0)` — the same indexing rule as any array. The pointer is on the stack; the 4 bytes being written are on the heap.",
        "A heap block indexes exactly like an array because it is exactly like an array: contiguous bytes with a known element size.",
      ],
      code: CODE,
      activeLines: [9],
      scene: scene({
        numsValue: hex(HEAP_BASE),
        numsState: "read",
        block: "live",
        values: ["7", undefined, undefined, undefined],
        activeIndex: 0,
        arrow: "active",
        callout: { tone: "active", text: "Written at 0x55a1c2e0. The other 12 bytes are still uninitialised." },
      }),
    },
    {
      id: "write-1",
      title: "nums[1] = 9",
      body: [
        "One element along is 4 bytes along, exactly as on the stack. The heap has no special addressing rules.",
        "The last two elements were never written. Reading them is undefined behaviour, and the values you would see are whatever the allocator's previous tenant left behind.",
      ],
      code: CODE,
      activeLines: [10],
      scene: scene({
        numsValue: hex(HEAP_BASE),
        numsState: "read",
        block: "live",
        values: ["7", "9", undefined, undefined],
        activeIndex: 1,
        arrow: "active",
        callout: { tone: "active", text: "0x55a1c2e4 = 9. Two written, two still holding junk." },
      }),
    },
    {
      id: "free",
      title: "free(nums) — and nums does not change",
      body: [
        "`free` hands the block back to the allocator. The block is no longer yours, and its contents are no longer meaningful.",
        "Look at `nums`: it still holds `0x55a1c2e0`. `free` takes the address by value, so it cannot possibly modify your pointer. You now have a pointer that looks perfectly valid and is not.",
      ],
      code: CODE,
      activeLines: [12],
      scene: scene({
        numsValue: hex(HEAP_BASE),
        numsState: "danger",
        block: "freed",
        values: ["7", "9", undefined, undefined],
        arrow: "danger",
        dashed: true,
        arrowLabel: "dangling",
        callout: {
          tone: "danger",
          text: "This is a dangling pointer. Nothing about nums changed — what changed is who owns the memory.",
        },
      }),
    },
    {
      id: "use-after-free",
      title: "Reading it now is use-after-free",
      body: [
        "`nums[0]` might still return 7. It might return garbage. It might return something a completely different part of the program just wrote there, because the allocator has handed the block to someone else.",
        "It probably will not crash, and that is what makes this class of bug so expensive: the damage appears somewhere unrelated, much later.",
      ],
      code: CODE,
      activeLines: [12],
      scene: scene({
        numsValue: hex(HEAP_BASE),
        numsState: "danger",
        block: "freed",
        values: ["7", "9", undefined, undefined],
        arrow: "danger",
        dashed: true,
        arrowLabel: "undefined behaviour",
        callout: {
          tone: "danger",
          text: "Calling free(nums) a second time is equally undefined — and a well-known way to get exploited.",
        },
      }),
    },
    {
      id: "null-it",
      title: "nums = NULL closes the hole",
      body: [
        "One assignment turns a silent, delayed, hard-to-reproduce bug into an immediate crash at the exact line that misuses the pointer.",
        "`free(NULL)` is explicitly defined to do nothing, so this also makes double-free harmless.",
      ],
      code: CODE,
      activeLines: [13],
      scene: scene({
        numsValue: "NULL",
        numsState: "success",
        block: "none",
        callout: {
          tone: "success",
          text: "free it, then null it. The pair is a habit worth having, not a style preference.",
        },
      }),
    },
    {
      id: "leak",
      title: "The other failure: losing the address",
      body: [
        "Suppose that instead of freeing, you had assigned a new address to `nums`. The block would still be allocated, and the only pointer to it would be gone.",
        "That memory cannot be freed by anyone, ever, for the life of the process. It is not a crash — the program keeps working, using slightly more memory every time this happens.",
      ],
      code: CODE,
      activeLines: [5],
      scene: scene({
        numsValue: "0x55a1c400",
        numsState: "read",
        block: "live",
        values: ["7", "9", undefined, undefined],
        leaked: true,
        callout: {
          tone: "danger",
          text: "A leak is an allocation with no surviving pointer. Every malloc needs exactly one matching free.",
        },
      }),
    },
  ],
};
