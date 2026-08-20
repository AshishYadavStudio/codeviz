import type { Arrow, Cell, Frame, Lesson, Scene } from "@/lib/viz/types";
import { stackRegion, staticRegion } from "@/lib/viz/scene-helpers";

const CODE = `#include <cstdio>

struct Shape {
    virtual double area() const { return 0; }
    virtual ~Shape() = default;
};

struct Circle : Shape {
    double r;
    Circle(double r) : r(r) {}
    double area() const override { return 3.14159 * r * r; }
};

struct Square : Shape {
    double side;
    Square(double s) : side(s) {}
    double area() const override { return side * side; }
};

void report(const Shape &s) {
    printf("%f\\n", s.area());   // which area()?
}

int main() {
    Circle c(2.0);
    Square q(3.0);
    report(c);
    report(q);
    return 0;
}`;

function scene(opts: {
  /** Which concrete object the reference currently binds to. */
  bound?: "circle" | "square";
  showVtables?: boolean;
  dispatchActive?: boolean;
  showRef?: boolean;
  callout?: Scene["callout"];
}): Scene {
  const objectCells = (kind: "circle" | "square"): Cell[] => {
    const active = opts.bound === kind;
    return [
      {
        id: `${kind}-vptr`,
        name: "__vptr",
        type: "hidden",
        value: kind === "circle" ? "0x4020" : "0x4040",
        state: active && opts.dispatchActive ? "active" : "read",
        row: 0,
      },
      {
        id: `${kind}-data`,
        name: kind === "circle" ? "r" : "side",
        type: "double",
        value: kind === "circle" ? "2.0" : "3.0",
        state: active ? "read" : "idle",
        row: 0,
      },
    ];
  };

  const frames: Frame[] = [
    { id: "circle", label: "Circle c", state: opts.bound === "circle" ? "active" : "idle", cells: objectCells("circle") },
    { id: "square", label: "Square q", state: opts.bound === "square" ? "active" : "idle", cells: objectCells("square") },
  ];

  const stackCells: Cell[] = [];
  const arrows: Arrow[] = [];

  if (opts.showRef && opts.bound) {
    stackCells.push({
      id: "ref",
      name: "s",
      type: "const Shape &",
      value: opts.bound === "circle" ? "→ c" : "→ q",
      state: "active",
      row: 0,
    });
    arrows.push({
      id: "ref-arrow",
      from: "ref",
      to: `${opts.bound}-vptr`,
      state: "active",
      label: "s",
    });
  }

  const regions = [
    stackRegion([
      {
        id: "report",
        label: stackCells.length ? "report(const Shape &s)" : "main()",
        state: "active",
        cells: stackCells,
      },
      ...frames,
    ]),
  ];

  if (opts.showVtables) {
    regions.push(
      staticRegion(
        [
          {
            id: "vt-circle",
            label: "vtable for Circle · 0x4020",
            state: opts.bound === "circle" && opts.dispatchActive ? "active" : "idle",
            cells: [
              {
                id: "vt-circle-0",
                name: "[0] area",
                value: "Circle::area",
                state: opts.bound === "circle" && opts.dispatchActive ? "active" : "idle",
                row: 0,
              },
              { id: "vt-circle-1", name: "[1] ~Shape", value: "Circle::~Circle", row: 0 },
            ],
          },
          {
            id: "vt-square",
            label: "vtable for Square · 0x4040",
            state: opts.bound === "square" && opts.dispatchActive ? "active" : "idle",
            cells: [
              {
                id: "vt-square-0",
                name: "[0] area",
                value: "Square::area",
                state: opts.bound === "square" && opts.dispatchActive ? "active" : "idle",
                row: 0,
              },
              { id: "vt-square-1", name: "[1] ~Shape", value: "Square::~Square", row: 0 },
            ],
          },
        ],
        "one table per class, shared by every instance",
      ),
    );

    if (opts.dispatchActive && opts.bound) {
      arrows.push({
        id: "vptr-arrow",
        from: `${opts.bound}-vptr`,
        to: `vt-${opts.bound}-0`,
        state: "active",
        label: "lookup",
      });
    }
  }

  return { regions, arrows, callout: opts.callout };
}

export const virtualFunctions: Lesson = {
  slug: "virtual-functions",
  track: "cpp",
  title: "Virtual functions & the vtable",
  tagline: "The object carries a hidden pointer that decides which function runs.",
  description:
    "Follow a virtual call from a base-class reference through the object's hidden vptr into its class vtable, and see exactly what polymorphism costs in memory and indirection.",
  difficulty: 3,
  minutes: 11,
  access: "free",
  language: "cpp",
  keywords: ["virtual functions", "vtable", "vptr", "dynamic dispatch", "polymorphism", "c++ inheritance"],
  intro: [
    "**Polymorphism** is the idea that different types can respond to the same call in their own way — a `Dog` and a `Cat` both understand `speak()`, but you get \"woof\" from one and \"meow\" from the other.",
    "C++ implements this with **virtual functions**. When a method is declared `virtual`, the compiler doesn't hard-code which version to call. Instead, each object carries a hidden pointer (`vptr`) to a table (`vtable`) that lists which override to use.",
    "This lesson makes the vtable visible: you'll see the hidden pointer inside each object, watch it lead to the correct function, and understand why virtual calls cost one extra memory read.",
  ],
  stages: [
    {
      id: "objects",
      title: "Two objects, two layouts",
      body: [
        "`Circle` holds a `double r`; `Square` holds a `double side`. Different types, different sizes of data.",
        "But look at the first member of each: a pointer nobody declared. Because `Shape` has a virtual function, the compiler inserts a hidden `__vptr` at the start of every object in the hierarchy.",
      ],
      code: CODE,
      activeLines: [26, 27],
      scene: scene({
        callout: {
          tone: "info",
          text: "This is why a class with virtual functions is bigger than the sum of its members — usually by one pointer.",
        },
      }),
    },
    {
      id: "vtables",
      title: "One vtable per class, not per object",
      body: [
        "Each class gets a single table of function pointers, built at compile time and stored in static memory. `Circle`'s table points at `Circle::area`; `Square`'s at `Square::area`.",
        "Every `Circle` you ever create shares the same table. A thousand objects cost a thousand `__vptr`s but only one vtable.",
      ],
      code: CODE,
      activeLines: [11, 17],
      scene: scene({
        showVtables: true,
        callout: {
          tone: "info",
          text: "The slot index is fixed: area() is always slot 0, in every class in the hierarchy. That is what makes the lookup constant time.",
        },
      }),
    },
    {
      id: "bind-circle",
      title: "report(c) binds a Shape reference to a Circle",
      body: [
        "Inside `report`, the static type is `const Shape &`. The compiler has no idea which concrete class it will receive — this function is compiled once and used for every `Shape` that ever exists.",
        "The reference simply refers to the `Circle` object, hidden `__vptr` and all.",
      ],
      code: CODE,
      activeLines: [29, 21],
      scene: scene({
        bound: "circle",
        showRef: true,
        showVtables: true,
        callout: { tone: "active", text: "Static type: Shape. Dynamic type: Circle. Only the second one decides what runs." },
      }),
    },
    {
      id: "dispatch-circle",
      title: "s.area() follows the vptr",
      body: [
        "The call is not a jump to a known address. It is: read the object's `__vptr`, index slot 0 of the table it points to, and call whatever is there.",
        "For this object that lands on `Circle::area`, which returns 12.566. Three memory accesses instead of one direct call.",
      ],
      code: CODE,
      activeLines: [22, 11],
      scene: scene({
        bound: "circle",
        showRef: true,
        showVtables: true,
        dispatchActive: true,
        callout: { tone: "active", text: "object → vptr → vtable[0] → Circle::area. The indirection is the whole feature." },
      }),
    },
    {
      id: "dispatch-square",
      title: "Same line of code, different function",
      body: [
        "`report(q)` runs the identical compiled instructions in `report`. Nothing about that function changed.",
        "What changed is the `__vptr` inside the object it was handed, so slot 0 now resolves to `Square::area` and the result is 9.0.",
      ],
      code: CODE,
      activeLines: [30, 22, 17],
      scene: scene({
        bound: "square",
        showRef: true,
        showVtables: true,
        dispatchActive: true,
        callout: {
          tone: "success",
          text: "One function, many behaviours — chosen by the object at runtime, not by the caller at compile time.",
        },
      }),
    },
    {
      id: "slicing",
      title: "Take it by value and you lose all of it",
      body: [
        "If `report` took `Shape s` **by value**, the argument would be copied into a `Shape`-sized slot. The `Circle`'s `r` would not fit and would be discarded, and the copy would get `Shape`'s vptr.",
        "That is object slicing. It compiles silently, and `area()` starts returning 0. Polymorphism only works through a reference or a pointer.",
      ],
      code: CODE,
      activeLines: [21],
      scene: scene({
        bound: "circle",
        showVtables: true,
        callout: {
          tone: "danger",
          text: "Pass polymorphic types by reference or pointer. Never by value — the derived part is silently cut away.",
        },
      }),
    },
    {
      id: "virtual-destructor",
      title: "Why the destructor is virtual too",
      body: [
        "Slot 1 holds the destructor. If `~Shape` were not virtual, `delete` through a `Shape*` would call `Shape`'s destructor only — leaking anything the derived class owned.",
        "The rule: if a class has any virtual function, give it a virtual destructor. It costs nothing extra, because the vtable already exists.",
      ],
      code: CODE,
      activeLines: [5],
      scene: scene({
        showVtables: true,
        callout: {
          tone: "success",
          text: "The cost of virtual: one pointer per object, one table per class, one indirection per call — and no devirtualisation or inlining unless the compiler can prove the type.",
        },
      }),
    },
  ],
};
