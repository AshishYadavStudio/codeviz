import type { CellState, Lesson, Scene } from "@/lib/viz/types";
import { blocksRegion } from "@/lib/viz/scene-helpers";

const CODE = `#include <iostream>

namespace math {
    int add(int a, int b) { return a + b; }
    double pi = 3.14159;
}

namespace physics {
    double pi = 3.14159265;
    double gravity = 9.81;
}

// Qualified access — always works
int r1 = math::add(2, 3);
double r2 = physics::gravity;

// using-declaration — one name
using math::add;
int r3 = add(4, 5);            // math::add

// using-directive — all names
using namespace math;
double r4 = pi;                 // math::pi

// Which pi? ambiguous if physics is also brought in
// using namespace physics;     // error: 'pi' is ambiguous`;

function scene(opts: {
  namespaces: { id: string; label: string; members: { id: string; name: string; state?: CellState }[] }[];
  lookups?: { id: string; expr: string; resolves: string; state?: CellState }[];
  callout?: Scene["callout"];
}): Scene {
  return {
    regions: [
      ...opts.namespaces.map((ns) =>
        blocksRegion(ns.id, ns.label, [
          {
            id: `${ns.id}-frame`,
            label: ns.label,
            cells: ns.members.map((m) => ({
              id: m.id,
              name: m.name,
              state: m.state ?? "idle",
            })),
          },
        ]),
      ),
      ...(opts.lookups
        ? [
            blocksRegion("lookup", "Name resolution", opts.lookups.map((l) => ({
              id: l.id,
              label: l.expr,
              cells: [
                {
                  id: `${l.id}-cell`,
                  value: l.resolves,
                  state: l.state ?? "idle",
                },
              ],
            }))),
          ]
        : []),
    ],
    callout: opts.callout,
  };
}

export const namespaces: Lesson = {
  slug: "namespaces",
  track: "cpp",
  title: "Namespaces",
  tagline: "Scoping names, and why `using namespace std` belongs in no header.",
  description:
    "See how namespaces scope names, how the :: operator resolves them, the difference between a using-declaration and a using-directive, and why the latter in a header poisons every file that includes it.",
  difficulty: 1,
  minutes: 7,
  access: "free",
  language: "cpp",
  keywords: ["namespace", "using directive", "scope resolution", "name collision", "std"],
  intro: [
    "As a program grows, name collisions become inevitable. Two libraries both want to call something `sort` or `Result` or `log`. **Namespaces** are C++'s answer: a way to say \"my `sort`\" versus \"their `sort`\" without either changing.",
    "A namespace is just a labelled scope. `std::cout` means \"cout inside the std namespace\". The `::` is the scope resolution operator — it drills into the namespace to find the name.",
    "This lesson shows the three ways to reach a namespaced name — fully qualified, one-name imports, and blanket imports — and why the blanket version (`using namespace std`) is fine in a `.cpp` file but a landmine in a header.",
  ],
  stages: [
    {
      id: "two-ns",
      title: "Two namespaces, same name",
      body: [
        "Both `math` and `physics` define a variable called `pi`. Without namespaces, this would be a linker error — two global symbols with the same name.",
        "Namespaces are compile-time scopes. They add a prefix to every name inside them, so the linker sees `math::pi` and `physics::pi` as different symbols.",
      ],
      code: CODE,
      activeLines: [3, 4, 5, 8, 9, 10],
      scene: scene({
        namespaces: [
          { id: "math", label: "math::", members: [
            { id: "m-add", name: "add()" },
            { id: "m-pi", name: "pi", state: "read" },
          ]},
          { id: "physics", label: "physics::", members: [
            { id: "p-pi", name: "pi", state: "read" },
            { id: "p-grav", name: "gravity" },
          ]},
        ],
        callout: { tone: "info", text: "Two pi variables, zero conflict. The namespace is part of the name." },
      }),
    },
    {
      id: "qualified",
      title: ":: always works",
      body: [
        "`math::add(2, 3)` and `physics::gravity` are fully qualified names. The compiler knows exactly which symbol you mean — no search, no ambiguity.",
        "This is the safest style. It is verbose, but every reader (and every tool) can resolve the name without knowing what `using` declarations are in scope.",
      ],
      code: CODE,
      activeLines: [13, 14],
      scene: scene({
        namespaces: [
          { id: "math", label: "math::", members: [
            { id: "m-add2", name: "add()", state: "active" },
            { id: "m-pi2", name: "pi" },
          ]},
          { id: "physics", label: "physics::", members: [
            { id: "p-pi2", name: "pi" },
            { id: "p-grav2", name: "gravity", state: "active" },
          ]},
        ],
        lookups: [
          { id: "l1", expr: "math::add(2,3)", resolves: "→ math::add", state: "active" },
          { id: "l2", expr: "physics::gravity", resolves: "→ physics::gravity", state: "active" },
        ],
        callout: { tone: "active", text: "Fully qualified: explicit, safe, slightly verbose." },
      }),
    },
    {
      id: "using-decl",
      title: "using-declaration: bring one name in",
      body: [
        "`using math::add` makes the unqualified name `add` refer to `math::add` in the current scope. Other names in `math` are unaffected.",
        "This is a targeted import. It tells the reader exactly which name you need, without opening the whole namespace.",
      ],
      code: CODE,
      activeLines: [17, 18],
      scene: scene({
        namespaces: [
          { id: "math", label: "math::", members: [
            { id: "m-add3", name: "add()", state: "active" },
            { id: "m-pi3", name: "pi" },
          ]},
        ],
        lookups: [
          { id: "l3", expr: "add(4, 5)", resolves: "→ math::add", state: "success" },
        ],
        callout: { tone: "success", text: "using math::add — one name, no surprises." },
      }),
    },
    {
      id: "using-dir",
      title: "using-directive: bring everything in",
      body: [
        "`using namespace math` makes every name in `math` available without qualification. Now `pi` means `math::pi`.",
        "This is convenient in a small `.cpp` file. In a header, it is a bug — every file that includes the header gets the directive, whether it wanted it or not.",
      ],
      code: CODE,
      activeLines: [21, 22],
      scene: scene({
        namespaces: [
          { id: "math", label: "math::", members: [
            { id: "m-add4", name: "add()", state: "read" },
            { id: "m-pi4", name: "pi", state: "active" },
          ]},
        ],
        lookups: [
          { id: "l4", expr: "pi", resolves: "→ math::pi", state: "active" },
        ],
        callout: { tone: "active", text: "All of math:: is now visible. Convenient, but wide." },
      }),
    },
    {
      id: "ambiguous",
      title: "Two directives, one ambiguous name",
      body: [
        "If you also write `using namespace physics`, both `math::pi` and `physics::pi` are candidates for the bare name `pi`. The compiler refuses — it cannot pick for you.",
        "This is why `using namespace std` in a header is dangerous. The `std` namespace has thousands of names — `count`, `size`, `data`, `move` — and any of them could collide with your own.",
      ],
      code: CODE,
      activeLines: [25],
      scene: scene({
        namespaces: [
          { id: "math", label: "math::", members: [
            { id: "m-pi5", name: "pi", state: "danger" },
          ]},
          { id: "physics", label: "physics::", members: [
            { id: "p-pi5", name: "pi", state: "danger" },
          ]},
        ],
        lookups: [
          { id: "l5", expr: "pi", resolves: "AMBIGUOUS", state: "danger" },
        ],
        callout: {
          tone: "danger",
          text: "Two using-directives, same name → compiler error. In a header this poisons every includer.",
        },
      }),
    },
    {
      id: "recap",
      title: "The rule",
      body: [
        "Use `::` when the name appears rarely. Use a `using`-declaration when you need one specific name often. Use a `using`-directive only inside a `.cpp` file, never in a header.",
        "`using namespace std` in a header is the most common C++ style mistake. It compiles today and breaks tomorrow, when someone adds a name that collides with one of the thousands in `std`.",
      ],
      code: CODE,
      activeLines: [13, 17, 21],
      scene: scene({
        namespaces: [
          { id: "math", label: "math::", members: [
            { id: "m-add6", name: "add()", state: "success" },
            { id: "m-pi6", name: "pi", state: "success" },
          ]},
        ],
        callout: {
          tone: "success",
          text: "Header: never using-directive. Source file: fine. Qualified: always safe.",
        },
      }),
    },
  ],
};
