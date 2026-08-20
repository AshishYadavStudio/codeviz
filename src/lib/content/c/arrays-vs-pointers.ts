import type { Arrow, Cell, CellState, Frame, Lesson, Scene } from "@/lib/viz/types";
import { hex, stackRegion } from "@/lib/viz/scene-helpers";

const BASE = 0x1000;
const VALUES = [10, 20, 30, 40, 50];
const P_ADDR = "0x1020";

const CODE = `#include <stdio.h>

void show(int a[], size_t n) {
    printf("%zu\\n", sizeof a);   /* 8 — a is a pointer */
    printf("%d\\n", a[0]);
}

int main(void) {
    int  arr[5] = {10, 20, 30, 40, 50};
    int *p = arr;

    printf("%zu\\n", sizeof arr);  /* 20 */
    printf("%d %d\\n", arr[2], *(arr + 2));
    printf("%d\\n", 2[arr]);

    show(arr, 5);
    return 0;
}`;

function scene(opts: {
  highlight?: number;
  pState?: CellState;
  arrowTo?: number;
  arrowLabel?: string;
  showFrame?: boolean;
  callout?: Scene["callout"];
}): Scene {
  const cells: Cell[] = VALUES.map((value, i) => ({
    id: `arr${i}`,
    name: `arr[${i}]`,
    value: String(value),
    address: hex(BASE + i * 4),
    state: (opts.highlight === i ? "active" : "idle") as CellState,
    row: 0,
  }));

  cells.push({
    id: "p",
    name: "p",
    type: "int *",
    value: hex(BASE),
    address: P_ADDR,
    state: opts.pState ?? "idle",
    row: 1,
  });

  const frames: Frame[] = [
    {
      id: "main",
      label: "main()",
      state: opts.showFrame ? "idle" : "active",
      badge: "sizeof arr = 20 · sizeof p = 8",
      cells,
    },
  ];

  const arrows: Arrow[] = [];
  if (opts.arrowTo !== undefined) {
    arrows.push({
      id: "p-arrow",
      from: "p",
      to: `arr${opts.arrowTo}`,
      state: "idle",
      label: opts.arrowLabel,
    });
  }

  if (opts.showFrame) {
    frames.push({
      id: "show",
      label: "show(a, n)",
      state: "active",
      badge: "sizeof a = 8",
      note: "the array was not copied — only its first address was",
      cells: [
        {
          id: "a",
          name: "a",
          type: "int *",
          value: hex(BASE),
          address: "0x7ffd0c00",
          state: "active",
          row: 0,
        },
        {
          id: "n",
          name: "n",
          type: "size_t",
          value: "5",
          address: "0x7ffd0c08",
          state: "read",
          row: 0,
        },
      ],
    });
    arrows.push({ id: "a-arrow", from: "a", to: "arr0", state: "active", label: "a" });
  }

  return { regions: [stackRegion(frames)], arrows, callout: opts.callout };
}

export const arraysVsPointers: Lesson = {
  slug: "arrays-vs-pointers",
  track: "c",
  title: "Arrays vs pointers",
  tagline: "They behave alike in almost every expression — and then sizeof tells the truth.",
  description:
    "See why arr[i] is defined as *(arr + i), why sizeof arr is 20 but sizeof p is 8, and what actually gets passed when you hand an array to a function.",
  difficulty: 2,
  minutes: 9,
  access: "free",
  language: "c",
  keywords: ["array decay", "arr[i] equals *(arr+i)", "sizeof array", "passing arrays to functions"],
  intro: [
    "In most C code, an array and a pointer act the same way. `arr[i]` and `*(arr + i)` compile to the same instructions. This is convenient, and it is also the source of endless confusion.",
    "The difference sneaks in at exactly two moments: when you ask `sizeof`, and when you pass the array to a function. Miss either, and you get a bug that looks impossible but is actually the language telling you these are two different things.",
    "This lesson shows exactly when arrays behave like pointers, when they don't, and why `sizeof(arr)` gives one answer here and a different answer three lines later.",
  ],
  stages: [
    {
      id: "layout",
      title: "Two different things in memory",
      body: [
        "`arr` is 20 bytes of storage — five ints, back to back, starting at `0x1000`.",
        "`p` is 8 bytes of storage holding the number `0x1000`. The array *is* the data; the pointer merely refers to it.",
      ],
      code: CODE,
      activeLines: [9, 10],
      scene: scene({
        arrowTo: 0,
        arrowLabel: "p",
        callout: { tone: "info", text: "Six boxes on screen, but only one of them is the array." },
      }),
    },
    {
      id: "sizeof",
      title: "sizeof arr is 20. sizeof p is 8.",
      body: [
        "This is the sharpest difference between them. `sizeof arr` asks how big the array is: 5 × 4 = 20 bytes. `sizeof p` asks how big a pointer is: 8 bytes on a 64-bit machine, regardless of what it points at.",
        "There is no box anywhere holding `0x1000` on the array's behalf. The compiler knows where `arr` starts and substitutes that address directly.",
      ],
      code: CODE,
      activeLines: [12],
      scene: scene({
        arrowTo: 0,
        pState: "active",
        callout: {
          tone: "active",
          text: "An array name is not a variable holding an address. It is a label the compiler resolves to one.",
        },
      }),
    },
    {
      id: "indexing",
      title: "arr[2] is defined as *(arr + 2)",
      body: [
        "Indexing is not a separate feature in C. The standard defines `E1[E2]` as `*((E1) + (E2))` — the brackets are shorthand for pointer arithmetic.",
        "So `arr + 2` gives `0x1008`, and the `*` reads the 4 bytes there. Both expressions produce 30 because they are the same expression.",
      ],
      code: CODE,
      activeLines: [13],
      scene: scene({
        highlight: 2,
        arrowTo: 0,
        callout: { tone: "active", text: "arr + 2 → 0x1000 + 2 × 4 = 0x1008 → 30." },
      }),
    },
    {
      id: "commutative",
      title: "Which is why 2[arr] compiles",
      body: [
        "If `arr[2]` means `*(arr + 2)`, then `2[arr]` means `*(2 + arr)`. Addition commutes, so both are the same address and both print 30.",
        "Nobody should write this. It is worth knowing because it proves indexing really is arithmetic underneath — this is not a mnemonic, it is the definition.",
      ],
      code: CODE,
      activeLines: [14],
      scene: scene({
        highlight: 2,
        arrowTo: 0,
        callout: { tone: "info", text: "2[arr] == arr[2]. Strange-looking, entirely legal, same 4 bytes." },
      }),
    },
    {
      id: "decay",
      title: "Passing an array copies 8 bytes, not 20",
      body: [
        "`show(arr, 5)` does not copy the array. The array name decays to a pointer to its first element, and that address is what gets passed.",
        "Inside `show`, the parameter written as `int a[]` *is* an `int *`. C rewrites it — you cannot declare an array parameter even if you try.",
      ],
      code: CODE,
      activeLines: [16, 3],
      scene: scene({
        showFrame: true,
        arrowTo: 0,
        callout: {
          tone: "active",
          text: "Cheap, and lossy: the callee gets the address and nothing else.",
        },
      }),
    },
    {
      id: "lost-length",
      title: "Inside the function, the length is gone",
      body: [
        "`sizeof a` in `show` is 8 — the size of a pointer. The 20 is not recoverable, because the information never crossed the call boundary.",
        "That is why every array-taking function in C also takes a length. `strlen` gets away without one only because strings carry their own end marker.",
      ],
      code: CODE,
      activeLines: [4],
      scene: scene({
        showFrame: true,
        arrowTo: 0,
        callout: {
          tone: "danger",
          text: "sizeof a / sizeof a[0] inside a function is a classic bug: it computes 8 / 4 = 2, whatever the real length was.",
        },
      }),
    },
    {
      id: "recap",
      title: "When they differ",
      body: [
        "In almost every expression an array decays to a pointer and the two behave identically. The exceptions are worth memorising: `sizeof`, `&arr`, and a string literal used to initialise a `char[]`.",
        "Everywhere else, `arr[i]`, `*(arr + i)` and `p[i]` are interchangeable.",
        "Next: what the stack looks like when functions call each other.",
      ],
      code: CODE,
      activeLines: [12, 13],
      scene: scene({
        arrowTo: 0,
        arrowLabel: "p",
        callout: {
          tone: "success",
          text: "Same syntax, different objects. sizeof is the question that tells them apart.",
        },
      }),
    },
  ],
};
