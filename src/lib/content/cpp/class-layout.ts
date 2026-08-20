import type { Arrow, CellState, Lesson, Scene } from "@/lib/viz/types";
import { heapRegion, stackRegion } from "@/lib/viz/scene-helpers";

const CODE = `class Point {
    int x;
    int y;
public:
    Point(int x, int y) : x(x), y(y) {}

    double length() const {
        return sqrt(x*x + y*y);
    }

    void set(int nx, int ny) {
        this->x = nx;
        this->y = ny;
    }
};

// sizeof(Point) == 8: two ints, no hidden fields
Point a(3, 4);
Point b(1, 2);
a.length();   // compiler passes &a as 'this'
b.length();   // compiler passes &b as 'this'`;

function scene(opts: {
  objects: { id: string; label: string; x: string; y: string; state?: CellState; badge?: string }[];
  thisPtr?: { from: string; to: string };
  onStack?: boolean;
  callout?: Scene["callout"];
}): Scene {
  const frames = opts.objects.map((o) => ({
    id: o.id,
    label: o.label,
    state: (o.state === "active" ? "active" : "idle") as "active" | "idle",
    badge: o.badge,
    cells: [
      { id: `${o.id}-x`, name: "x", type: "int", value: o.x, state: o.state ?? ("idle" as CellState) },
      { id: `${o.id}-y`, name: "y", type: "int", value: o.y, state: o.state ?? ("idle" as CellState) },
    ],
  }));

  const arrows: Arrow[] = opts.thisPtr
    ? [{ id: "this-ptr", from: opts.thisPtr.from, to: opts.thisPtr.to, state: "active" as const }]
    : [];

  return {
    regions: [
      opts.onStack
        ? stackRegion(frames, "objects laid out like structs")
        : heapRegion(frames, "methods are NOT stored in the object"),
    ],
    arrows,
    callout: opts.callout,
  };
}

export const classLayout: Lesson = {
  slug: "class-layout",
  track: "cpp",
  title: "Class layout & this",
  tagline: "Members laid out like a struct; methods take a hidden `this` pointer.",
  description:
    "See that a C++ class object in memory is just its data members with no methods attached, that sizeof reports only the data, and that member functions receive a hidden this pointer the compiler inserts.",
  difficulty: 2,
  minutes: 8,
  access: "free",
  language: "cpp",
  keywords: ["class layout", "this pointer", "sizeof", "member function", "object model"],
  stages: [
    {
      id: "layout",
      title: "A class is a struct with access control",
      body: [
        "`Point` has two `int` members: `x` and `y`. In memory, the object is 8 bytes — exactly like a C struct with two ints. No methods are stored inside it.",
        "`class` and `struct` produce the same layout. The only difference is that `class` members default to private and `struct` members default to public.",
      ],
      code: CODE,
      activeLines: [1, 2, 3],
      scene: scene({
        objects: [
          { id: "a", label: "Point a (8 bytes)", x: "3", y: "4", state: "active", badge: "sizeof = 8" },
        ],
        onStack: true,
        callout: { tone: "info", text: "Two ints, 4 bytes each = 8 bytes total. No method table, no overhead." },
      }),
    },
    {
      id: "two-objects",
      title: "Two objects, two copies of the data",
      body: [
        "Each object has its own `x` and `y`. The data is duplicated — that is the point of separate objects.",
        "But the methods `length()` and `set()` exist only once in the program's code segment. They are shared by every `Point`, not copied per object.",
      ],
      code: CODE,
      activeLines: [15, 16],
      scene: scene({
        objects: [
          { id: "a", label: "Point a", x: "3", y: "4" },
          { id: "b", label: "Point b", x: "1", y: "2", state: "active" },
        ],
        onStack: true,
        callout: { tone: "active", text: "Data per object. Code shared across all objects." },
      }),
    },
    {
      id: "this-a",
      title: "a.length() passes &a as this",
      body: [
        "When you write `a.length()`, the compiler rewrites it to something like `Point::length(&a)`. The address of `a` is passed as a hidden first parameter called `this`.",
        "Inside `length()`, `x` means `this->x` — the compiler uses the `this` pointer to find the correct object's data.",
      ],
      code: CODE,
      activeLines: [17],
      scene: scene({
        objects: [
          { id: "a", label: "Point a", x: "3", y: "4", state: "active" },
          { id: "b", label: "Point b", x: "1", y: "2" },
        ],
        onStack: true,
        thisPtr: { from: "a-x", to: "a-x" },
        callout: { tone: "active", text: "a.length() → Point::length(&a). The this pointer is how the method finds its data." },
      }),
    },
    {
      id: "this-b",
      title: "b.length() passes &b as this",
      body: [
        "Same function, different `this`. The machine code for `length()` is identical — the only thing that changes between calls is the address passed in.",
        "This is the entire object model at the machine level: data per instance, code shared, and a pointer connecting them.",
      ],
      code: CODE,
      activeLines: [18],
      scene: scene({
        objects: [
          { id: "a", label: "Point a", x: "3", y: "4" },
          { id: "b", label: "Point b", x: "1", y: "2", state: "active" },
        ],
        onStack: true,
        thisPtr: { from: "b-x", to: "b-x" },
        callout: { tone: "active", text: "b.length() → Point::length(&b). Same code, different this." },
      }),
    },
    {
      id: "explicit-this",
      title: "this-> is usually implicit",
      body: [
        "Inside `set()`, `this->x = nx` is written explicitly to show what is happening. But `x = nx` does the same thing — the compiler inserts `this->` automatically.",
        "You only need to write `this->` explicitly when a parameter name shadows a member name, or when you need to return `*this` for chaining.",
      ],
      code: CODE,
      activeLines: [10, 11],
      scene: scene({
        objects: [
          { id: "a2", label: "Point a", x: "99", y: "88", state: "active", badge: "set(99, 88)" },
        ],
        onStack: true,
        callout: { tone: "info", text: "this->x and x mean the same thing inside a member function." },
      }),
    },
    {
      id: "recap",
      title: "The object model is simple",
      body: [
        "An object is its data members, laid out contiguously. Methods are ordinary functions with a hidden `this` parameter. `sizeof` counts only the data.",
        "This changes when you add `virtual` methods — then the object gains a hidden pointer to a vtable. But non-virtual classes carry no runtime overhead beyond the data itself.",
      ],
      code: CODE,
      activeLines: [14],
      scene: scene({
        objects: [
          { id: "a3", label: "Point a (8 bytes)", x: "3", y: "4", state: "success", badge: "no vtable" },
        ],
        onStack: true,
        callout: {
          tone: "success",
          text: "Non-virtual class = struct + access control + hidden this. Zero overhead.",
        },
      }),
    },
  ],
};
