import type { CellState, Lesson, Scene } from "@/lib/viz/types";
import { blocksRegion, stackRegion } from "@/lib/viz/scene-helpers";

const CODE = `// Array-backed stack
struct Stack {
    int data[100];
    int top;          // index of next free slot
};

void push(Stack *s, int val) {
    s->data[s->top++] = val;   // O(1)
}

int pop(Stack *s) {
    return s->data[--s->top];  // O(1)
}

int peek(Stack *s) {
    return s->data[s->top - 1];
}

// Example: matching brackets
bool balanced(const char *str) {
    Stack s = { .top = 0 };
    for (int i = 0; str[i]; i++) {
        if (str[i] == '(') push(&s, str[i]);
        else if (str[i] == ')') {
            if (s.top == 0) return false;
            pop(&s);
        }
    }
    return s.top == 0;
}`;

function scene(opts: {
  items: { id: string; value: string; state?: CellState; note?: string }[];
  top: number;
  label?: string;
  callFrames?: { id: string; label: string; state?: "active" | "popped" }[];
  callout?: Scene["callout"];
}): Scene {
  return {
    regions: [
      blocksRegion("stack", opts.label ?? "Stack", [{
        id: "data",
        label: `top = ${opts.top}`,
        cells: opts.items.map((item) => ({
          id: item.id,
          value: item.value,
          state: item.state ?? "idle",
          note: item.note,
        })),
      }], "last in, first out"),
      ...(opts.callFrames
        ? [stackRegion(
            opts.callFrames.map((f) => ({
              id: f.id,
              label: f.label,
              state: f.state ?? "active",
              cells: [],
            })),
            "the call stack is a stack too",
          )]
        : []),
    ],
    callout: opts.callout,
  };
}

export const stack: Lesson = {
  slug: "stack",
  track: "dsa",
  title: "Stacks",
  tagline: "Last in, first out — and the call stack you already met.",
  description:
    "Watch push and pop operate in O(1) at one end of an array, see that the call stack is exactly this structure, and step through bracket matching as a classic application.",
  difficulty: 1,
  minutes: 8,
  access: "free",
  language: "c",
  keywords: ["stack", "LIFO", "push", "pop", "call stack", "bracket matching"],
  stages: [
    {
      id: "empty",
      title: "An empty stack",
      body: [
        "A stack is an array with a `top` index. `top` points at the next free slot — when the stack is empty, it is 0.",
        "Only two operations matter: `push` adds to the top, `pop` removes from the top. Both are O(1) because they never move other elements.",
      ],
      code: CODE,
      activeLines: [2, 3, 4],
      scene: scene({
        items: [],
        top: 0,
        callout: { tone: "info", text: "Empty stack. top = 0. Push and pop always work at the top." },
      }),
    },
    {
      id: "push1",
      title: "push(10): write and advance top",
      body: [
        "`data[0] = 10`, then `top` advances to 1. The element is placed at the current top and the index increments.",
        "No other element moves. The cost is one array write — O(1).",
      ],
      code: CODE,
      activeLines: [7, 8],
      scene: scene({
        items: [{ id: "s0", value: "10", state: "active", note: "[0]" }],
        top: 1,
        callout: { tone: "active", text: "push(10) → data[0] = 10, top = 1. O(1)." },
      }),
    },
    {
      id: "push3",
      title: "Push 20 and 30",
      body: [
        "Two more pushes: 20 goes to `data[1]`, 30 goes to `data[2]`. The top advances each time.",
        "The last element pushed — 30 — is the first one that will be popped. This is LIFO: last in, first out.",
      ],
      code: CODE,
      activeLines: [8],
      scene: scene({
        items: [
          { id: "s0b", value: "10", note: "[0]" },
          { id: "s1", value: "20", note: "[1]" },
          { id: "s2", value: "30", state: "active", note: "[2] ← top" },
        ],
        top: 3,
        callout: { tone: "active", text: "LIFO: 30 was pushed last, so it will be popped first." },
      }),
    },
    {
      id: "pop",
      title: "pop(): decrement top and read",
      body: [
        "`top` goes from 3 to 2, and `data[2]` (which is 30) is returned. The value is still in the array, but it is logically gone — the next push will overwrite it.",
        "This is exactly how the function call stack works: return pops a frame, and the next call reuses that memory.",
      ],
      code: CODE,
      activeLines: [11, 12],
      scene: scene({
        items: [
          { id: "s0c", value: "10", note: "[0]" },
          { id: "s1c", value: "20", note: "[1] ← top", state: "active" },
          { id: "s2c", value: "30", note: "[2]", state: "freed" },
        ],
        top: 2,
        callout: { tone: "active", text: "pop() → 30. top drops to 2. The 30 is logically gone." },
      }),
    },
    {
      id: "callstack",
      title: "The call stack is a stack",
      body: [
        "When `main` calls `foo`, `foo`'s frame is pushed. When `foo` calls `bar`, `bar`'s frame is pushed on top. When `bar` returns, its frame is popped. LIFO.",
        "Stack overflow means too many pushes without pops — typically infinite recursion filling the array.",
      ],
      code: CODE,
      activeLines: [7, 8, 11, 12],
      scene: scene({
        items: [],
        top: 0,
        label: "The principle",
        callFrames: [
          { id: "main", label: "main()" },
          { id: "foo", label: "foo()" },
          { id: "bar", label: "bar()", state: "active" },
        ],
        callout: { tone: "info", text: "The call stack you already know is this exact data structure." },
      }),
    },
    {
      id: "brackets",
      title: "Application: matching brackets",
      body: [
        "Scan the string. Push every `(`. When you see `)`, pop — it matches the most recent `(`. If the stack is empty at `)`, or non-empty at end, the string is unbalanced.",
        "The stack naturally tracks nesting because LIFO matches inner brackets before outer ones.",
      ],
      code: CODE,
      activeLines: [21, 22, 23, 24, 25, 26],
      scene: scene({
        items: [
          { id: "b0", value: "'('", note: "from pos 0", state: "read" },
          { id: "b1", value: "'('", note: "from pos 1", state: "active" },
        ],
        top: 2,
        label: "Checking \"((a+b)*c)\"",
        callout: {
          tone: "success",
          text: "Push '(' on open. Pop on close. Stack empty at end = balanced.",
        },
      }),
    },
  ],
};
