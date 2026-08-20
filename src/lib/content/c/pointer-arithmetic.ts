import type { Cell, CellState, Lesson, Scene } from "@/lib/viz/types";
import { byteRegion, hex, stackRegion } from "@/lib/viz/scene-helpers";

const BASE = 0x1000;
const VALUES = [10, 20, 30, 40, 50];
const P_ADDR = "0x1020";
const C_ADDR = "0x1028";

const CODE = `#include <stdio.h>

int main(void) {
    int  arr[5] = {10, 20, 30, 40, 50};
    int *p = arr;

    p++;
    p += 2;

    printf("%td\\n", p - arr);

    char *c = (char *)arr;
    c++;

    p = &arr[5];
    return 0;
}`;

interface Opts {
  /** Element index p refers to; 5 means one past the end. */
  at: number;
  pState?: CellState;
  arrowState?: "idle" | "active" | "danger";
  arrowLabel?: string;
  dashed?: boolean;
  /** Show the byte-level view of arr[0] with a char pointer. */
  charAt?: number;
  callout?: Scene["callout"];
  activeCell?: number;
}

function scene(opts: Opts): Scene {
  const cells: Cell[] = VALUES.map((value, i) => ({
    id: `arr${i}`,
    name: `arr[${i}]`,
    value: String(value),
    address: hex(BASE + i * 4),
    state:
      opts.activeCell === i ? "active" : opts.at === i && opts.charAt === undefined ? "read" : "idle",
    row: 0,
  }));

  // One past the end: a real, computable address that owns no object.
  if (opts.at === 5) {
    cells.push({
      id: "arr5",
      name: "—",
      value: "",
      address: hex(BASE + 20),
      state: "danger",
      note: "one past the end",
      row: 0,
    });
  }

  cells.push({
    id: "p",
    name: "p",
    type: "int *",
    value: hex(BASE + opts.at * 4),
    address: P_ADDR,
    state: opts.pState ?? "read",
    row: 1,
  });

  if (opts.charAt !== undefined) {
    cells.push({
      id: "c",
      name: "c",
      type: "char *",
      value: hex(BASE + opts.charAt),
      address: C_ADDR,
      state: "active",
      row: 1,
    });
  }

  const regions = [
    stackRegion([{ id: "main", label: "main()", state: "active", cells }]),
  ];

  if (opts.charAt !== undefined) {
    // arr[0] = 10 stored little-endian: 0a 00 00 00
    regions.push(
      byteRegion(
        "bytes",
        "arr[0], byte by byte",
        [
          {
            id: "lane",
            label: "",
            cells: ["0a", "00", "00", "00"].map((byte, i) => ({
              id: `b${i}`,
              value: byte,
              address: hex(BASE + i),
              state: (i === opts.charAt ? "active" : "idle") as CellState,
            })),
          },
        ],
        "little-endian: least significant byte first",
      ),
    );
  }

  return {
    regions,
    arrows: [
      {
        id: "p-arrow",
        from: "p",
        to: opts.at === 5 ? "arr5" : `arr${opts.at}`,
        state: opts.arrowState ?? "active",
        label: opts.arrowLabel,
        dashed: opts.dashed,
      },
      ...(opts.charAt !== undefined
        ? ([{ id: "c-arrow", from: "c", to: `b${opts.charAt}`, state: "active" as const }])
        : []),
    ],
    callout: opts.callout,
  };
}

export const pointerArithmetic: Lesson = {
  slug: "pointer-arithmetic",
  track: "c",
  title: "Pointer arithmetic",
  tagline: "p + 1 does not add 1. It adds one element — and the type decides how big that is.",
  description:
    "Step a pointer through an array and watch the address jump by sizeof(type), see why pointer subtraction gives an index, and meet the one-past-the-end rule.",
  difficulty: 2,
  minutes: 10,
  access: "free",
  language: "c",
  keywords: ["pointer arithmetic", "p++", "array traversal", "one past the end", "sizeof"],
  stages: [
    {
      id: "start",
      title: "int *p = arr",
      body: [
        "An array name used in an expression becomes the address of its first element. So `p = arr` is the same as `p = &arr[0]`.",
        "The elements are contiguous by definition: `arr[1]` starts exactly 4 bytes after `arr[0]`, with nothing in between.",
      ],
      code: CODE,
      activeLines: [4, 5],
      scene: scene({
        at: 0,
        arrowLabel: "p",
        callout: { tone: "info", text: "p holds 0x1000 — the address of arr[0], not of 'the array'." },
      }),
    },
    {
      id: "increment",
      title: "p++ moves 4 bytes, not 1",
      body: [
        "The address goes from `0x1000` to `0x1004`. The compiler scales the `1` by `sizeof(int)` because `p` is an `int *`.",
        "This is why the type of a pointer matters even though every pointer just holds an address: the type is what makes `+ 1` mean \"next element\".",
      ],
      code: CODE,
      activeLines: [7],
      scene: scene({
        at: 1,
        arrowLabel: "p + 1",
        callout: {
          tone: "active",
          text: "0x1000 + 1 × 4 = 0x1004. On a char * the same p++ would land on 0x1001.",
        },
      }),
    },
    {
      id: "add",
      title: "p += 2 jumps two elements",
      body: [
        "Same rule, bigger step: 2 × 4 bytes, so `0x1004` becomes `0x100c`.",
        "This scaling is exactly what makes `arr[i]` fast — indexing is one multiply and one add, no searching.",
      ],
      code: CODE,
      activeLines: [8],
      scene: scene({
        at: 3,
        arrowLabel: "p + 2",
        callout: { tone: "active", text: "0x1004 + 2 × 4 = 0x100c → arr[3]." },
      }),
    },
    {
      id: "difference",
      title: "p - arr gives 3, not 12",
      body: [
        "Subtracting two pointers into the same array gives the distance **in elements**, because the compiler divides the byte distance by `sizeof(int)`.",
        "So a pointer walking an array always knows its own index: `p - arr`. The result has type `ptrdiff_t`, printed with `%td`.",
      ],
      code: CODE,
      activeLines: [10],
      scene: scene({
        at: 3,
        activeCell: 3,
        arrowLabel: "p - arr = 3",
        callout: { tone: "active", text: "(0x100c − 0x1000) ÷ 4 = 3. Bytes go in, elements come out." },
      }),
    },
    {
      id: "char-pointer",
      title: "Same address, different stride",
      body: [
        "Cast the array to `char *` and the exact same address now moves one byte at a time.",
        "`c++` lands *inside* `arr[0]`, on its second byte. On a little-endian machine `arr[0] = 10` is stored as `0a 00 00 00`, so `c` now points at a `00` that is only meaningful as part of a larger value.",
      ],
      code: CODE,
      activeLines: [12, 13],
      scene: scene({
        at: 3,
        pState: "idle",
        arrowState: "idle",
        charAt: 1,
        callout: {
          tone: "info",
          text: "The address is just a number. The pointer's type decides how far a step is and how many bytes a read takes.",
        },
      }),
    },
    {
      id: "one-past",
      title: "One past the end is legal — dereferencing it is not",
      body: [
        "C guarantees you may compute and compare `&arr[5]`, the address one element past the last. Loops rely on it: `while (p < end)`.",
        "What you may not do is read or write there. Nothing is allocated at `0x1014`; it is a boundary marker, not a slot.",
      ],
      code: CODE,
      activeLines: [15],
      scene: scene({
        at: 5,
        arrowState: "danger",
        dashed: true,
        arrowLabel: "valid to hold",
        callout: {
          tone: "danger",
          text: "*p here is undefined behaviour. Going even one element further — &arr[6] — is undefined just to compute.",
        },
      }),
    },
    {
      id: "recap",
      title: "The rule, in one line",
      body: [
        "`p + n` is `address + n × sizeof(*p)`. Everything else about pointer arithmetic follows from that.",
        "It also explains why arithmetic on `void *` is not allowed: with no element size, there is nothing to scale by.",
        "Next: why `arr[i]` and `*(arr + i)` are the same expression, and where an array stops behaving like a pointer.",
      ],
      code: CODE,
      activeLines: [7, 8],
      scene: scene({
        at: 3,
        arrowState: "idle",
        arrowLabel: "p",
        callout: {
          tone: "success",
          text: "Step size comes from the type. Distance comes back out in elements. The two are the same rule read in both directions.",
        },
      }),
    },
  ],
};
