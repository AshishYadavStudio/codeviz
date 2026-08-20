import type { Arrow, Cell, Frame, Lesson, Scene } from "@/lib/viz/types";
import { heapRegion, stackRegion } from "@/lib/viz/scene-helpers";

const CODE = `int i = 42;

object boxed = i;        // box: copy onto the heap
int back = (int)boxed;   // unbox: copy back, with a type check

i = 7;                   // the box still holds 42

var list = new ArrayList();
list.Add(1);             // boxes every element

var typed = new List<int>();
typed.Add(1);            // no boxing — generics keep it a value

object o = "text";
int bad = (int)o;        // InvalidCastException`;

function scene(opts: {
  locals: { id: string; name: string; type: string; value: string; target?: string; state?: Cell["state"]; row?: number; note?: string }[];
  boxes?: { id: string; label: string; value: string; state?: Frame["state"]; badge?: string }[];
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
      id: `${l.id}-a`,
      from: l.id,
      to: l.target!,
      state: l.state === "active" ? "active" : "idle",
    }));

  return {
    regions: [
      stackRegion([{ id: "main", label: "Main()", state: "active", cells }]),
      ...(opts.boxes?.length
        ? [
            heapRegion(
              opts.boxes.map((b) => ({
                id: b.id,
                label: b.label,
                state: b.state ?? "active",
                badge: b.badge ?? "object header + the value",
                cells: [
                  { id: `${b.id}-v`, name: "value", value: b.value, state: "idle", row: 0 },
                ],
              })),
              "boxes — heap allocations you did not write",
            ),
          ]
        : []),
    ],
    arrows,
    callout: opts.callout,
  };
}

export const boxing: Lesson = {
  slug: "boxing-and-unboxing",
  track: "csharp",
  title: "Boxing & unboxing",
  tagline: "Assigning an int to an object allocates. The syntax gives no hint that it happened.",
  description:
    "Watch a value type get copied onto the heap inside a box, see why the box does not track later changes, and why generics exist to avoid all of it.",
  difficulty: 2,
  minutes: 8,
  access: "free",
  language: "csharp",
  filename: "Program.cs",
  keywords: ["boxing", "unboxing", "object", "generics", "InvalidCastException", "c# performance"],
  intro: [
    "In C#, an `int` is a value type. But `object` is a reference type. So what happens when you assign an int to an object variable? The runtime wraps the int in a heap-allocated box — this is **boxing**.",
    "It's easy to miss. `object o = 42` looks free. It isn't — that one line allocates a small heap object, copies the 42 into it, and stores a reference. Do this in a tight loop and you've made a real problem.",
    "This lesson watches an int get boxed on assignment, unboxed back on cast, and shows why generics (`List<int>`) exist to avoid this whole dance.",
  ],
  stages: [
    {
      id: "value",
      title: "An int is 4 bytes in place",
      body: [
        "`int i = 42` stores the number directly in the local's slot. No allocation, no header, no indirection.",
        "That is the whole point of a value type — and exactly what gets lost in the next line.",
      ],
      code: CODE,
      activeLines: [1],
      scene: scene({
        locals: [{ id: "i", name: "i", type: "int", value: "42", state: "active" }],
        callout: { tone: "info", text: "Every struct in C# starts out like this: the value, in place." },
      }),
    },
    {
      id: "box",
      title: "object boxed = i allocates",
      body: [
        "`object` is a reference type, so the value cannot be stored in it directly. The runtime allocates a small heap object, **copies** the 42 into it, and stores the reference.",
        "There is no `new` on this line. The allocation is entirely implicit — which is why boxing is easy to do accidentally.",
      ],
      code: CODE,
      activeLines: [3],
      scene: scene({
        locals: [
          { id: "i", name: "i", type: "int", value: "42" },
          { id: "boxed", name: "boxed", type: "object", value: "→ 0x7b40", target: "box1-v", state: "active", row: 1 },
        ],
        boxes: [{ id: "box1", label: "boxed int @0x7b40", value: "42" }],
        callout: { tone: "active", text: "One heap allocation, plus GC pressure later. From an assignment." },
      }),
    },
    {
      id: "copy",
      title: "The box holds a copy, not a link",
      body: [
        "Changing `i` to 7 does not touch the box. It still holds 42, because boxing copied the value rather than referring to the variable.",
        "This trips people who expect reference-like behaviour once something is `object`. The box is a snapshot taken at the moment of boxing.",
      ],
      code: CODE,
      activeLines: [6],
      scene: scene({
        locals: [
          { id: "i", name: "i", type: "int", value: "7", state: "written" },
          { id: "boxed", name: "boxed", type: "object", value: "→ 0x7b40", target: "box1-v", row: 1 },
        ],
        boxes: [{ id: "box1", label: "boxed int @0x7b40", value: "42", badge: "still 42" }],
        callout: { tone: "info", text: "Two independent copies of a number that used to be one." },
      }),
    },
    {
      id: "unbox",
      title: "Unboxing checks the type, then copies back",
      body: [
        "`(int)boxed` verifies at runtime that the box really contains an `int`, then copies the value into the new local.",
        "The check is not free, and neither is the copy — but it is what makes the cast safe.",
      ],
      code: CODE,
      activeLines: [4],
      scene: scene({
        locals: [
          { id: "boxed", name: "boxed", type: "object", value: "→ 0x7b40", target: "box1-v", state: "read" },
          { id: "back", name: "back", type: "int", value: "42", state: "success", row: 1 },
        ],
        boxes: [{ id: "box1", label: "boxed int @0x7b40", value: "42" }],
        callout: { tone: "success", text: "Round trip complete: heap allocation, type check, and two copies." },
      }),
    },
    {
      id: "wrong-type",
      title: "The cast must match exactly",
      body: [
        "Unboxing is not a conversion. A box containing a `string` cannot be unboxed to `int`, and a box containing a `long` cannot be unboxed to `int` either — even though the value would fit.",
        "The result is an `InvalidCastException` at runtime, not a compile error. Use `is` or `as` when the type is uncertain.",
      ],
      code: CODE,
      activeLines: [14, 15],
      scene: scene({
        locals: [
          { id: "o", name: "o", type: "object", value: "→ 0x7b80", target: "box2-v", state: "read" },
          { id: "bad", name: "bad", type: "int", value: "—", state: "danger", row: 1, note: "InvalidCastException" },
        ],
        boxes: [{ id: "box2", label: "string @0x7b80", value: '"text"', state: "idle", badge: "not an int" }],
        callout: { tone: "danger", text: "Prefer `if (o is int n)` — it checks and unboxes in one step, with no exception." },
      }),
    },
    {
      id: "collections",
      title: "The reason generics were added",
      body: [
        "`ArrayList` stores `object`, so every `int` you add is boxed — an allocation per element, and an unbox with a type check on every read.",
        "`List<int>` stores actual `int`s in an `int[]`. No boxing, no per-element allocation, and the values sit contiguously so the CPU cache works for you.",
        "For a million integers that is the difference between one array and a million small heap objects.",
      ],
      code: CODE,
      activeLines: [8, 9, 11, 12],
      scene: scene({
        locals: [
          { id: "list", name: "list", type: "ArrayList", value: "→ object[]", state: "danger" },
          { id: "typed", name: "typed", type: "List<int>", value: "→ int[]", state: "success", row: 1 },
        ],
        boxes: [{ id: "box1", label: "boxed int", value: "1", badge: "one per element added" }],
        callout: {
          tone: "success",
          text: "Never use the non-generic collections in new code. This is what they cost.",
        },
      }),
    },
    {
      id: "hidden",
      title: "Where boxing hides",
      body: [
        "It also happens when a struct is passed as an `object` parameter, when a value type is used through a non-generic interface, and in older string formatting paths.",
        "`string.Format(\"{0}\", 42)` boxes; `$\"{42}\"` in modern .NET does not. Calling an interface method on a struct through the interface type boxes it too.",
        "The fix is almost always the same: keep the static type concrete or generic, so the compiler never needs a reference-typed slot.",
      ],
      code: CODE,
      activeLines: [3, 9],
      scene: scene({
        locals: [
          { id: "typed", name: "typed", type: "List<int>", value: "→ int[]", state: "success" },
        ],
        callout: {
          tone: "success",
          text: "Boxing is not a bug — it is how one type system spans values and references. It is only a problem in a loop.",
        },
      }),
    },
  ],
};
