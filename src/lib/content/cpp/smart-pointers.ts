import type { Arrow, Cell, Frame, Lesson, Scene } from "@/lib/viz/types";
import { heapRegion, stackRegion } from "@/lib/viz/scene-helpers";

const OBJ = "0x600a80";

const CODE = `#include <memory>

struct Node { int value; };

void take(std::unique_ptr<Node> owned) {
    // owned destroys the Node when this returns
}

int main() {
    auto u = std::make_unique<Node>(7);
    // auto copy = u;              // won't compile: unique_ptr is move-only
    auto moved = std::move(u);     // ownership transferred

    auto s1 = std::make_shared<Node>(9);
    auto s2 = s1;                  // refcount 1 -> 2
    s2.reset();                    // refcount 2 -> 1

    take(std::move(moved));        // destroyed inside take()
    return 0;
}`;

function scene(opts: {
  owners: { id: string; name: string; type: string; owns: boolean; state?: Cell["state"]; note?: string; row?: number }[];
  object?: { alive: boolean; label: string; refcount?: number; value: string };
  callout?: Scene["callout"];
}): Scene {
  const cells: Cell[] = opts.owners.map((o) => ({
    id: o.id,
    name: o.name,
    type: o.type,
    value: o.owns ? OBJ : "nullptr",
    state: o.state ?? (o.owns ? "read" : "garbage"),
    note: o.note,
    row: o.row ?? 0,
  }));

  const frames: Frame[] = [];
  const arrows: Arrow[] = [];

  if (opts.object) {
    frames.push({
      id: "node",
      label: opts.object.label,
      state: opts.object.alive ? "active" : "popped",
      badge:
        opts.object.refcount !== undefined
          ? `use_count ${opts.object.refcount}`
          : opts.object.alive
            ? "owned by exactly one"
            : "destroyed",
      cells: [
        {
          id: "node-0",
          name: "value",
          type: "int",
          value: opts.object.value,
          address: OBJ,
          state: opts.object.alive ? "allocated" : "freed",
          row: 0,
        },
      ],
    });

    for (const o of opts.owners) {
      if (!o.owns) continue;
      arrows.push({
        id: `${o.id}-arrow`,
        from: o.id,
        to: "node-0",
        state: o.state === "active" ? "active" : o.state === "danger" ? "danger" : "idle",
        dashed: !opts.object.alive,
      });
    }
  }

  return {
    regions: [
      stackRegion([{ id: "main", label: "main()", state: "active", cells }]),
      heapRegion(frames, "freed by a destructor, never by a free() you write"),
    ],
    arrows,
    callout: opts.callout,
  };
}

export const smartPointers: Lesson = {
  slug: "smart-pointers",
  track: "cpp",
  title: "unique_ptr & shared_ptr",
  tagline: "Ownership written into the type, so the compiler enforces what a comment used to.",
  description:
    "Watch unique_ptr transfer sole ownership on move, and shared_ptr track a reference count that frees the object exactly when the last owner goes away.",
  difficulty: 2,
  minutes: 10,
  access: "free",
  language: "cpp",
  keywords: ["unique_ptr", "shared_ptr", "make_unique", "reference counting", "ownership", "RAII"],
  intro: [
    "Manual `new`/`delete` is where most C++ memory bugs live. **Smart pointers** wrap a raw pointer in an RAII object that deletes automatically when it goes out of scope, so you cannot forget.",
    "There are two flavours. `unique_ptr` says \"one owner only\" — the object is destroyed when its unique pointer dies. `shared_ptr` says \"multiple owners, last one turns out the lights\" — it keeps a count of how many pointers refer to the object and deletes when the count hits zero.",
    "This lesson watches a `unique_ptr` transfer ownership on move, and a `shared_ptr` count go up and down as references come and go.",
  ],
  stages: [
    {
      id: "unique",
      title: "make_unique allocates and takes sole ownership",
      body: [
        "`std::make_unique<Node>(7)` allocates a `Node` on the heap and wraps the pointer in a `unique_ptr`. When `u` is destroyed, so is the `Node`.",
        "The `unique_ptr` itself is just a pointer — usually the same size as a raw one. The ownership rule is enforced at compile time, not by extra runtime data.",
      ],
      code: CODE,
      activeLines: [10],
      scene: scene({
        owners: [{ id: "u", name: "u", type: "unique_ptr", owns: true, state: "active" }],
        object: { alive: true, label: "Node", value: "7" },
        callout: { tone: "active", text: "One owner. No delete anywhere in this program, and no leak either." },
      }),
    },
    {
      id: "no-copy",
      title: "Copying it does not compile",
      body: [
        "`auto copy = u;` is rejected by the compiler, because two `unique_ptr`s owning the same object would both try to delete it.",
        "The copy constructor is deleted, so the mistake is caught at build time rather than becoming a double-free at 3 a.m.",
      ],
      code: CODE,
      activeLines: [11],
      scene: scene({
        owners: [
          { id: "u", name: "u", type: "unique_ptr", owns: true },
          { id: "copy", name: "copy", type: "unique_ptr", owns: false, state: "danger", note: "compile error", row: 1 },
        ],
        object: { alive: true, label: "Node", value: "7" },
        callout: {
          tone: "danger",
          text: "The type system is doing the work: \"unique\" is not a naming convention, it is a guarantee.",
        },
      }),
    },
    {
      id: "move",
      title: "Moving hands ownership over",
      body: [
        "`std::move(u)` is allowed, because afterwards there is still exactly one owner. `moved` takes the pointer and `u` is left holding `nullptr`.",
        "Unlike a moved-from `std::string`, a moved-from `unique_ptr` has a fully specified state: it is guaranteed to be null.",
      ],
      code: CODE,
      activeLines: [12],
      scene: scene({
        owners: [
          { id: "u", name: "u", type: "unique_ptr", owns: false, note: "guaranteed nullptr" },
          { id: "moved", name: "moved", type: "unique_ptr", owns: true, state: "active", row: 1 },
        ],
        object: { alive: true, label: "Node", value: "7" },
        callout: { tone: "active", text: "The object never moved. Only the right to destroy it did." },
      }),
    },
    {
      id: "shared",
      title: "shared_ptr counts its owners",
      body: [
        "`make_shared` allocates the object together with a small control block holding a reference count, currently 1.",
        "This is the trade: `shared_ptr` permits copying, and pays for it with an extra allocation's worth of bookkeeping and atomic counter updates.",
      ],
      code: CODE,
      activeLines: [14],
      scene: scene({
        owners: [{ id: "s1", name: "s1", type: "shared_ptr", owns: true, state: "active" }],
        object: { alive: true, label: "Node + control block", refcount: 1, value: "9" },
        callout: { tone: "active", text: "use_count 1. The count lives with the object, not in the pointer." },
      }),
    },
    {
      id: "copy-shared",
      title: "A copy increments the count",
      body: [
        "`auto s2 = s1;` is a legal copy. Both point at the same `Node`, and the reference count rises to 2.",
        "Neither owner is special. The object survives exactly as long as the count stays above zero.",
      ],
      code: CODE,
      activeLines: [15],
      scene: scene({
        owners: [
          { id: "s1", name: "s1", type: "shared_ptr", owns: true },
          { id: "s2", name: "s2", type: "shared_ptr", owns: true, state: "active", row: 1 },
        ],
        object: { alive: true, label: "Node + control block", refcount: 2, value: "9" },
        callout: { tone: "active", text: "Two owners, one object, one count. The increment is atomic — that is not free." },
      }),
    },
    {
      id: "reset",
      title: "reset() decrements — but does not destroy",
      body: [
        "`s2.reset()` drops one owner. The count falls to 1, and because it has not reached zero, the `Node` is untouched.",
        "This is the behaviour you want when lifetime genuinely is shared: the object outlives any individual owner.",
      ],
      code: CODE,
      activeLines: [16],
      scene: scene({
        owners: [
          { id: "s1", name: "s1", type: "shared_ptr", owns: true, state: "read" },
          { id: "s2", name: "s2", type: "shared_ptr", owns: false, note: "released", row: 1 },
        ],
        object: { alive: true, label: "Node + control block", refcount: 1, value: "9" },
        callout: { tone: "info", text: "Destruction happens when the count hits 0 — on whichever thread happens to drop the last owner." },
      }),
    },
    {
      id: "sink",
      title: "Passing by value means giving it away",
      body: [
        "`take(std::move(moved))` transfers ownership into the function's parameter. When `take` returns, the parameter is destroyed and the `Node` with it.",
        "A `unique_ptr` parameter taken by value is a *sink*: the signature alone tells the caller \"I am taking this from you\". No documentation required.",
      ],
      code: CODE,
      activeLines: [18, 5, 6],
      scene: scene({
        owners: [
          { id: "moved", name: "moved", type: "unique_ptr", owns: false, note: "gave it away" },
          { id: "s1", name: "s1", type: "shared_ptr", owns: false, row: 1 },
        ],
        object: { alive: false, label: "Node", value: "7" },
        callout: {
          tone: "success",
          text: "unique_ptr by default; shared_ptr only when ownership is genuinely shared. Raw pointers for non-owning views.",
        },
      }),
    },
  ],
};
