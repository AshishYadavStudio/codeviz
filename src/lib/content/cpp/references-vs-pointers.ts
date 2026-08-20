import type { Cell, CellState, Lesson, Scene } from "@/lib/viz/types";
import { stackRegion } from "@/lib/viz/scene-helpers";

const X_ADDR = "0x7ffd1a10";
const PTR_ADDR = "0x7ffd1a18";

const CODE = `#include <iostream>

void addOne(int &r) { r += 1; }
void addTwo(int *p) { *p += 2; }

int main() {
    int  x   = 10;
    int &ref = x;
    int *ptr = &x;

    ref  = 42;
    *ptr = 7;

    addOne(x);
    addTwo(&x);
    return 0;
}`;

function scene(opts: {
  xValue: string;
  xName?: string;
  xState?: CellState;
  showPtr?: boolean;
  ptrState?: CellState;
  arrow?: "idle" | "active";
  arrowLabel?: string;
  callout?: Scene["callout"];
}): Scene {
  const cells: Cell[] = [
    {
      id: "x",
      name: opts.xName ?? "x",
      type: "int",
      value: opts.xValue,
      address: X_ADDR,
      state: opts.xState ?? "idle",
      row: 0,
    },
  ];

  if (opts.showPtr) {
    cells.push({
      id: "ptr",
      name: "ptr",
      type: "int *",
      value: X_ADDR,
      address: PTR_ADDR,
      state: opts.ptrState ?? "idle",
      row: 1,
    });
  }

  return {
    regions: [stackRegion([{ id: "main", label: "main()", state: "active", cells }])],
    arrows: opts.arrow
      ? [{ id: "ptr-x", from: "ptr", to: "x", state: opts.arrow, label: opts.arrowLabel }]
      : undefined,
    callout: opts.callout,
  };
}

export const referencesVsPointers: Lesson = {
  slug: "references-vs-pointers",
  track: "cpp",
  title: "References vs pointers",
  tagline: "A pointer is a box holding an address. A reference is not a box at all.",
  description:
    "See why a C++ reference adds no storage and cannot be reseated, while a pointer is a real variable with its own address — and when each one is the right tool.",
  difficulty: 1,
  minutes: 8,
  access: "free",
  language: "cpp",
  keywords: ["c++ references", "pointers vs references", "pass by reference", "aliasing"],
  intro: [
    "In C, if you want a function to modify a caller's variable, you pass a pointer. C++ adds a second option: a **reference**, written `int&`, which acts like the original variable itself.",
    "The mental model: a pointer is a box that *holds an address*. A reference is not a box at all — it is another *name* for something that already exists.",
    "This lesson shows the practical difference: references cannot be null, cannot be reassigned to point elsewhere, and read like normal variables. That trades pointer flexibility for pointer safety.",
  ],
  stages: [
    {
      id: "x",
      title: "One int, one box",
      body: [
        "`x` is 4 bytes at `0x7ffd1a10` holding 10. Nothing surprising yet — this is the same model as C.",
        "What follows are two different ways to reach these bytes from somewhere else.",
      ],
      code: CODE,
      activeLines: [7],
      scene: scene({ xValue: "10", xState: "active" }),
    },
    {
      id: "reference",
      title: "int &ref = x adds no storage",
      body: [
        "Look carefully: no new box appeared. `ref` is a second *name* for the bytes that `x` already names — the compiler resolves both to the same address.",
        "There is no `&ref` distinct from `&x`, and `sizeof(ref)` is 4, not 8. A reference is a compile-time aliasing rule, not a runtime object.",
      ],
      code: CODE,
      activeLines: [8],
      scene: scene({
        xValue: "10",
        xName: "x · ref",
        xState: "active",
        callout: {
          tone: "active",
          text: "One box, two names. In practice the compiler usually implements this with a pointer — but the language gives you no way to observe that.",
        },
      }),
    },
    {
      id: "pointer",
      title: "int *ptr = &x does add storage",
      body: [
        "`ptr` is a genuine variable: 8 bytes of its own at `0x7ffd1a18`, holding the number `0x7ffd1a10`.",
        "That is the whole difference. The reference costs nothing you can point at; the pointer is an object you can inspect, reassign, and take the address of.",
      ],
      code: CODE,
      activeLines: [9],
      scene: scene({
        xValue: "10",
        xName: "x · ref",
        showPtr: true,
        ptrState: "active",
        arrow: "active",
        arrowLabel: "ptr",
        callout: { tone: "active", text: "Two ways to reach x — but only one of them occupies memory." },
      }),
    },
    {
      id: "write-ref",
      title: "ref = 42 writes straight through",
      body: [
        "No `*` is needed, because there is nothing to dereference. `ref = 42` *is* `x = 42` as far as the compiler is concerned.",
        "This is what makes references pleasant to read: the call site and the body both look like ordinary variable use.",
      ],
      code: CODE,
      activeLines: [11],
      scene: scene({
        xValue: "42",
        xName: "x · ref",
        xState: "active",
        showPtr: true,
        arrow: "idle",
        callout: { tone: "active", text: "x is now 42. Reading x, ref, or *ptr all give the same answer." },
      }),
    },
    {
      id: "write-ptr",
      title: "*ptr = 7 has to be followed",
      body: [
        "The pointer needs the `*` because `ptr = 7` would be a completely different statement — it would try to change *which* object `ptr` refers to.",
        "That extra step is not ceremony. It is the price of the pointer's extra power.",
      ],
      code: CODE,
      activeLines: [12],
      scene: scene({
        xValue: "7",
        xName: "x · ref",
        xState: "active",
        showPtr: true,
        ptrState: "read",
        arrow: "active",
        arrowLabel: "write 7",
        callout: { tone: "active", text: "Same 4 bytes reached a second way. Now they hold 7." },
      }),
    },
    {
      id: "reseat",
      title: "A reference can never be re-aimed",
      body: [
        "`ref = something_else` assigns *to x*. There is no syntax that makes `ref` refer to a different object, because binding happens once, at initialisation.",
        "A reference also cannot be null: it must be bound when it is created. A pointer can be reassigned freely and can be `nullptr`.",
      ],
      code: CODE,
      activeLines: [8, 9],
      scene: scene({
        xValue: "7",
        xName: "x · ref",
        showPtr: true,
        ptrState: "active",
        arrow: "idle",
        callout: {
          tone: "info",
          text: "Reference: always valid, always the same object. Pointer: optional and re-aimable, so you must check it.",
        },
      }),
    },
    {
      id: "parameters",
      title: "At a call site, only one of them is visible",
      body: [
        "`addOne(x)` and `addTwo(&x)` both modify `x`. The reference version hides that fact at the call site; the pointer version announces it with `&`.",
        "That visibility is the real trade-off. Use a reference when the argument is required and modification is expected; use a pointer when the argument is optional, or when you want the caller to see that something is being handed over.",
      ],
      code: CODE,
      activeLines: [14, 15],
      scene: scene({
        xValue: "10",
        xName: "x · ref",
        xState: "written",
        showPtr: true,
        arrow: "idle",
        callout: {
          tone: "success",
          text: "Prefer references by default; reach for a pointer when you genuinely need null or reassignment.",
        },
      }),
    },
  ],
};
