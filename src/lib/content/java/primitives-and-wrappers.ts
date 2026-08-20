import type { Arrow, CellState, Lesson, Scene } from "@/lib/viz/types";
import { heapRegion, stackRegion } from "@/lib/viz/scene-helpers";

const CODE = `public class Main {
    public static void main(String[] args) {
        // Primitives — value in the slot
        int    age   = 25;
        double price = 9.99;
        boolean ok   = true;
        char   grade = 'A';

        // Wrapper — object on the heap
        Integer boxed = Integer.valueOf(25);

        // The eight primitives and their wrappers
        // byte  → Byte      (1 byte)
        // short → Short     (2 bytes)
        // int   → Integer   (4 bytes)
        // long  → Long      (8 bytes)
        // float → Float     (4 bytes)
        // double→ Double    (8 bytes)
        // char  → Character (2 bytes)
        // boolean→ Boolean  (1 bit, stored as byte)

        // Why wrappers exist: generics need objects
        List<Integer> nums = new ArrayList<>();
        nums.add(42);   // auto-boxed: int → Integer
    }
}`;

function scene(opts: {
  locals: { id: string; name: string; type: string; value: string; state?: CellState; note?: string; row?: number }[];
  objects?: { id: string; label: string; value: string; state?: CellState; badge?: string }[];
  links?: { from: string; to: string; state?: Arrow["state"] }[];
  callout?: Scene["callout"];
}): Scene {
  return {
    regions: [
      stackRegion([{
        id: "main",
        label: "main()",
        state: "active",
        cells: opts.locals.map((l) => ({
          id: l.id,
          name: l.name,
          type: l.type,
          value: l.value,
          state: l.state ?? "idle",
          note: l.note,
          row: l.row ?? 0,
        })),
      }], "primitives hold their value directly"),
      ...(opts.objects?.length
        ? [heapRegion(
            opts.objects.map((o) => ({
              id: o.id,
              label: o.label,
              state: "active" as const,
              badge: o.badge,
              cells: [{ id: `${o.id}-val`, name: "value", value: o.value, state: o.state ?? "idle" }],
            })),
            "wrappers are objects",
          )]
        : []),
    ],
    arrows: (opts.links ?? []).map((l, i) => ({
      id: `link-${i}`,
      from: l.from,
      to: l.to,
      state: l.state ?? "idle",
    })),
    callout: opts.callout,
  };
}

export const primitivesAndWrappers: Lesson = {
  slug: "primitives-and-wrappers",
  track: "java",
  title: "Primitives & wrappers",
  tagline: "Eight types that hold values, and their object counterparts.",
  description:
    "See the eight Java primitives stored directly in the stack slot, watch an Integer wrapper allocate an object on the heap for the same value, and understand why generics require the object form.",
  difficulty: 1,
  minutes: 7,
  access: "free",
  language: "java",
  keywords: ["primitive", "wrapper", "Integer", "boxing", "stack vs heap", "generics"],
  stages: [
    {
      id: "int",
      title: "int: the value is in the slot",
      body: [
        "`int age = 25` puts the number 25 directly in the variable's stack slot. There is no object, no allocation, no heap involvement.",
        "This is what makes primitives fast — reading `age` is a single memory access, not a pointer dereference.",
      ],
      code: CODE,
      activeLines: [4],
      scene: scene({
        locals: [
          { id: "age", name: "age", type: "int", value: "25", state: "active", note: "4 bytes" },
        ],
        callout: { tone: "active", text: "No object. The value 25 is the entire content of the slot." },
      }),
    },
    {
      id: "four-prims",
      title: "All eight primitives work the same way",
      body: [
        "`double`, `boolean`, `char` — all eight primitive types store their value directly. The sizes vary (1 byte for boolean, 8 for double), but the principle is the same: no indirection.",
        "These are the only types in Java that are not objects. Everything else — every class, every array, every String — is a reference to a heap object.",
      ],
      code: CODE,
      activeLines: [4, 5, 6, 7],
      scene: scene({
        locals: [
          { id: "age2", name: "age", type: "int", value: "25", note: "4 bytes" },
          { id: "price", name: "price", type: "double", value: "9.99", note: "8 bytes" },
          { id: "ok", name: "ok", type: "boolean", value: "true", note: "1 byte" },
          { id: "grade", name: "grade", type: "char", value: "'A'", note: "2 bytes", state: "active" },
        ],
        callout: { tone: "info", text: "8 primitives, all stored by value. Everything else is a reference." },
      }),
    },
    {
      id: "wrapper",
      title: "Integer wraps int in an object",
      body: [
        "`Integer.valueOf(25)` allocates an object on the heap that contains the value 25. The variable `boxed` holds a reference to that object — not the number itself.",
        "The same 25 now costs more: the heap object has an object header (16 bytes typically), plus the 4-byte int field, plus the reference in the stack slot.",
      ],
      code: CODE,
      activeLines: [10],
      scene: scene({
        locals: [
          { id: "age3", name: "age", type: "int", value: "25" },
          { id: "boxed", name: "boxed", type: "Integer", value: "ref", state: "active", row: 1 },
        ],
        objects: [
          { id: "iobj", label: "Integer", value: "25", state: "active", badge: "~16 bytes overhead" },
        ],
        links: [{ from: "boxed", to: "iobj-val", state: "active" }],
        callout: { tone: "active", text: "Same value, wrapped in an object. The slot holds a reference, not the number." },
      }),
    },
    {
      id: "why",
      title: "Why wrappers exist: generics need objects",
      body: [
        "You cannot write `List<int>` — generics work with reference types only. So Java provides `Integer` as the object version of `int`, and `List<Integer>` works.",
        "Each primitive has a wrapper: `byte`→`Byte`, `short`→`Short`, `int`→`Integer`, `long`→`Long`, `float`→`Float`, `double`→`Double`, `char`→`Character`, `boolean`→`Boolean`.",
      ],
      code: CODE,
      activeLines: [22, 23],
      scene: scene({
        locals: [
          { id: "nums", name: "nums", type: "List<Integer>", value: "ref", state: "active", row: 1 },
        ],
        objects: [
          { id: "list", label: "ArrayList", value: "[42]", state: "active", badge: "holds Integer objects" },
        ],
        links: [{ from: "nums", to: "list-val", state: "active" }],
        callout: { tone: "active", text: "List<int> does not compile. List<Integer> does — because Integer is an object." },
      }),
    },
    {
      id: "cost",
      title: "The cost of wrapping",
      body: [
        "An `int` is 4 bytes on the stack. An `Integer` is a 4-byte reference on the stack plus a ~20-byte object on the heap. For one value, negligible. For a million in a list, substantial.",
        "This is why specialised collections (`IntStream`, Trove, Eclipse Collections) exist — they store `int` values directly, without wrapping each one.",
      ],
      code: CODE,
      activeLines: [4, 10],
      scene: scene({
        locals: [
          { id: "age4", name: "age", type: "int", value: "25", state: "success", note: "4 bytes total" },
          { id: "boxed2", name: "boxed", type: "Integer", value: "ref", note: "4 + ~20 bytes", row: 1 },
        ],
        objects: [
          { id: "iobj2", label: "Integer", value: "25", badge: "heap overhead" },
        ],
        links: [{ from: "boxed2", to: "iobj2-val" }],
        callout: {
          tone: "success",
          text: "Primitive = value, fast, no GC. Wrapper = object, flexible, costs memory. Pick by need.",
        },
      }),
    },
  ],
};
