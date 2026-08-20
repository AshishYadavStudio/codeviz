import type { Frame, Lesson, Scene } from "@/lib/viz/types";
import { stackRegion } from "@/lib/viz/scene-helpers";

const CODE = `#include <stdio.h>

int fact(int n) {
    if (n <= 1)
        return 1;
    return n * fact(n - 1);
}

int main(void) {
    printf("%d\\n", fact(4));
    return 0;
}`;

const BASE = 0x7ffd8000;

/** One frame per live call. `returns` fills in as the stack unwinds. */
function factFrame(
  n: number,
  opts: { state?: Frame["state"]; returns?: string; waitingOn?: number } = {},
): Frame {
  const depth = 5 - n;
  return {
    id: `fact${n}`,
    label: `fact(${n})`,
    state: opts.state ?? "idle",
    badge: opts.returns ? `returns ${opts.returns}` : `depth ${depth}`,
    note: opts.waitingOn !== undefined ? `waiting on fact(${opts.waitingOn})` : undefined,
    cells: [
      {
        id: `n${n}`,
        name: "n",
        type: "int",
        value: String(n),
        address: `0x${(BASE - depth * 0x20).toString(16)}`,
        state: opts.state === "active" ? "active" : opts.returns ? "success" : "idle",
        row: 0,
      },
    ],
  };
}

const mainFrame = (result?: string): Frame => ({
  id: "main",
  label: "main()",
  state: result ? "active" : "idle",
  badge: result ? `prints ${result}` : undefined,
  cells: [],
  note: result ? undefined : "waiting on fact(4) — line 10",
});

const scene = (frames: Frame[], callout?: Scene["callout"], caption?: string): Scene => ({
  regions: [stackRegion(frames, caption ?? "one frame per live call")],
  callout,
});

export const recursionAndTheStack: Lesson = {
  slug: "recursion-and-the-stack",
  track: "c",
  title: "Recursion on the stack",
  tagline: "Nothing special happens. A function calling itself gets a new frame, like any other call.",
  description:
    "Watch factorial(4) build four stack frames on the way down and collapse them on the way back up, with the depth counter and each pending multiplication visible.",
  difficulty: 2,
  minutes: 9,
  access: "free",
  language: "c",
  keywords: ["recursion", "call stack", "factorial", "base case", "stack overflow"],
  stages: [
    {
      id: "call",
      title: "main calls fact(4)",
      body: [
        "One frame for `main`, one for `fact(4)`. So far this is an ordinary function call.",
        "`n` is 4, which is greater than 1, so the base case is skipped and line 6 runs.",
      ],
      code: CODE,
      activeLines: [10, 4],
      scene: scene([mainFrame(), factFrame(4, { state: "active" })]),
    },
    {
      id: "descend-3",
      title: "fact(4) calls fact(3) — and waits",
      body: [
        "`return n * fact(n - 1)` cannot return anything yet. It needs the result of `fact(3)` before the multiplication can happen.",
        "So `fact(4)`'s frame stays on the stack, holding `n = 4`, suspended mid-expression. That pending `4 *` is the part beginners lose track of.",
      ],
      code: CODE,
      activeLines: [6],
      scene: scene(
        [mainFrame(), factFrame(4, { waitingOn: 3 }), factFrame(3, { state: "active" })],
        { tone: "active", text: "fact(4) is not finished. It is paused, holding a multiplication it cannot complete yet." },
      ),
    },
    {
      id: "descend-2",
      title: "And down again",
      body: [
        "`fact(3)` does the same thing: it needs `fact(2)` first. Another frame, another suspended multiplication.",
        "Each frame has its own `n` at its own address. There is no single shared `n` being overwritten — that is precisely why recursion works.",
      ],
      code: CODE,
      activeLines: [6],
      scene: scene(
        [
          mainFrame(),
          factFrame(4, { waitingOn: 3 }),
          factFrame(3, { waitingOn: 2 }),
          factFrame(2, { state: "active" }),
        ],
        { tone: "info", text: "Three copies of n alive at once: 4, 3 and 2 — three frames, three addresses." },
      ),
    },
    {
      id: "base",
      title: "fact(1) hits the base case",
      body: [
        "`n <= 1` is finally true, so this call returns 1 immediately without recursing.",
        "The base case is the only reason the descent stops. Without it, the frames keep stacking until the stack runs out.",
      ],
      code: CODE,
      activeLines: [4, 5],
      scene: scene(
        [
          mainFrame(),
          factFrame(4, { waitingOn: 3 }),
          factFrame(3, { waitingOn: 2 }),
          factFrame(2, { waitingOn: 1 }),
          factFrame(1, { state: "returning", returns: "1" }),
        ],
        { tone: "success", text: "Deepest point: four frames of fact, plus main. Now it all comes back." },
      ),
    },
    {
      id: "unwind-2",
      title: "Unwinding: 2 × 1 = 2",
      body: [
        "`fact(1)` returned 1 and popped. `fact(2)` wakes up exactly where it stopped, with its own `n = 2` still sitting in its frame.",
        "It can now finish the multiplication it has been holding: `2 * 1`.",
      ],
      code: CODE,
      activeLines: [6],
      scene: scene(
        [
          mainFrame(),
          factFrame(4, { waitingOn: 3 }),
          factFrame(3, { waitingOn: 2 }),
          factFrame(2, { state: "returning", returns: "2" }),
        ],
        { tone: "success", text: "The pending multiplications resolve in reverse order — last suspended, first completed." },
      ),
    },
    {
      id: "unwind-3",
      title: "3 × 2 = 6",
      body: [
        "Same again one level up. `fact(3)` had been holding `3 *` since the second step, and now has a 2 to multiply by.",
        "Notice that no intermediate results were stored anywhere you wrote. The stack held them for you, one per frame.",
      ],
      code: CODE,
      activeLines: [6],
      scene: scene(
        [mainFrame(), factFrame(4, { waitingOn: 3 }), factFrame(3, { state: "returning", returns: "6" })],
        { tone: "success", text: "6 goes to fact(4), the last frame still waiting." },
      ),
    },
    {
      id: "unwind-4",
      title: "4 × 6 = 24",
      body: [
        "The outermost call completes and returns 24 to `main`.",
        "Four frames were created and four were destroyed. The recursion's \"memory\" was the stack itself, and it cleaned itself up on the way out.",
      ],
      code: CODE,
      activeLines: [6, 10],
      scene: scene([mainFrame(), factFrame(4, { state: "returning", returns: "24" })], {
        tone: "success",
        text: "24 — built on the way down, computed on the way back up.",
      }),
    },
    {
      id: "done",
      title: "Back to main",
      body: [
        "Every `fact` frame is gone. The depth reached 4, which is nothing — the stack is typically around 8 MB, and each frame here is only a few dozen bytes.",
        "Depth is the real cost of recursion. Not the calls, the frames.",
      ],
      code: CODE,
      activeLines: [10, 11],
      scene: scene([mainFrame("24")], {
        tone: "info",
        text: "Max depth 4. The same code with n = 100000 would need 100000 frames alive at once.",
      }),
    },
    {
      id: "overflow",
      title: "Forget the base case and the stack runs out",
      body: [
        "Remove the `if (n <= 1)` guard and nothing stops the descent. `fact(0)` calls `fact(-1)`, which calls `fact(-2)`, forever.",
        "Frames keep pushing until the stack region is exhausted and the program dies — a stack overflow. It is not an infinite loop; it is an infinite *stack*, and it takes memory down with it.",
      ],
      code: CODE,
      activeLines: [4, 6],
      scene: scene(
        [
          mainFrame(),
          factFrame(4, { waitingOn: 3 }),
          factFrame(3, { waitingOn: 2 }),
          factFrame(2, { waitingOn: 1 }),
          { ...factFrame(1, { waitingOn: 0 }), state: "idle" },
          {
            id: "overflow",
            label: "fact(0), fact(-1), fact(-2), …",
            state: "idle",
            badge: "no base case",
            cells: [
              {
                id: "overflow-cell",
                name: "n",
                type: "int",
                value: "…",
                state: "danger",
                note: "frames keep pushing until the stack is gone",
                row: 0,
              },
            ],
          },
        ],
        {
          tone: "danger",
          text: "Every recursion needs a case that returns without calling itself, and a guarantee it gets there.",
        },
        "growing without limit",
      ),
    },
  ],
};
