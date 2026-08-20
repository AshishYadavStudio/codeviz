import type { Cell, CellState, Lesson, Scene } from "@/lib/viz/types";
import { stackRegion } from "@/lib/viz/scene-helpers";

const X_ADDR = "0x7ffd4c10";
const P_ADDR = "0x7ffd4c18";

const CODE = `#include <stdio.h>

int main(void) {
    int  x = 42;
    int *p;

    p = &x;
    printf("%d\\n", *p);

    *p = 99;
    p = NULL;
    return 0;
}`;

function scene(opts: {
  xValue?: string;
  xState?: CellState;
  pValue?: string;
  pState?: CellState;
  showP?: boolean;
  arrow?: "none" | "idle" | "active";
  arrowLabel?: string;
  callout?: Scene["callout"];
}): Scene {
  const cells: Cell[] = [
    {
      id: "x",
      name: "x",
      type: "int",
      value: opts.xValue ?? "42",
      address: X_ADDR,
      state: opts.xState ?? "idle",
      row: 0,
    },
  ];

  if (opts.showP !== false) {
    cells.push({
      id: "p",
      name: "p",
      type: "int *",
      value: opts.pValue ?? "?",
      address: P_ADDR,
      state: opts.pState ?? "idle",
      row: 1,
    });
  }

  return {
    regions: [stackRegion([{ id: "main", label: "main()", state: "active", cells }])],
    arrows:
      opts.arrow && opts.arrow !== "none"
        ? [{ id: "p->x", from: "p", to: "x", state: opts.arrow, label: opts.arrowLabel }]
        : undefined,
    callout: opts.callout,
  };
}

export const pointers101: Lesson = {
  slug: "pointers-101",
  track: "c",
  title: "Pointers 101",
  tagline: "A pointer is an ordinary variable. The value it stores happens to be an address.",
  description:
    "Watch a pointer get declared, aimed with &, read through with *, written through, and finally set to NULL — with the arrow moving live at every step.",
  difficulty: 1,
  minutes: 9,
  access: "free",
  language: "c",
  keywords: ["c pointers", "dereference", "address of operator", "null pointer", "pointer tutorial"],
  intro: [
    "A **pointer** sounds mystical, but it is the most ordinary thing possible: a variable whose value happens to be a memory address rather than a number or a character.",
    "Why does this exist? Because sometimes you need to say \"the thing over *there*\" instead of \"a copy of the thing\". You want to modify what another function has, share one big object between many places, or build a list that can grow.",
    "This lesson shows the two operators that make pointers work — `&` (\"the address of\") and `*` (\"the value at\") — and watches an arrow appear between two boxes in memory. Once you see that arrow, pointers stop being mystical.",
  ],
  stages: [
    {
      id: "x",
      title: "Start with something to point at",
      body: [
        "`x` is a normal `int`: 4 bytes in `main`'s frame, holding 42, living at `0x7ffd4c10`.",
        "Nothing about `x` is special. Any variable with an address — which is all of them — can be pointed at.",
      ],
      code: CODE,
      activeLines: [4],
      scene: scene({ xState: "active", showP: false }),
    },
    {
      id: "declare",
      title: "int *p — a box, not a link",
      body: [
        "`int *p;` reserves 8 bytes for `p`. It does not create a connection to anything, and it does not zero the memory.",
        "`p` currently holds whatever bytes were left in that slot by whatever ran before. It is a valid-looking address pointing somewhere arbitrary.",
      ],
      code: CODE,
      activeLines: [5],
      scene: scene({
        pState: "garbage",
        callout: {
          tone: "danger",
          text: "Dereferencing p right now is undefined behaviour — the crash, if you get one, is the good outcome.",
        },
      }),
    },
    {
      id: "assign",
      title: "p = &x — now it points",
      body: [
        "`&x` produces the address `0x7ffd4c10`, and that address is stored in `p` like any other value.",
        "The arrow in the diagram is not a thing in memory. It is just how we draw \"the number in this box happens to be the address of that box\".",
      ],
      code: CODE,
      activeLines: [7],
      scene: scene({
        pValue: X_ADDR,
        pState: "active",
        arrow: "active",
        callout: {
          tone: "active",
          text: "p holds 0x7ffd4c10. The arrow is a reading of that number, not extra machinery.",
        },
      }),
    },
    {
      id: "deref",
      title: "*p — follow the arrow and read",
      body: [
        "`*p` means: take the address in `p`, go there, read an `int`.",
        "The type matters. `p` is an `int *`, so the machine reads exactly 4 bytes and interprets them as an `int`. A `char *` holding the same address would read 1 byte.",
      ],
      code: CODE,
      activeLines: [8],
      scene: scene({
        pValue: X_ADDR,
        pState: "read",
        xState: "active",
        arrow: "active",
        arrowLabel: "*p → 42",
        callout: { tone: "active", text: "*p is 42 — not a copy of x, but x itself, reached the long way round." },
      }),
    },
    {
      id: "three-questions",
      title: "p, *p and &p are three different questions",
      body: [
        "`p` is `0x7ffd4c10` — the address it stores.",
        "`*p` is `42` — the value at that address.",
        "`&p` is `0x7ffd4c18` — where `p` itself lives. A pointer is a variable, so it has an address too, and a `int **` could point at it.",
      ],
      code: CODE,
      activeLines: [8],
      scene: scene({
        pValue: X_ADDR,
        pState: "active",
        arrow: "idle",
        callout: {
          tone: "info",
          text: "Confusing p with *p is the single most common pointer bug. Read them as 'where' and 'what'.",
        },
      }),
    },
    {
      id: "write",
      title: "*p = 99 — write through the arrow",
      body: [
        "`*p` on the left of an `=` names a destination instead of producing a value. The 4 bytes at `0x7ffd4c10` are overwritten.",
        "`x` was never mentioned on this line, and `x` changed. That is the whole point of pointers — and the whole reason they are dangerous.",
      ],
      code: CODE,
      activeLines: [10],
      scene: scene({
        xValue: "99",
        xState: "active",
        pValue: X_ADDR,
        pState: "read",
        arrow: "active",
        arrowLabel: "write 99",
        callout: {
          tone: "active",
          text: "One box, two names. x and *p are now two ways of saying the same 4 bytes.",
        },
      }),
    },
    {
      id: "null",
      title: "p = NULL — pointing at nothing, on purpose",
      body: [
        "`NULL` is the address a pointer holds when it deliberately points at nothing. It is guaranteed to compare unequal to any real object.",
        "Dereferencing it reliably crashes, and that reliability is the feature: a NULL pointer fails immediately and loudly, where a stale address fails quietly and much later.",
      ],
      code: CODE,
      activeLines: [11],
      scene: scene({
        xValue: "99",
        pValue: "NULL",
        pState: "active",
        callout: {
          tone: "info",
          text: "Set pointers to NULL when they stop being valid. It converts a silent bug into an obvious one.",
        },
      }),
    },
    {
      id: "recap",
      title: "What you can now read",
      body: [
        "`int *p = &x;` — make a box, put the address of `x` in it.",
        "`*p` — the thing at that address. `&x` — the address of that thing. They undo each other: `*&x` is just `x`.",
        "Next: what happens when you do arithmetic on the address itself.",
      ],
      code: CODE,
      activeLines: [7, 10],
      scene: scene({
        xValue: "99",
        pValue: X_ADDR,
        arrow: "idle",
        arrowLabel: "p",
        callout: {
          tone: "success",
          text: "If you can point at this diagram and say what p, *p and &p each are, you have pointers.",
        },
      }),
    },
  ],
};
