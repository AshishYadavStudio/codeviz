import type { CellState, Lesson, Scene } from "@/lib/viz/types";

const ADDR = {
  score: "0x7ffd2a40",
  gap: "0x7ffd2a45",
  grade: "0x7ffd2a44",
  ratio: "0x7ffd2a48",
};

const CODE = `#include <stdio.h>

int main(void) {
    int   score = 42;
    char  grade = 'A';
    float ratio = 0.5f;

    printf("%d\\n", score);
    printf("%p\\n", (void *)&score);

    score = 99;
    return 0;
}`;

type Slot = "score" | "grade" | "gap" | "ratio";

function scene(opts: {
  visible: Slot[];
  states?: Partial<Record<Slot, CellState>>;
  scoreValue?: string;
  frameState?: "idle" | "active" | "popped";
  callout?: Scene["callout"];
}): Scene {
  const state = (slot: Slot): CellState => opts.states?.[slot] ?? "idle";

  const defs: Record<Slot, { id: string; name?: string; type?: string; value: string; address: string; note?: string }> = {
    score: {
      id: "score",
      name: "score",
      type: "int",
      value: opts.scoreValue ?? "42",
      address: ADDR.score,
      note: "4 bytes",
    },
    grade: {
      id: "grade",
      name: "grade",
      type: "char",
      value: "'A'",
      address: ADDR.grade,
      note: "1 byte · 65",
    },
    gap: {
      id: "gap",
      value: "",
      address: ADDR.gap,
      note: "3 bytes unused",
    },
    ratio: {
      id: "ratio",
      name: "ratio",
      type: "float",
      value: "0.5",
      address: ADDR.ratio,
      note: "4 bytes",
    },
  };

  return {
    regions: [
      {
        id: "stack",
        kind: "stack",
        label: "Stack",
        caption: "one frame per running function",
        frames: [
          {
            id: "main",
            label: "main()",
            state: opts.frameState ?? "active",
            badge: opts.frameState === "popped" ? "returned" : undefined,
            cells: opts.visible.map((slot) => ({ ...defs[slot], state: state(slot) })),
          },
        ],
      },
    ],
    callout: opts.callout,
  };
}

export const variablesAndMemory: Lesson = {
  slug: "variables-and-memory",
  track: "c",
  title: "Variables & memory addresses",
  tagline: "A variable is a name you gave to a box the machine only knows by number.",
  description:
    "Watch local variables appear inside a stack frame, each with its own address, size and value — and see exactly what changes when you assign to one.",
  difficulty: 1,
  minutes: 7,
  access: "free",
  language: "c",
  keywords: ["c variables", "memory address", "stack frame", "sizeof", "ampersand operator"],
  intro: [
    "A computer's memory is one long strip of numbered boxes. Every box holds a number, and every box has an address — its position on the strip. That is all memory is.",
    "A **variable** is a name your program gives to one of those boxes so you can talk about it in words rather than numbers. `age`, `total`, `count` — they all point at real boxes with real addresses.",
    "This lesson watches the boxes appear as you declare variables, and shows you what your program is actually doing behind those familiar names.",
  ],
  stages: [
    {
      id: "frame",
      title: "Every function gets a frame",
      body: [
        "When `main` starts running, the machine hands it a slab of stack memory called a *stack frame*. Every local variable you declare will live inside it.",
        "Right now the frame exists but nothing has been declared, so there is nothing in it.",
      ],
      code: CODE,
      activeLines: [3],
      scene: scene({
        visible: [],
        callout: {
          tone: "info",
          text: "The frame is reserved the moment the function is entered — before any line of its body runs.",
        },
      }),
    },
    {
      id: "score",
      title: "int score = 42",
      body: [
        "This does two things at once: it reserves 4 bytes inside the frame, and it writes the value `42` into them.",
        "The name `score` is for you. The machine never sees it — after compilation, `score` is just the address `0x7ffd2a40`.",
      ],
      code: CODE,
      activeLines: [4],
      scene: scene({
        visible: ["score"],
        states: { score: "active" },
        callout: {
          tone: "active",
          text: "A variable is three things at once: a name, an address, and a value. Only two of them are real at runtime.",
        },
      }),
    },
    {
      id: "grade",
      title: "char grade = 'A'",
      body: [
        "A `char` needs just 1 byte, so it takes the very next address: `0x7ffd2a44`.",
        "The box holds the number 65 — `'A'` is simply how C spells that number when the type is `char`. The quotes are a notation, not a container.",
      ],
      code: CODE,
      activeLines: [5],
      scene: scene({
        visible: ["score", "grade"],
        states: { grade: "active" },
        callout: {
          tone: "active",
          text: "Size comes from the type, not the value. `char` is 1 byte whether it holds 65 or 0.",
        },
      }),
    },
    {
      id: "ratio",
      title: "float ratio = 0.5f — and a gap",
      body: [
        "`ratio` does not start at `0x7ffd2a45`, the next free byte. It starts at `0x7ffd2a48`.",
        "A 4-byte type wants an address divisible by 4, so the compiler leaves 3 bytes unused. Those bytes are real memory that nothing will ever read — the first hint of a rule you will meet properly in structs.",
      ],
      code: CODE,
      activeLines: [6],
      scene: scene({
        visible: ["score", "grade", "gap", "ratio"],
        states: { gap: "padding", ratio: "active" },
        callout: {
          tone: "info",
          text: "Alignment: the compiler will waste bytes to keep values on tidy address boundaries. It is trading memory for speed.",
        },
      }),
    },
    {
      id: "read",
      title: "Reading a variable is an address lookup",
      body: [
        "`printf(\"%d\", score)` does not pass a name anywhere. The compiler already translated `score` into \"the 4 bytes at `0x7ffd2a40`\", and those bytes are read out and copied into the call.",
        "This is why a variable can be fast: reading one is arithmetic on an address, not a search.",
      ],
      code: CODE,
      activeLines: [8],
      scene: scene({
        visible: ["score", "grade", "gap", "ratio"],
        states: { score: "read", gap: "padding" },
        callout: { tone: "info", text: "Read: go to 0x7ffd2a40, take 4 bytes, interpret them as int → 42." },
      }),
    },
    {
      id: "address-of",
      title: "&score hands you the address itself",
      body: [
        "The `&` operator answers a different question. Instead of \"what is in the box\", it asks \"where is the box\".",
        "That address is an ordinary value: you can print it, store it in a variable, or hand it to another function. Storing it is exactly what a pointer does — the next lesson.",
      ],
      code: CODE,
      activeLines: [9],
      scene: scene({
        visible: ["score", "grade", "gap", "ratio"],
        states: { score: "active", gap: "padding" },
        callout: {
          tone: "active",
          text: "score is 42. &score is 0x7ffd2a40. Same box, two different questions.",
        },
      }),
    },
    {
      id: "assign",
      title: "Assignment replaces the value, never the address",
      body: [
        "`score = 99` overwrites the 4 bytes at `0x7ffd2a40`. The 42 is gone — not moved, not archived, overwritten.",
        "The address did not change and cannot change. A local variable is bolted to its slot in the frame for as long as the frame exists.",
      ],
      code: CODE,
      activeLines: [11],
      scene: scene({
        visible: ["score", "grade", "gap", "ratio"],
        states: { score: "active", gap: "padding" },
        scoreValue: "99",
        callout: {
          tone: "active",
          text: "Same address, new contents. This is the whole reason a pointer stays valid after you assign through it.",
        },
      }),
    },
    {
      id: "pop",
      title: "return — and the frame is gone",
      body: [
        "When `main` returns, its frame is released. `score`, `grade` and `ratio` do not get cleaned up or zeroed; the memory is simply marked available again.",
        "This is why returning the address of a local variable is a bug: the address stays valid-looking long after the values behind it stopped being yours.",
      ],
      code: CODE,
      activeLines: [12],
      scene: scene({
        visible: ["score", "grade", "gap", "ratio"],
        states: { score: "freed", grade: "freed", gap: "freed", ratio: "freed" },
        scoreValue: "99",
        frameState: "popped",
        callout: {
          tone: "danger",
          text: "Released, not erased. The old bytes are still sitting there — which is exactly what makes this class of bug so hard to see.",
        },
      }),
    },
  ],
};
