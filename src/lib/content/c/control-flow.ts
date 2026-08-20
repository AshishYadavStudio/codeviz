import type { CellState, Lesson, Scene } from "@/lib/viz/types";
import { blocksRegion, stackRegion } from "@/lib/viz/scene-helpers";

const CODE = `#include <stdio.h>

int main(void) {
    int score = 75;

    // if / else if / else
    if (score >= 90)
        printf("A\\n");
    else if (score >= 70)
        printf("B\\n");       // ← this branch
    else
        printf("C\\n");

    // while loop
    int i = 3;
    while (i > 0) {
        printf("%d ", i);
        i--;
    }

    // for loop — same thing, tidier
    for (int j = 0; j < 3; j++) {
        printf("%d ", j);
    }

    // switch + fallthrough trap
    switch (score / 10) {
        case 10:
        case 9: printf("A\\n"); break;
        case 7: printf("B\\n"); break;
        default: printf("other\\n");
    }
    return 0;
}`;

function scene(opts: {
  vars: { id: string; name: string; value: string; state?: CellState }[];
  branches?: { id: string; label: string; state?: CellState; note?: string }[];
  callout?: Scene["callout"];
}): Scene {
  return {
    regions: [
      stackRegion([
        {
          id: "main",
          label: "main()",
          state: "active",
          cells: opts.vars.map((v) => ({
            id: v.id,
            name: v.name,
            type: "int",
            value: v.value,
            state: v.state ?? "idle",
          })),
        },
      ]),
      ...(opts.branches
        ? [
            blocksRegion("flow", "Control flow", opts.branches.map((b) => ({
              id: b.id,
              label: b.label,
              state: b.state === "active" ? "active" : b.state === "freed" ? "idle" : "idle",
              cells: [
                {
                  id: `${b.id}-cell`,
                  value: b.state === "active" ? "✓ taken" : b.state === "freed" ? "skipped" : "—",
                  state: b.state ?? "idle",
                  note: b.note,
                },
              ],
            }))),
          ]
        : []),
    ],
    callout: opts.callout,
  };
}

export const controlFlow: Lesson = {
  slug: "control-flow",
  track: "c",
  title: "Control flow",
  tagline: "if, loops and switch as jumps — including fallthrough and off-by-one.",
  description:
    "Step through if/else chains, while and for loops, and a switch statement to see which branch runs, how loop variables change each iteration, and why missing break causes fallthrough.",
  difficulty: 1,
  minutes: 8,
  access: "free",
  language: "c",
  keywords: ["if else", "while loop", "for loop", "switch", "control flow", "fallthrough"],
  stages: [
    {
      id: "if-eval",
      title: "if tests conditions top to bottom",
      body: [
        "`score` is 75. The first test, `score >= 90`, is false — the body is skipped entirely. The machine jumps past it to the next `else if`.",
        "The conditions are evaluated in written order, and the first true one wins. Everything below it is skipped, even if it would also be true.",
      ],
      code: CODE,
      activeLines: [6],
      scene: scene({
        vars: [{ id: "score", name: "score", value: "75", state: "read" }],
        branches: [
          { id: "a", label: "score >= 90", state: "freed", note: "75 ≥ 90? no" },
        ],
        callout: { tone: "info", text: "75 is not ≥ 90. This branch is skipped — jump to else if." },
      }),
    },
    {
      id: "if-match",
      title: "The second branch matches",
      body: [
        "`score >= 70` is true, so its body runs. The remaining `else` is skipped without being tested — the chain is done.",
        "This is different from a sequence of independent `if` statements, where every condition would be checked.",
      ],
      code: CODE,
      activeLines: [8, 9],
      scene: scene({
        vars: [{ id: "score", name: "score", value: "75", state: "read" }],
        branches: [
          { id: "a", label: "score >= 90", state: "freed", note: "false" },
          { id: "b", label: "score >= 70", state: "active", note: "75 ≥ 70? yes" },
          { id: "c", label: "else", state: "freed", note: "skipped" },
        ],
        callout: { tone: "active", text: "First true branch wins. The else is never tested." },
      }),
    },
    {
      id: "while-start",
      title: "while checks before each iteration",
      body: [
        "`i` starts at 3. The condition `i > 0` is checked *before* the body runs. If it were false on entry, the body would never execute — zero iterations.",
        "This is what separates `while` from `do-while`: the check happens at the top, not the bottom.",
      ],
      code: CODE,
      activeLines: [14, 15],
      scene: scene({
        vars: [
          { id: "score2", name: "score", value: "75" },
          { id: "i", name: "i", value: "3", state: "active" },
        ],
        branches: [
          { id: "cond", label: "i > 0?", state: "active", note: "3 > 0 → true" },
        ],
        callout: { tone: "active", text: "i is 3. The condition is true, so the body runs." },
      }),
    },
    {
      id: "while-iter",
      title: "Each iteration decrements i",
      body: [
        "After printing 3, `i--` changes i to 2. The loop jumps back to the condition. 2 > 0 is true, so the body runs again.",
        "This continues: print 2, decrement to 1, check, print 1, decrement to 0, check — 0 > 0 is false, and the loop ends.",
      ],
      code: CODE,
      activeLines: [16, 17],
      scene: scene({
        vars: [
          { id: "score3", name: "score", value: "75" },
          { id: "i2", name: "i", value: "0", state: "success" },
        ],
        branches: [
          { id: "iter1", label: "i=3 → print 3", state: "active" },
          { id: "iter2", label: "i=2 → print 2", state: "active" },
          { id: "iter3", label: "i=1 → print 1", state: "active" },
          { id: "iter4", label: "i=0 → stop", state: "success", note: "0 > 0 → false" },
        ],
        callout: { tone: "success", text: "3 iterations. Off-by-one bugs live in the condition: > vs >=." },
      }),
    },
    {
      id: "for",
      title: "for is a while with the bookkeeping attached",
      body: [
        "`for (int j = 0; j < 3; j++)` packs init, condition and update into one line. It runs identically to a while loop — the compiler produces the same machine code.",
        "The advantage is locality: you can see the loop variable's lifetime, range and direction in a single glance.",
      ],
      code: CODE,
      activeLines: [20, 21],
      scene: scene({
        vars: [
          { id: "score4", name: "score", value: "75" },
          { id: "j", name: "j", value: "3", state: "success" },
        ],
        branches: [
          { id: "j0", label: "j=0 → print 0", state: "active" },
          { id: "j1", label: "j=1 → print 1", state: "active" },
          { id: "j2", label: "j=2 → print 2", state: "active" },
          { id: "j3", label: "j=3 → stop", state: "success", note: "3 < 3 → false" },
        ],
        callout: { tone: "info", text: "j < 3 means iterations 0, 1, 2 — exactly 3 times. Use <= 3 for 4." },
      }),
    },
    {
      id: "switch",
      title: "switch jumps to a label, then keeps going",
      body: [
        "`score / 10` is 7 (integer division). The switch jumps to `case 7:` and prints \"B\".",
        "Notice `case 10:` has no body — it falls through to `case 9:`. That is deliberate here, but an accidental missing `break` causes the same behaviour as a bug.",
      ],
      code: CODE,
      activeLines: [24, 25, 26, 27, 28],
      scene: scene({
        vars: [{ id: "score5", name: "score", value: "75", state: "read" }],
        branches: [
          { id: "c10", label: "case 10:", state: "freed", note: "fallthrough ↓" },
          { id: "c9", label: "case 9:", state: "freed", note: "break" },
          { id: "c7", label: "case 7:", state: "active", note: "75/10 = 7 → match" },
          { id: "cdef", label: "default:", state: "freed", note: "skipped (break)" },
        ],
        callout: {
          tone: "danger",
          text: "Without break, execution falls through to the next case. That is rarely what you want.",
        },
      }),
    },
    {
      id: "recap",
      title: "Control flow is just conditional jumps",
      body: [
        "Every `if`, `while`, `for` and `switch` compiles to the same thing: a comparison and a jump instruction. There are no higher-level constructs at the machine level.",
        "The common bugs are all about getting the boundaries wrong: `<` vs `<=`, forgetting `break`, or testing conditions in the wrong order.",
      ],
      code: CODE,
      activeLines: [6, 14, 20, 24],
      scene: scene({
        vars: [{ id: "score6", name: "score", value: "75", state: "success" }],
        callout: {
          tone: "success",
          text: "if chooses a branch. while/for repeat. switch jumps. All three compile to compare-and-jump.",
        },
      }),
    },
  ],
};
