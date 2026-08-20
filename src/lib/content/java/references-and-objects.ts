import type { Arrow, Cell, Frame, Lesson, Scene } from "@/lib/viz/types";
import { heapRegion, stackRegion } from "@/lib/viz/scene-helpers";

const P1 = "0x7a1c40";
const P2 = "0x7a1c60";

const CODE = `public class Main {
    static void rename(Point p) {
        p.x = 99;          // changes the caller's object
        p = new Point(0);  // rebinds the local copy only
    }

    public static void main(String[] args) {
        int    n = 10;
        Point  a = new Point(1);
        Point  b = a;      // copies the reference, not the object

        b.x = 42;          // a.x is now 42 too
        rename(a);

        Point  c = null;   // refers to nothing
    }
}`;

function scene(opts: {
  locals: { id: string; name: string; type: string; value: string; state?: Cell["state"]; row?: number; note?: string }[];
  objects: { id: string; label: string; x: string; state?: Frame["state"]; badge?: string }[];
  links: { from: string; to: string; state?: Arrow["state"]; label?: string }[];
  frames?: Frame[];
  callout?: Scene["callout"];
}): Scene {
  const stackFrames: Frame[] = [
    {
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
    },
    ...(opts.frames ?? []),
  ];

  return {
    regions: [
      stackRegion(stackFrames, "locals — one slot per variable"),
      heapRegion(
        opts.objects.map((o) => ({
          id: o.id,
          label: o.label,
          state: o.state ?? "active",
          badge: o.badge,
          cells: [
            { id: `${o.id}-x`, name: "x", type: "int", value: o.x, state: "idle", row: 0 },
          ],
        })),
        "every object lives here, always",
      ),
    ],
    arrows: opts.links.map((l, i) => ({
      id: `link-${i}`,
      from: l.from,
      to: l.to,
      state: l.state ?? "idle",
      label: l.label,
    })),
    callout: opts.callout,
  };
}

export const referencesAndObjects: Lesson = {
  slug: "references-and-objects",
  track: "java",
  title: "References vs objects",
  tagline: "The variable is never the object. It is a handle, and handles can be copied.",
  description:
    "See why two Java variables can change the same object, what null really is, and why 'Java is pass by value' is true even though methods can modify your objects.",
  difficulty: 1,
  minutes: 9,
  access: "free",
  language: "java",
  keywords: ["java references", "pass by value", "heap", "null", "object identity"],
  stages: [
    {
      id: "primitive",
      title: "A primitive holds its value directly",
      body: [
        "`int n = 10` puts the number 10 in the variable's slot. There is no object anywhere, and nothing on the heap.",
        "The eight primitive types — `int`, `long`, `double`, `boolean` and the rest — work this way. Everything else in Java does not.",
      ],
      code: CODE,
      activeLines: [8],
      scene: scene({
        locals: [{ id: "n", name: "n", type: "int", value: "10", state: "active" }],
        objects: [],
        links: [],
        callout: { tone: "active", text: "The value is in the slot. Copying n copies the 10." },
      }),
    },
    {
      id: "new",
      title: "new puts the object on the heap",
      body: [
        "`new Point(1)` allocates a `Point` on the heap and returns a reference to it. The local `a` stores that reference — not the object.",
        "This is the split that explains almost every Java surprise: the variable is on the stack, the object is somewhere else entirely.",
      ],
      code: CODE,
      activeLines: [9],
      scene: scene({
        locals: [
          { id: "n", name: "n", type: "int", value: "10" },
          { id: "a", name: "a", type: "Point", value: P1, state: "active", row: 1 },
        ],
        objects: [{ id: "obj1", label: "Point @0x7a1c40", x: "1" }],
        links: [{ from: "a", to: "obj1-x", state: "active", label: "a" }],
        callout: { tone: "active", text: "a holds a reference. The object it refers to is not inside a." },
      }),
    },
    {
      id: "alias",
      title: "Point b = a copies the reference",
      body: [
        "No second object is created. `b` gets its own slot holding the *same* reference, so both names now lead to one object.",
        "Java has no syntax for copying an object implicitly. If you want a second `Point`, you have to say `new` again.",
      ],
      code: CODE,
      activeLines: [10],
      scene: scene({
        locals: [
          { id: "n", name: "n", type: "int", value: "10" },
          { id: "a", name: "a", type: "Point", value: P1, row: 1 },
          { id: "b", name: "b", type: "Point", value: P1, state: "active", row: 1 },
        ],
        objects: [{ id: "obj1", label: "Point @0x7a1c40", x: "1", badge: "2 references" }],
        links: [
          { from: "a", to: "obj1-x" },
          { from: "b", to: "obj1-x", state: "active", label: "b" },
        ],
        callout: { tone: "active", text: "Two variables, two slots, one object. Both hold the same number." },
      }),
    },
    {
      id: "aliasing",
      title: "b.x = 42 changes what a sees",
      body: [
        "The write goes through the reference to the single object on the heap. Reading `a.x` afterwards gives 42, even though `a` was never mentioned.",
        "This is aliasing. It is not a bug in Java — it is the direct consequence of `b = a` copying a handle rather than the thing itself.",
      ],
      code: CODE,
      activeLines: [12],
      scene: scene({
        locals: [
          { id: "n", name: "n", type: "int", value: "10" },
          { id: "a", name: "a", type: "Point", value: P1, row: 1 },
          { id: "b", name: "b", type: "Point", value: P1, state: "read", row: 1 },
        ],
        objects: [{ id: "obj1", label: "Point @0x7a1c40", x: "42", state: "active", badge: "mutated" }],
        links: [{ from: "a", to: "obj1-x" }, { from: "b", to: "obj1-x", state: "active", label: "x = 42" }],
        callout: {
          tone: "danger",
          text: "If you need an independent copy, write a copy constructor or use an immutable type. Assignment will never give you one.",
        },
      }),
    },
    {
      id: "pass",
      title: "Arguments are references, passed by value",
      body: [
        "`rename(a)` copies the *reference* into the parameter `p`. Both `a` and `p` now refer to the same object, so `p.x = 99` is visible to the caller.",
        "This is why the phrase confuses people. Java is strictly pass-by-value — but the value being passed is a reference.",
      ],
      code: CODE,
      activeLines: [13, 3],
      scene: scene({
        locals: [
          { id: "n", name: "n", type: "int", value: "10" },
          { id: "a", name: "a", type: "Point", value: P1, row: 1 },
          { id: "b", name: "b", type: "Point", value: P1, row: 1 },
        ],
        frames: [
          {
            id: "rename",
            label: "rename(Point p)",
            state: "active",
            cells: [
              { id: "p", name: "p", type: "Point", value: P1, state: "active", row: 0 },
            ],
          },
        ],
        objects: [{ id: "obj1", label: "Point @0x7a1c40", x: "99", state: "active" }],
        links: [
          { from: "a", to: "obj1-x" },
          { from: "p", to: "obj1-x", state: "active", label: "p.x = 99" },
        ],
        callout: { tone: "active", text: "The method reached your object because it was handed the same reference." },
      }),
    },
    {
      id: "rebind",
      title: "But reassigning the parameter changes nothing",
      body: [
        "`p = new Point(0)` allocates a new object and puts its reference in `p`'s slot. `a` is untouched — it still holds the original reference.",
        "That is the proof that Java is pass-by-value. If references were passed by reference, this line would have redirected the caller's variable too.",
      ],
      code: CODE,
      activeLines: [4],
      scene: scene({
        locals: [
          { id: "n", name: "n", type: "int", value: "10" },
          { id: "a", name: "a", type: "Point", value: P1, state: "success", row: 1 },
          { id: "b", name: "b", type: "Point", value: P1, row: 1 },
        ],
        frames: [
          {
            id: "rename",
            label: "rename(Point p)",
            state: "active",
            cells: [{ id: "p", name: "p", type: "Point", value: P2, state: "active", row: 0 }],
          },
        ],
        objects: [
          { id: "obj1", label: "Point @0x7a1c40", x: "99" },
          { id: "obj2", label: "Point @0x7a1c60", x: "0", badge: "unreachable when rename returns" },
        ],
        links: [
          { from: "a", to: "obj1-x" },
          { from: "p", to: "obj2-x", state: "active" },
        ],
        callout: {
          tone: "info",
          text: "A method can change your object's contents. It can never change which object your variable points at.",
        },
      }),
    },
    {
      id: "null",
      title: "null is a reference to nothing",
      body: [
        "`Point c = null` gives `c` a slot holding the absence of a reference. It is not an object, and it is not zero-the-object — it is the explicit \"points nowhere\" value.",
        "Every field access through it throws `NullPointerException` at that exact line, which is why the exception is a stack trace pointing straight at the bug rather than silent corruption.",
      ],
      code: CODE,
      activeLines: [16],
      scene: scene({
        locals: [
          { id: "a", name: "a", type: "Point", value: P1 },
          { id: "c", name: "c", type: "Point", value: "null", state: "danger", row: 1 },
        ],
        objects: [{ id: "obj1", label: "Point @0x7a1c40", x: "99" }],
        links: [{ from: "a", to: "obj1-x" }],
        callout: {
          tone: "success",
          text: "Primitives hold values. Everything else holds references. Once that split is clear, most Java behaviour follows.",
        },
      }),
    },
  ],
};
