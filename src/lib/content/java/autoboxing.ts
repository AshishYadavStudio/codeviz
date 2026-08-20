import type { Arrow, Cell, Frame, Lesson, Scene } from "@/lib/viz/types";
import { heapRegion, stackRegion, staticRegion } from "@/lib/viz/scene-helpers";

const CODE = `import java.util.ArrayList;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        int     p = 127;
        Integer a = 127;      // autoboxed from the cache
        Integer b = 127;      // same cached object
        System.out.println(a == b);    // true

        Integer c = 128;      // outside the cache
        Integer d = 128;      // a second object
        System.out.println(c == d);    // false!
        System.out.println(c.equals(d)); // true

        List<Integer> nums = new ArrayList<>();
        for (int i = 0; i < 3; i++) nums.add(i);  // boxes every time

        Integer maybe = null;
        int oops = maybe;     // NullPointerException on unboxing
    }
}`;

function scene(opts: {
  locals: { id: string; name: string; type: string; value: string; target?: string; state?: Cell["state"]; row?: number; note?: string }[];
  cached?: { id: string; value: string; state?: Cell["state"] }[];
  heapObjects?: { id: string; label: string; value: string; state?: Frame["state"] }[];
  callout?: Scene["callout"];
}): Scene {
  const cells: Cell[] = opts.locals.map((l) => ({
    id: l.id,
    name: l.name,
    type: l.type,
    value: l.value,
    state: l.state ?? "idle",
    note: l.note,
    row: l.row ?? 0,
  }));

  const arrows: Arrow[] = opts.locals
    .filter((l) => l.target)
    .map((l) => ({
      id: `${l.id}-arrow`,
      from: l.id,
      to: l.target!,
      state: l.state === "active" ? "active" : "idle",
    }));

  const regions = [
    stackRegion([{ id: "main", label: "main()", state: "active", cells }]),
  ];

  if (opts.heapObjects?.length) {
    regions.push(
      heapRegion(
        opts.heapObjects.map((o) => ({
          id: o.id,
          label: o.label,
          state: o.state ?? "active",
          badge: "new Integer — a distinct object",
          cells: [
            { id: `${o.id}-v`, name: "value", type: "int", value: o.value, state: "idle", row: 0 },
          ],
        })),
        "boxed objects outside the cache",
      ),
    );
  }

  if (opts.cached?.length) {
    regions.push(
      staticRegion(
        [
          {
            id: "cache",
            label: "Integer cache · −128 … 127",
            state: "idle",
            badge: "created once, shared by everything",
            cells: opts.cached.map((c) => ({
              id: c.id,
              name: c.value,
              value: c.value,
              state: c.state ?? "idle",
              row: 0,
            })),
          },
        ],
        "preallocated by the JVM",
      ),
    );
  }

  return { regions, arrows, callout: opts.callout };
}

export const autoboxing: Lesson = {
  slug: "autoboxing",
  track: "java",
  title: "Autoboxing & the Integer cache",
  tagline: "int is a value. Integer is an object. Java hides the conversion, and that is exactly the problem.",
  description:
    "See what autoboxing allocates, why Integer 127 == 127 is true while 128 == 128 is false, and how unboxing a null throws a NullPointerException on a line with no dot in it.",
  difficulty: 2,
  minutes: 9,
  access: "free",
  language: "java",
  keywords: ["autoboxing", "Integer cache", "unboxing", "NullPointerException", "== vs equals"],
  stages: [
    {
      id: "primitive",
      title: "int and Integer are not the same thing",
      body: [
        "`int p = 127` stores the number directly in the variable's slot — 4 bytes, no object.",
        "`Integer` is a class. A variable of that type holds a *reference* to an object on the heap that wraps the number, costing an object header plus the value.",
      ],
      code: CODE,
      activeLines: [6],
      scene: scene({
        locals: [{ id: "p", name: "p", type: "int", value: "127", state: "active" }],
        callout: { tone: "info", text: "Generics cannot hold primitives, which is why List<Integer> exists at all." },
      }),
    },
    {
      id: "box-cached",
      title: "Integer a = 127 quietly calls Integer.valueOf",
      body: [
        "The compiler rewrites this as `Integer.valueOf(127)`. That method does not always allocate: values from −128 to 127 come from a cache the JVM builds at startup.",
        "So `a` refers to a shared, preexisting object rather than a fresh one.",
      ],
      code: CODE,
      activeLines: [7],
      scene: scene({
        locals: [
          { id: "p", name: "p", type: "int", value: "127" },
          { id: "a", name: "a", type: "Integer", value: "→ cache[255]", target: "cache-127", state: "active", row: 1 },
        ],
        cached: [
          { id: "cache-126", value: "126" },
          { id: "cache-127", value: "127", state: "active" },
        ],
        callout: { tone: "active", text: "No allocation. The cache exists because small integers dominate real programs." },
      }),
    },
    {
      id: "same-object",
      title: "a == b is true, by accident of the cache",
      body: [
        "`Integer b = 127` hits the same cache entry, so both variables hold the identical reference and `==` reports `true`.",
        "This looks like value comparison working correctly. It is not — it is reference comparison that happens to agree.",
      ],
      code: CODE,
      activeLines: [8, 9],
      scene: scene({
        locals: [
          { id: "a", name: "a", type: "Integer", value: "→ cache[255]", target: "cache-127" },
          { id: "b", name: "b", type: "Integer", value: "→ cache[255]", target: "cache-127", state: "active", row: 1 },
        ],
        cached: [
          { id: "cache-126", value: "126" },
          { id: "cache-127", value: "127", state: "active" },
        ],
        callout: { tone: "success", text: "Two references, one cached object. == is true." },
      }),
    },
    {
      id: "outside-cache",
      title: "Integer c = 128 allocates — and == breaks",
      body: [
        "128 is one past the top of the cache, so `valueOf` allocates a new object. `Integer d = 128` allocates *another*.",
        "Now `c == d` is `false`, even though both hold 128. The same expression that worked a line earlier now silently gives the wrong answer.",
      ],
      code: CODE,
      activeLines: [11, 12, 13],
      scene: scene({
        locals: [
          { id: "c", name: "c", type: "Integer", value: "→ 0x7b40", target: "obj1-v", state: "active" },
          { id: "d", name: "d", type: "Integer", value: "→ 0x7b60", target: "obj2-v", state: "active", row: 1 },
        ],
        heapObjects: [
          { id: "obj1", label: "Integer @0x7b40", value: "128" },
          { id: "obj2", label: "Integer @0x7b60", value: "128" },
        ],
        callout: {
          tone: "danger",
          text: "A boundary at 127 that appears nowhere in your code. This bug survives testing because test data is small.",
        },
      }),
    },
    {
      id: "equals",
      title: "equals() was always the right question",
      body: [
        "`c.equals(d)` compares the wrapped values and returns `true` for any magnitude.",
        "The rule is simple: never use `==` on boxed types. Compare with `equals`, or unbox deliberately by declaring the variables `int`.",
      ],
      code: CODE,
      activeLines: [14],
      scene: scene({
        locals: [
          { id: "c", name: "c", type: "Integer", value: "→ 0x7b40", target: "obj1-v", state: "read" },
          { id: "d", name: "d", type: "Integer", value: "→ 0x7b60", target: "obj2-v", state: "read", row: 1 },
        ],
        heapObjects: [
          { id: "obj1", label: "Integer @0x7b40", value: "128", state: "idle" },
          { id: "obj2", label: "Integer @0x7b60", value: "128", state: "idle" },
        ],
        callout: { tone: "success", text: "Different objects, equal values. equals() reports what you meant." },
      }),
    },
    {
      id: "cost",
      title: "Boxing in a loop allocates in a loop",
      body: [
        "`nums.add(i)` boxes each `int` into an `Integer` before storing it, because a collection can only hold references.",
        "Beyond the cache range, that is one heap allocation per iteration. A `List<Integer>` of a million values costs far more memory than an `int[]` of the same length — a header and a reference per element, scattered across the heap instead of packed.",
      ],
      code: CODE,
      activeLines: [16, 17],
      scene: scene({
        locals: [
          { id: "nums", name: "nums", type: "List<Integer>", value: "→ ArrayList", state: "read" },
        ],
        heapObjects: [
          { id: "obj1", label: "Integer", value: "0" },
          { id: "obj2", label: "Integer", value: "1" },
        ],
        callout: {
          tone: "info",
          text: "Use int[] or IntStream for hot numeric paths. Use List<Integer> when you need the collections API.",
        },
      }),
    },
    {
      id: "null",
      title: "Unboxing null throws",
      body: [
        "`int oops = maybe` compiles to `maybe.intValue()`. If `maybe` is null, that is a method call on null — a `NullPointerException` on a line containing no visible dot.",
        "This is the sharpest edge of autoboxing: the conversion is invisible, so the failure looks like it comes from nowhere. It bites hardest with map lookups, where `get` returns null for a missing key.",
      ],
      code: CODE,
      activeLines: [19, 20],
      scene: scene({
        locals: [
          { id: "maybe", name: "maybe", type: "Integer", value: "null", state: "danger" },
          { id: "oops", name: "oops", type: "int", value: "—", state: "danger", row: 1, note: "NPE before assignment" },
        ],
        callout: {
          tone: "danger",
          text: "A primitive cannot represent null. Every implicit unboxing is a null check you did not write.",
        },
      }),
    },
  ],
};
