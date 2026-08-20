import type { Frame, Lesson, Scene } from "@/lib/viz/types";
import { stackRegion } from "@/lib/viz/scene-helpers";

const CODE = `#include <stdio.h>

int add(int a, int b) {
    return a + b;
}

int triple(int n) {
    return add(n, add(n, n));
}

int main(void) {
    int r = triple(5);
    printf("%d\\n", r);
    return 0;
}`;

const mainFrame = (r: string, state: Frame["state"] = "idle"): Frame => ({
  id: "main",
  label: "main()",
  state,
  cells: [
    {
      id: "r",
      name: "r",
      type: "int",
      value: r,
      address: "0x7ffd6a20",
      state: r === "?" ? "garbage" : state === "active" ? "active" : "idle",
      row: 0,
    },
  ],
  note: state === "active" ? undefined : "waiting on triple() — line 13",
});

const tripleFrame = (state: Frame["state"], badge?: string): Frame => ({
  id: "triple",
  label: "triple(5)",
  state,
  badge,
  note: "return address → main, line 13",
  cells: [
    {
      id: "n",
      name: "n",
      type: "int",
      value: "5",
      address: "0x7ffd6a00",
      state: state === "active" ? "read" : "idle",
      row: 0,
    },
  ],
});

const addFrame = (
  a: string,
  b: string,
  opts: { state?: Frame["state"]; badge?: string; label?: string } = {},
): Frame => ({
  id: "add",
  label: opts.label ?? `add(${a}, ${b})`,
  state: opts.state ?? "active",
  badge: opts.badge,
  note: "return address → triple, line 8",
  cells: [
    { id: "a", name: "a", type: "int", value: a, address: "0x7ffd69e0", state: "read", row: 0 },
    { id: "b", name: "b", type: "int", value: b, address: "0x7ffd69e4", state: "read", row: 0 },
  ],
});

const scene = (frames: Frame[], callout?: Scene["callout"]): Scene => ({
  regions: [stackRegion(frames, "newest call at the bottom")],
  callout,
});

export const functionCallStack: Lesson = {
  slug: "function-call-stack",
  track: "c",
  title: "The function call stack",
  tagline: "Every call pushes a frame. Every return pops one. That is the entire mechanism.",
  description:
    "Watch stack frames push and pop as functions call each other, each with its own parameters, locals and return address — including nested calls evaluated inside out.",
  difficulty: 2,
  minutes: 8,
  access: "free",
  language: "c",
  keywords: ["call stack", "stack frame", "return address", "function calls in c", "nested calls"],
  stages: [
    {
      id: "main",
      title: "main starts, r is not yet a number",
      body: [
        "`main` gets a frame containing its local `r`. The 4 bytes exist, but nothing has been written to them — `r` holds whatever was already there.",
        "The line `int r = triple(5);` cannot finish until `triple` produces a value, so the assignment is the last thing that will happen, not the first.",
      ],
      code: CODE,
      activeLines: [13],
      scene: scene([mainFrame("?", "active")]),
    },
    {
      id: "call-triple",
      title: "Calling triple pushes a frame",
      body: [
        "A new frame appears below `main`'s. It holds the parameter `n`, which is a *copy* of the argument 5.",
        "It also records where to resume: the return address, pointing back into `main` at line 13. That is what makes returning possible without the caller doing any bookkeeping.",
      ],
      code: CODE,
      activeLines: [13, 7],
      scene: scene(
        [mainFrame("?"), tripleFrame("active", "depth 1")],
        {
          tone: "active",
          text: "main is still there, frozen mid-line, holding its own locals. It just isn't running.",
        },
      ),
    },
    {
      id: "inner-add",
      title: "The inner add(n, n) runs first",
      body: [
        "`add(n, add(n, n))` has a call inside a call. The inner one must produce a value before the outer one can be called, so `add(5, 5)` goes first.",
        "A third frame pushes. Three functions are now alive at once, and only the bottom one is executing.",
      ],
      code: CODE,
      activeLines: [8, 4],
      scene: scene(
        [mainFrame("?"), tripleFrame("idle"), addFrame("5", "5", { badge: "depth 2" })],
        { tone: "info", text: "Arguments are evaluated before the call — inside out, deepest first." },
      ),
    },
    {
      id: "inner-return",
      title: "add returns 10 and its frame is gone",
      body: [
        "`return a + b` computes 10, hands it back to the caller, and the frame is popped. `a` and `b` cease to exist immediately.",
        "The value survives the frame because it is returned in a register, not read out of the dead frame.",
      ],
      code: CODE,
      activeLines: [4],
      scene: scene(
        [
          mainFrame("?"),
          tripleFrame("active"),
          addFrame("5", "5", { state: "returning", badge: "returns 10" }),
        ],
        {
          tone: "success",
          text: "10 goes back to triple, which now has everything it needs for the outer call.",
        },
      ),
    },
    {
      id: "outer-add",
      title: "Now the outer add(5, 10)",
      body: [
        "A frame pushes again — the same function, a fresh frame, different parameter values.",
        "This reuse is the point: `add` has no memory of the previous call, because everything it knew lived in a frame that no longer exists.",
      ],
      code: CODE,
      activeLines: [8, 4],
      scene: scene(
        [mainFrame("?"), tripleFrame("idle"), addFrame("5", "10", { badge: "depth 2" })],
        { tone: "active", text: "Same code, second frame. Functions are re-entrant because their state is per-call." },
      ),
    },
    {
      id: "outer-return",
      title: "15 goes back to triple",
      body: [
        "`add` returns 15 and pops. `triple` is running again, on exactly the line it was suspended at, with its own `n` still intact.",
        "Nothing had to be saved or restored by hand. The frame kept `n` alive across two nested calls.",
      ],
      code: CODE,
      activeLines: [8],
      scene: scene(
        [
          mainFrame("?"),
          tripleFrame("active"),
          addFrame("5", "10", { state: "returning", badge: "returns 15" }),
        ],
        { tone: "success", text: "triple's n was never touched by either add call. Separate frames, separate storage." },
      ),
    },
    {
      id: "triple-return",
      title: "triple returns, r finally gets its value",
      body: [
        "`triple` returns 15 and its frame pops. Control resumes in `main` at the return address recorded three steps ago.",
        "Only now does the assignment `r = 15` happen — the statement on line 13 has been waiting the whole time.",
      ],
      code: CODE,
      activeLines: [13],
      scene: scene(
        [mainFrame("15", "active"), tripleFrame("returning", "returns 15")],
        { tone: "active", text: "The stack unwinds in exactly the reverse of the order it was built." },
      ),
    },
    {
      id: "done",
      title: "Back to one frame",
      body: [
        "`main` is alone again. The memory used by the three popped frames is not cleared — it is simply available for the next call, which will write straight over it.",
        "This is why a pointer to a local variable goes stale the moment its function returns: the address is still valid memory, but it belongs to whoever calls next.",
      ],
      code: CODE,
      activeLines: [14],
      scene: scene([mainFrame("15", "active")], {
        tone: "info",
        text: "Push on call, pop on return, and each frame owns its own copy of everything. That is the whole model.",
      }),
    },
  ],
};
