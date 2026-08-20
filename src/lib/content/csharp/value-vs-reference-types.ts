import type { Arrow, Cell, Frame, Lesson, Scene } from "@/lib/viz/types";
import { heapRegion, stackRegion } from "@/lib/viz/scene-helpers";

const CODE = `struct PointS { public int X; }      // value type
class  PointC { public int X; }      // reference type

static void Mutate(PointS s, PointC c) {
    s.X = 99;   // changes a copy
    c.X = 99;   // changes the caller's object
}

static void Main() {
    PointS a = new PointS { X = 1 };
    PointS b = a;          // full copy
    b.X = 42;              // a.X is still 1

    PointC p = new PointC { X = 1 };
    PointC q = p;          // copies the reference
    q.X = 42;              // p.X is now 42 too

    Mutate(a, p);
}`;

function scene(opts: {
  locals: { id: string; name: string; type: string; value: string; target?: string; state?: Cell["state"]; row?: number; note?: string }[];
  objects?: { id: string; label: string; x: string; state?: Frame["state"]; badge?: string }[];
  frames?: Frame[];
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

  return {
    regions: [
      stackRegion(
        [{ id: "main", label: "Main()", state: "active", cells }, ...(opts.frames ?? [])],
        "value types live here in full",
      ),
      ...(opts.objects?.length
        ? [
            heapRegion(
              opts.objects.map((o) => ({
                id: o.id,
                label: o.label,
                state: o.state ?? "active",
                badge: o.badge,
                cells: [
                  { id: `${o.id}-x`, name: "X", type: "int", value: o.x, state: "idle", row: 0 },
                ],
              })),
              "class instances, always",
            ),
          ]
        : []),
    ],
    arrows,
    callout: opts.callout,
  };
}

export const valueVsReferenceTypes: Lesson = {
  slug: "value-vs-reference-types",
  track: "csharp",
  title: "struct vs class",
  tagline: "One keyword decides whether assignment copies the data or just the handle.",
  description:
    "See why changing a copied struct leaves the original alone while a copied class reference does not, and what that means for method parameters.",
  difficulty: 1,
  minutes: 8,
  access: "free",
  language: "csharp",
  filename: "Program.cs",
  keywords: ["struct vs class", "value type", "reference type", "c# memory", "pass by value"],
  stages: [
    {
      id: "struct",
      title: "A struct variable holds the data itself",
      body: [
        "`PointS a` is not a reference to anything. The `int X` lives directly inside `a`'s slot on the stack.",
        "There is no heap allocation and no indirection — the variable *is* the value.",
      ],
      code: CODE,
      activeLines: [11],
      scene: scene({
        locals: [{ id: "a", name: "a", type: "PointS", value: "X = 1", state: "active" }],
        callout: { tone: "active", text: "int, double, bool, DateTime and every struct you write work this way." },
      }),
    },
    {
      id: "struct-copy",
      title: "Assigning a struct copies every field",
      body: [
        "`PointS b = a` duplicates the contents into a second, independent slot. Two separate values now exist.",
        "So `b.X = 42` cannot possibly affect `a`. They share nothing.",
      ],
      code: CODE,
      activeLines: [12, 13],
      scene: scene({
        locals: [
          { id: "a", name: "a", type: "PointS", value: "X = 1", state: "success" },
          { id: "b", name: "b", type: "PointS", value: "X = 42", state: "active", row: 1 },
        ],
        callout: { tone: "success", text: "a.X is still 1. A struct assignment is a memcpy of the fields." },
      }),
    },
    {
      id: "class",
      title: "A class variable holds a reference",
      body: [
        "`new PointC()` allocates the object on the heap. The variable `p` stores only its address.",
        "This is the same split as Java: the variable is on the stack, the object is somewhere else.",
      ],
      code: CODE,
      activeLines: [15],
      scene: scene({
        locals: [
          { id: "a", name: "a", type: "PointS", value: "X = 1" },
          { id: "p", name: "p", type: "PointC", value: "→ 0x7b40", target: "obj-x", state: "active", row: 1 },
        ],
        objects: [{ id: "obj", label: "PointC @0x7b40", x: "1" }],
        callout: { tone: "active", text: "The object is not inside p. p only knows where to find it." },
      }),
    },
    {
      id: "class-copy",
      title: "Assigning a class copies only the reference",
      body: [
        "`PointC q = p` creates a second variable holding the same address. No new object is created.",
        "`q.X = 42` therefore changes the one object both names point at — and `p.X` reads 42.",
      ],
      code: CODE,
      activeLines: [16, 17],
      scene: scene({
        locals: [
          { id: "p", name: "p", type: "PointC", value: "→ 0x7b40", target: "obj-x" },
          { id: "q", name: "q", type: "PointC", value: "→ 0x7b40", target: "obj-x", state: "active", row: 1 },
        ],
        objects: [{ id: "obj", label: "PointC @0x7b40", x: "42", state: "active", badge: "2 references" }],
        callout: {
          tone: "danger",
          text: "Identical syntax, opposite behaviour. Only the declaration of the type tells you which you are getting.",
        },
      }),
    },
    {
      id: "parameters",
      title: "The same rule applies to arguments",
      body: [
        "`Mutate(a, p)` copies both arguments. For the struct that means copying the whole value, so `s.X = 99` writes to a copy that vanishes when the method returns.",
        "For the class it means copying the reference, so `c.X = 99` reaches the caller's object.",
      ],
      code: CODE,
      activeLines: [19, 4, 5, 6],
      scene: scene({
        locals: [
          { id: "a", name: "a", type: "PointS", value: "X = 1", state: "success" },
          { id: "p", name: "p", type: "PointC", value: "→ 0x7b40", target: "obj-x", row: 1 },
        ],
        frames: [
          {
            id: "mutate",
            label: "Mutate(s, c)",
            state: "active",
            cells: [
              { id: "s", name: "s", type: "PointS", value: "X = 99", state: "active", note: "a copy — discarded on return", row: 0 },
              { id: "c", name: "c", type: "PointC", value: "→ 0x7b40", state: "read", row: 0 },
            ],
          },
        ],
        objects: [{ id: "obj", label: "PointC @0x7b40", x: "99", state: "active" }],
        callout: {
          tone: "active",
          text: "a.X is untouched at 1. p.X is now 99. One call, two different outcomes.",
        },
      }),
    },
    {
      id: "when",
      title: "Which to reach for",
      body: [
        "Use a `class` by default. Use a `struct` when the type is small, logically a single value, and immutable — a point, a money amount, a timestamp.",
        "Structs avoid heap allocation and garbage-collection pressure, but every assignment and every method call copies them, so a large struct is slower than a class, not faster.",
        "Make structs `readonly` if you write them at all. A *mutable* struct is a well-known source of bugs, because you frequently end up modifying a copy you did not realise you had.",
      ],
      code: CODE,
      activeLines: [1, 2],
      scene: scene({
        locals: [
          { id: "a", name: "a", type: "PointS", value: "X = 1", state: "success" },
          { id: "p", name: "p", type: "PointC", value: "→ 0x7b40", target: "obj-x", row: 1 },
        ],
        objects: [{ id: "obj", label: "PointC @0x7b40", x: "99" }],
        callout: {
          tone: "success",
          text: "class for identity and behaviour; readonly struct for small values. Never a mutable struct.",
        },
      }),
    },
  ],
};
