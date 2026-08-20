import type { CellState, Lesson, Scene } from "@/lib/viz/types";
import { heapRegion, stackRegion } from "@/lib/viz/scene-helpers";

const CODE = `public class Main {
    public static void main(String[] args) {
        // Bad: loop with + creates a new String each time
        String result = "";
        for (int i = 0; i < 3; i++) {
            result = result + i;  // new object every iteration
        }

        // Good: StringBuilder mutates one buffer
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 3; i++) {
            sb.append(i);         // same object, grows the buffer
        }
        String answer = sb.toString();
    }
}`;

function scene(opts: {
  strings?: { id: string; value: string; state?: CellState; badge?: string }[];
  sb?: { id: string; buffer: string; len: string; state?: CellState; badge?: string };
  refs?: { id: string; name: string; type: string; value: string; state?: CellState }[];
  callout?: Scene["callout"];
}): Scene {
  return {
    regions: [
      stackRegion([{
        id: "main",
        label: "main()",
        state: "active",
        cells: (opts.refs ?? []).map((r) => ({
          id: r.id,
          name: r.name,
          type: r.type,
          value: r.value,
          state: r.state ?? "idle",
          row: 1,
        })),
      }], "references to heap objects"),
      heapRegion([
        ...(opts.strings ?? []).map((s) => ({
          id: s.id,
          label: "String",
          state: "idle" as const,
          badge: s.badge,
          cells: [
            { id: `${s.id}-v`, name: "value", value: s.value, state: s.state ?? "idle" },
          ],
        })),
        ...(opts.sb
          ? [{
              id: opts.sb.id,
              label: "StringBuilder",
              state: "active" as const,
              badge: opts.sb.badge,
              cells: [
                { id: `${opts.sb.id}-buf`, name: "buffer", value: opts.sb.buffer, state: opts.sb.state ?? "idle" },
                { id: `${opts.sb.id}-len`, name: "length", value: opts.sb.len, state: "idle" as CellState },
              ],
            }]
          : []),
      ], "strings are immutable; StringBuilder is not"),
    ],
    callout: opts.callout,
  };
}

export const stringBuilder: Lesson = {
  slug: "stringbuilder",
  track: "java",
  title: "StringBuilder & concatenation",
  tagline: "Why building a string in a loop with + allocates every iteration.",
  description:
    "Watch string concatenation with + create a new String object on every loop iteration, then see StringBuilder mutate one buffer in place — same result, far less garbage.",
  difficulty: 1,
  minutes: 7,
  access: "free",
  language: "java",
  keywords: ["StringBuilder", "string concatenation", "immutable", "garbage collection", "performance"],
  stages: [
    {
      id: "empty",
      title: "result starts as an empty string",
      body: [
        "`String result = \"\"` creates a String object on the heap. Strings in Java are immutable — once created, their contents never change.",
        "So `result + i` does not modify this object. It creates a new one.",
      ],
      code: CODE,
      activeLines: [4],
      scene: scene({
        strings: [{ id: "s0", value: "\"\"", state: "active", badge: "immutable" }],
        refs: [{ id: "result", name: "result", type: "String", value: "ref", state: "active" }],
        callout: { tone: "info", text: "Strings are immutable. Every change creates a new object." },
      }),
    },
    {
      id: "iter0",
      title: "Iteration 0: result + 0 creates a new String",
      body: [
        "`result + 0` allocates a new String \"0\", copies the old contents (empty) plus the new character. The old empty string becomes garbage.",
        "For one iteration this is fine. The problem is that this happens every time around the loop.",
      ],
      code: CODE,
      activeLines: [6],
      scene: scene({
        strings: [
          { id: "s0b", value: "\"\"", state: "freed", badge: "garbage" },
          { id: "s1", value: "\"0\"", state: "active", badge: "new" },
        ],
        refs: [{ id: "result1", name: "result", type: "String", value: "ref", state: "active" }],
        callout: { tone: "active", text: "Old string abandoned, new string created. One allocation per iteration." },
      }),
    },
    {
      id: "iter2",
      title: "After 3 iterations: 3 dead strings",
      body: [
        "Each iteration allocated a new String and abandoned the previous one: \"\" → \"0\" → \"01\" → \"012\". Three temporary objects, all garbage.",
        "In a loop of n iterations, this copies an average of n/2 characters per step — O(n²) total work for something that should be O(n).",
      ],
      code: CODE,
      activeLines: [6],
      scene: scene({
        strings: [
          { id: "g1", value: "\"\"", state: "freed", badge: "garbage" },
          { id: "g2", value: "\"0\"", state: "freed", badge: "garbage" },
          { id: "g3", value: "\"01\"", state: "freed", badge: "garbage" },
          { id: "final", value: "\"012\"", state: "success" },
        ],
        refs: [{ id: "result2", name: "result", type: "String", value: "ref" }],
        callout: {
          tone: "danger",
          text: "n iterations → n allocations, O(n²) copying. This is the classic StringBuilder motivation.",
        },
      }),
    },
    {
      id: "sb-create",
      title: "StringBuilder: one mutable buffer",
      body: [
        "`new StringBuilder()` allocates a single object with an internal char array (default capacity 16). Unlike String, it is designed to be modified in place.",
        "The key word is mutable. Appending adds characters to the existing buffer rather than creating a new object.",
      ],
      code: CODE,
      activeLines: [9],
      scene: scene({
        sb: { id: "sb", buffer: "[]", len: "0", state: "active", badge: "capacity 16" },
        refs: [{ id: "sb-ref", name: "sb", type: "StringBuilder", value: "ref", state: "active" }],
        callout: { tone: "active", text: "One object. Append mutates it — no new allocations." },
      }),
    },
    {
      id: "sb-append",
      title: "Three appends, one object",
      body: [
        "Each `sb.append(i)` writes into the same buffer. No new objects, no abandoned strings, no O(n²) copying.",
        "If the buffer fills up, StringBuilder doubles its capacity — one resize, amortised, exactly like ArrayList.",
      ],
      code: CODE,
      activeLines: [11],
      scene: scene({
        sb: { id: "sb2", buffer: "[0, 1, 2, ...]", len: "3", state: "active", badge: "same object" },
        refs: [{ id: "sb-ref2", name: "sb", type: "StringBuilder", value: "ref", state: "active" }],
        callout: { tone: "success", text: "3 appends, 0 new objects. O(n) total work." },
      }),
    },
    {
      id: "tostring",
      title: "toString() creates one final String",
      body: [
        "`sb.toString()` copies the buffer into a single, immutable String. One allocation at the end, instead of one per iteration.",
        "The rule: use `+` for one-shot concatenation (the compiler optimises it). Use `StringBuilder` inside loops.",
      ],
      code: CODE,
      activeLines: [13],
      scene: scene({
        strings: [{ id: "answer", value: "\"012\"", state: "success", badge: "final" }],
        refs: [{ id: "ans-ref", name: "answer", type: "String", value: "ref", state: "success" }],
        callout: {
          tone: "success",
          text: "Loop + concatenation = StringBuilder. Single expression = + is fine.",
        },
      }),
    },
  ],
};
