import type { Arrow, Cell, Frame, Lesson, Scene } from "@/lib/viz/types";
import { heapRegion, stackRegion, staticRegion } from "@/lib/viz/scene-helpers";

const POOL = "0x5a00";
const HEAP_A = "0x7b40";
const HEAP_B = "0x7b80";

const CODE = `public class Main {
    public static void main(String[] args) {
        String a = "hello";              // from the pool
        String b = "hello";              // same pooled object
        String c = new String("hello");  // forced new object

        System.out.println(a == b);      // true  — same reference
        System.out.println(a == c);      // false — different objects
        System.out.println(a.equals(c)); // true  — same characters

        String d = c.intern();           // back to the pooled one

        String s = "he" + "llo";         // folded at compile time
    }
}`;

function scene(opts: {
  locals: { id: string; name: string; target: "pool" | "a" | "b" | null; state?: Cell["state"]; row?: number; note?: string }[];
  heapObjects?: ("a" | "b")[];
  activeTarget?: "pool" | "a" | "b";
  callout?: Scene["callout"];
}): Scene {
  const cells: Cell[] = opts.locals.map((l) => ({
    id: l.id,
    name: l.name,
    type: "String",
    value: l.target === null ? "null" : l.target === "pool" ? POOL : l.target === "a" ? HEAP_A : HEAP_B,
    state: l.state ?? "idle",
    note: l.note,
    row: l.row ?? 0,
  }));

  const heapFrames: Frame[] = (opts.heapObjects ?? []).map((h) => ({
    id: `obj-${h}`,
    label: `String @${h === "a" ? HEAP_A : HEAP_B}`,
    state: opts.activeTarget === h ? "active" : "idle",
    badge: "new String() — always a distinct object",
    cells: [
      {
        id: `obj-${h}-v`,
        name: "value",
        value: '"hello"',
        state: opts.activeTarget === h ? "active" : "idle",
        row: 0,
      },
    ],
  }));

  const arrows: Arrow[] = opts.locals
    .filter((l) => l.target !== null)
    .map((l) => ({
      id: `${l.id}-arrow`,
      from: l.id,
      to: l.target === "pool" ? "pool-v" : `obj-${l.target}-v`,
      state: l.state === "active" ? "active" : "idle",
    }));

  return {
    regions: [
      stackRegion([{ id: "main", label: "main()", state: "active", cells }]),
      ...(heapFrames.length ? [heapRegion(heapFrames, "ordinary objects")] : []),
      staticRegion(
        [
          {
            id: "pool",
            label: `string pool @${POOL}`,
            state: opts.activeTarget === "pool" ? "active" : "idle",
            badge: "one entry per distinct literal, for the life of the JVM",
            cells: [
              {
                id: "pool-v",
                name: "value",
                value: '"hello"',
                state: opts.activeTarget === "pool" ? "active" : "idle",
                row: 0,
              },
            ],
          },
        ],
        "interned literals",
      ),
    ],
    arrows,
    callout: opts.callout,
  };
}

export const stringPool: Lesson = {
  slug: "string-pool",
  track: "java",
  title: "The string pool & ==",
  tagline: "Two strings that print the same can still be two different objects.",
  description:
    "See why == is true for identical literals but false for new String(), what intern() does, and why equals() is the only reliable way to compare text in Java.",
  difficulty: 1,
  minutes: 8,
  access: "free",
  language: "java",
  keywords: ["string pool", "intern", "== vs equals", "java strings", "immutability"],
  stages: [
    {
      id: "literal",
      title: "A literal comes from the pool",
      body: [
        "`String a = \"hello\"` does not allocate a new object each time. The JVM keeps a pool of distinct string literals, and `a` gets a reference to the pooled one.",
        "This is safe only because strings are immutable — sharing one object between unrelated pieces of code would be reckless otherwise.",
      ],
      code: CODE,
      activeLines: [3],
      scene: scene({
        locals: [{ id: "a", name: "a", target: "pool", state: "active" }],
        activeTarget: "pool",
        callout: { tone: "active", text: "One object in the pool. a refers to it." },
      }),
    },
    {
      id: "second-literal",
      title: "The same literal gives the same object",
      body: [
        "`String b = \"hello\"` finds `\"hello\"` already in the pool and reuses it. No allocation, and no second copy of the characters.",
        "So `a == b` is `true` — not because the text matches, but because both variables hold the identical reference.",
      ],
      code: CODE,
      activeLines: [4, 6],
      scene: scene({
        locals: [
          { id: "a", name: "a", target: "pool" },
          { id: "b", name: "b", target: "pool", state: "active", row: 1 },
        ],
        activeTarget: "pool",
        callout: { tone: "success", text: "a == b is true. Two references, one object." },
      }),
    },
    {
      id: "new-string",
      title: "new String() always allocates",
      body: [
        "`new String(\"hello\")` is an explicit instruction to create an object, so the JVM does exactly that — a fresh `String` on the heap, with the same characters.",
        "Now `a == c` is `false`. The characters are identical; the objects are not.",
      ],
      code: CODE,
      activeLines: [5, 7],
      scene: scene({
        locals: [
          { id: "a", name: "a", target: "pool" },
          { id: "b", name: "b", target: "pool" },
          { id: "c", name: "c", target: "a", state: "active", row: 1 },
        ],
        heapObjects: ["a"],
        activeTarget: "a",
        callout: {
          tone: "danger",
          text: "This is the classic bug: == compares references, and it silently works for pooled literals until one value arrives from input or a database.",
        },
      }),
    },
    {
      id: "equals",
      title: "equals() compares the characters",
      body: [
        "`a.equals(c)` walks the characters and reports `true`. That is the question you almost always meant to ask.",
        "Use `==` for strings only when you deliberately want identity — which, for text, is essentially never.",
      ],
      code: CODE,
      activeLines: [8],
      scene: scene({
        locals: [
          { id: "a", name: "a", target: "pool", state: "read" },
          { id: "c", name: "c", target: "a", state: "read", row: 1 },
        ],
        heapObjects: ["a"],
        callout: { tone: "success", text: "Different objects, equal contents. equals() is the honest comparison." },
      }),
    },
    {
      id: "intern",
      title: "intern() returns the pooled instance",
      body: [
        "`c.intern()` looks the characters up in the pool and hands back the canonical object — the very same one `a` refers to.",
        "It is occasionally useful for deduplicating many identical strings, but the pool is a shared JVM-wide table, so interning untrusted input is a memory-pressure risk rather than an optimisation.",
      ],
      code: CODE,
      activeLines: [10],
      scene: scene({
        locals: [
          { id: "a", name: "a", target: "pool" },
          { id: "c", name: "c", target: "a", row: 1 },
          { id: "d", name: "d", target: "pool", state: "active", row: 1 },
        ],
        heapObjects: ["a"],
        activeTarget: "pool",
        callout: { tone: "active", text: "d == a is true again. intern() collapses a duplicate back onto the shared object." },
      }),
    },
    {
      id: "folding",
      title: "\"he\" + \"llo\" is folded before the program runs",
      body: [
        "Both operands are compile-time constants, so the compiler concatenates them and emits a single literal `\"hello\"` — which is then pooled like any other.",
        "So `s == a` is `true`. But change either side to a non-constant variable and the concatenation happens at runtime, producing a brand-new heap object and flipping that comparison to `false`.",
      ],
      code: CODE,
      activeLines: [12],
      scene: scene({
        locals: [
          { id: "a", name: "a", target: "pool" },
          { id: "s", name: "s", target: "pool", state: "active", row: 1 },
        ],
        activeTarget: "pool",
        callout: {
          tone: "info",
          text: "Whether == works depends on compile-time constness — which is exactly why you should not depend on it.",
        },
      }),
    },
    {
      id: "immutable",
      title: "Why none of this is dangerous",
      body: [
        "A `String`'s characters never change. Every operation that looks like mutation — `concat`, `replace`, `toUpperCase`, `substring` — returns a new object and leaves the original untouched.",
        "That is what makes pooling safe, makes strings usable as `HashMap` keys, and makes them safe to share between threads without any locking.",
        "It is also why building a string in a loop with `+` is slow: each iteration allocates a whole new object. Use `StringBuilder` when the result is assembled incrementally.",
      ],
      code: CODE,
      activeLines: [3, 5],
      scene: scene({
        locals: [
          { id: "a", name: "a", target: "pool" },
          { id: "b", name: "b", target: "pool", row: 1 },
        ],
        activeTarget: "pool",
        callout: {
          tone: "success",
          text: "Compare with equals(). Build with StringBuilder. Let the pool worry about identity.",
        },
      }),
    },
  ],
};
