import type { CellState, Lesson, Scene } from "@/lib/viz/types";
import { stackRegion, staticRegion } from "@/lib/viz/scene-helpers";

const CODE = `#include <stdio.h>

int global = 100;

void increment(int x) {   // x is a copy
    x = x + 1;
    printf("inside: %d\\n", x);  // 43
}

int add(int a, int b) {
    int sum = a + b;
    return sum;                  // copy out
}

int counter(void) {
    static int n = 0;
    n++;
    return n;
}

int main(void) {
    int val = 42;
    increment(val);
    printf("outside: %d\\n", val);  // still 42

    int result = add(10, 20);

    printf("%d\\n", counter());  // 1
    printf("%d\\n", counter());  // 2
}`;

function scene(opts: {
  frames: {
    id: string;
    label: string;
    state?: "idle" | "active" | "returning" | "popped";
    badge?: string;
    cells: { id: string; name: string; value: string; state?: CellState; note?: string }[];
  }[];
  statics?: { id: string; name: string; value: string; state?: CellState; note?: string }[];
  callout?: Scene["callout"];
}): Scene {
  return {
    regions: [
      stackRegion(
        opts.frames.map((f) => ({
          id: f.id,
          label: f.label,
          state: f.state ?? "active",
          badge: f.badge,
          cells: f.cells.map((c) => ({
            id: c.id,
            name: c.name,
            value: c.value,
            state: c.state ?? "idle",
            note: c.note,
          })),
        })),
        "each function gets its own frame",
      ),
      ...(opts.statics
        ? [
            staticRegion(
              [
                {
                  id: "static-frame",
                  label: "Static / global",
                  cells: opts.statics.map((s) => ({
                    id: s.id,
                    name: s.name,
                    value: s.value,
                    state: s.state ?? "idle",
                    note: s.note,
                  })),
                },
              ],
              "lives for the entire program",
            ),
          ]
        : []),
    ],
    callout: opts.callout,
  };
}

export const functionsAndScope: Lesson = {
  slug: "functions-and-scope",
  track: "c",
  title: "Functions & scope",
  tagline: "Parameters are copies; locals, globals and static all live differently.",
  description:
    "Watch a function call push a new frame with copied parameters, see that modifying the copy leaves the caller's variable untouched, and compare the lifetimes of local, global and static variables.",
  difficulty: 1,
  minutes: 9,
  access: "free",
  language: "c",
  keywords: ["function call", "pass by value", "scope", "static variable", "global variable"],
  stages: [
    {
      id: "main-start",
      title: "main has its own frame",
      body: [
        "When `main` starts, the global variable `global` already exists — it was initialised before main was called. Locals like `val` are created inside the frame.",
        "A global variable is visible to every function. A local is visible only inside the one that declared it.",
      ],
      code: CODE,
      activeLines: [19, 20],
      scene: scene({
        frames: [
          { id: "main", label: "main()", cells: [
            { id: "val", name: "val", value: "42", state: "active" },
          ]},
        ],
        statics: [{ id: "global", name: "global", value: "100", note: "visible everywhere" }],
        callout: { tone: "info", text: "global lives in static storage. val lives in main's frame." },
      }),
    },
    {
      id: "call",
      title: "Calling increment copies the value",
      body: [
        "`increment(val)` creates a new frame and copies the value 42 into the parameter `x`. The original `val` and the copy `x` are separate variables at different addresses.",
        "This is pass-by-value. The function receives the number, not the box it came from.",
      ],
      code: CODE,
      activeLines: [5],
      scene: scene({
        frames: [
          { id: "main", label: "main()", cells: [
            { id: "val", name: "val", value: "42" },
          ]},
          { id: "inc", label: "increment()", state: "active", cells: [
            { id: "x", name: "x", value: "42", state: "active", note: "copy of val" },
          ]},
        ],
        statics: [{ id: "global", name: "global", value: "100" }],
        callout: { tone: "active", text: "x is a copy. It starts equal to val, but they are not connected." },
      }),
    },
    {
      id: "modify-copy",
      title: "Changing the copy does not change the original",
      body: [
        "`x = x + 1` makes `x` equal to 43. But `val` back in main is still 42 — the copy was made at call time, and the two variables share nothing.",
        "If you need a function to modify the caller's variable, you must pass a pointer to it.",
      ],
      code: CODE,
      activeLines: [6],
      scene: scene({
        frames: [
          { id: "main", label: "main()", cells: [
            { id: "val", name: "val", value: "42", state: "success", note: "unchanged" },
          ]},
          { id: "inc", label: "increment()", state: "active", cells: [
            { id: "x", name: "x", value: "43", state: "active", note: "changed locally" },
          ]},
        ],
        statics: [{ id: "global", name: "global", value: "100" }],
        callout: { tone: "active", text: "x is 43, val is still 42. Pass-by-value means the copy is independent." },
      }),
    },
    {
      id: "return-pop",
      title: "return pops the frame",
      body: [
        "When `increment` returns, its frame is destroyed. The parameter `x` and any locals it had are gone — the memory is reused by the next call.",
        "Back in main, `val` prints 42. The function call changed nothing the caller can see.",
      ],
      code: CODE,
      activeLines: [21],
      scene: scene({
        frames: [
          { id: "main", label: "main()", state: "active", cells: [
            { id: "val2", name: "val", value: "42", state: "read" },
          ]},
        ],
        statics: [{ id: "global", name: "global", value: "100" }],
        callout: { tone: "info", text: "The frame is gone. val was never touched." },
      }),
    },
    {
      id: "return-value",
      title: "return copies a value out",
      body: [
        "`add(10, 20)` pushes a frame with parameters `a = 10`, `b = 20`, computes `sum = 30`, and returns it. The value 30 is copied into `result` in main.",
        "The local `sum` is destroyed when the frame pops — `result` holds an independent copy.",
      ],
      code: CODE,
      activeLines: [10, 11, 12, 23],
      scene: scene({
        frames: [
          { id: "main", label: "main()", cells: [
            { id: "val3", name: "val", value: "42" },
            { id: "result", name: "result", value: "30", state: "active", note: "copy of sum" },
          ]},
        ],
        statics: [{ id: "global", name: "global", value: "100" }],
        callout: { tone: "active", text: "Values go in as copies (parameters). Values come out as copies (return)." },
      }),
    },
    {
      id: "static-1",
      title: "static: a local that remembers",
      body: [
        "`static int n = 0` is initialised once, when the program starts — not each time `counter()` is called. The variable lives in static storage, not in the frame.",
        "First call: `n` goes from 0 to 1. The variable survives the frame being popped.",
      ],
      code: CODE,
      activeLines: [15, 16, 17],
      scene: scene({
        frames: [
          { id: "main", label: "main()", cells: [
            { id: "val4", name: "val", value: "42" },
            { id: "result2", name: "result", value: "30" },
          ]},
          { id: "counter", label: "counter()", state: "active", cells: [] },
        ],
        statics: [
          { id: "global", name: "global", value: "100" },
          { id: "n", name: "n", value: "1", state: "active", note: "static — survives return" },
        ],
        callout: { tone: "active", text: "static int n lives in static storage, not in the frame. It persists." },
      }),
    },
    {
      id: "static-2",
      title: "Second call: n is still 1",
      body: [
        "The second call to `counter()` finds `n` at 1 — the value from the previous call. It increments to 2 and returns.",
        "Three lifetimes: **locals** die with the frame, **statics** live for the whole program, **globals** live for the whole program and are visible everywhere.",
      ],
      code: CODE,
      activeLines: [26],
      scene: scene({
        frames: [
          { id: "main", label: "main()", state: "active", cells: [
            { id: "val5", name: "val", value: "42" },
            { id: "result3", name: "result", value: "30" },
          ]},
        ],
        statics: [
          { id: "global", name: "global", value: "100" },
          { id: "n2", name: "n", value: "2", state: "success", note: "incremented again" },
        ],
        callout: {
          tone: "success",
          text: "Local = frame lifetime. Global = program lifetime + everywhere. Static = program lifetime + one function.",
        },
      }),
    },
  ],
};
