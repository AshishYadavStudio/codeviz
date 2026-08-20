import type { Arrow, Cell, Frame, Lesson, Scene } from "@/lib/viz/types";
import { heapRegion, stackRegion } from "@/lib/viz/scene-helpers";

const CODE = `public class Main {
    static Node cache;                    // a GC root: static field

    public static void main(String[] args) {
        Node a = new Node("A");
        Node b = new Node("B");
        a.next = b;                       // b reachable through a

        cache = new Node("C");

        b = null;                         // still reachable via a.next
        a = null;                         // now A and B are both garbage

        Node d = new Node("D");
        d.self = d;                       // self-reference, still garbage
        d = null;
    }
}`;

type ObjState = "live" | "garbage" | "collected";

interface Obj {
  id: string;
  label: string;
  state: ObjState;
  note?: string;
}

function scene(opts: {
  locals: { id: string; name: string; target: string | null; state?: Cell["state"]; row?: number }[];
  objects: Obj[];
  links?: { from: string; to: string; state?: Arrow["state"]; label?: string }[];
  callout?: Scene["callout"];
}): Scene {
  const cells: Cell[] = opts.locals.map((l) => ({
    id: l.id,
    name: l.name,
    type: "Node",
    value: l.target === null ? "null" : `→ ${l.target.toUpperCase()}`,
    state: l.state ?? "idle",
    row: l.row ?? 0,
  }));

  const frames: Frame[] = opts.objects.map((o) => ({
    id: o.id,
    label: o.label,
    state: o.state === "collected" ? "popped" : o.state === "garbage" ? "idle" : "active",
    badge:
      o.state === "live" ? "reachable" : o.state === "garbage" ? "unreachable — garbage" : "collected",
    note: o.note,
    cells: [
      {
        id: `${o.id}-v`,
        name: "name",
        value: `"${o.label.slice(-1)}"`,
        state: o.state === "collected" ? "freed" : o.state === "garbage" ? "garbage" : "idle",
        row: 0,
      },
    ],
  }));

  return {
    regions: [
      stackRegion(
        [{ id: "main", label: "main() + static fields", state: "active", cells }],
        "GC roots: locals on any live frame, and static fields",
      ),
      heapRegion(frames, "collected when unreachable, not when unused"),
    ],
    arrows: (opts.links ?? []).map((l, i) => ({
      id: `l${i}`,
      from: l.from,
      to: l.to,
      state: l.state ?? "idle",
      label: l.label,
    })),
    callout: opts.callout,
  };
}

export const garbageCollection: Lesson = {
  slug: "garbage-collection",
  track: "java",
  title: "Reachability & garbage collection",
  tagline: "Nothing is freed because you stopped using it. It is freed because nothing can reach it.",
  description:
    "Follow references from the GC roots to see exactly which objects survive, why a cycle of objects is still garbage, and what actually causes a memory leak in a garbage-collected language.",
  difficulty: 2,
  minutes: 10,
  access: "free",
  language: "java",
  keywords: ["garbage collection", "reachability", "GC roots", "memory leak", "java heap"],
  intro: [
    "In C, you free memory yourself. In Java, the runtime does it — the **garbage collector** periodically scans the heap and reclaims objects nothing can still reach.",
    "\"Reach\" is the key word. The GC starts from *roots* (local variables in running methods, static fields) and follows every reference. Anything it finds is alive. Anything it doesn't is garbage.",
    "This lesson visualises reachability: watch objects get orphaned when the last reference to them is dropped, and see why holding a reference in a long-lived collection is the classic Java \"memory leak\".",
  ],
  stages: [
    {
      id: "roots",
      title: "Collection starts from the roots",
      body: [
        "The collector does not track when you stop using a variable. It starts from a set of **GC roots** — local variables on live stack frames, and static fields — and follows every reference it can.",
        "Anything it reaches is live. Everything else is garbage, whatever your intentions were.",
      ],
      code: CODE,
      activeLines: [5, 6],
      scene: scene({
        locals: [
          { id: "a", name: "a", target: "objA", state: "active" },
          { id: "b", name: "b", target: "objB", state: "active" },
        ],
        objects: [
          { id: "objA", label: "Node A", state: "live" },
          { id: "objB", label: "Node B", state: "live" },
        ],
        links: [
          { from: "a", to: "objA-v", state: "active" },
          { from: "b", to: "objB-v", state: "active" },
        ],
        callout: { tone: "active", text: "Two roots, two objects, both directly reachable." },
      }),
    },
    {
      id: "chain",
      title: "Reachability is transitive",
      body: [
        "`a.next = b` links the two objects. Now B is reachable two ways: directly from the local `b`, and indirectly through A.",
        "The collector does not care how many paths exist — only whether at least one does.",
      ],
      code: CODE,
      activeLines: [7],
      scene: scene({
        locals: [
          { id: "a", name: "a", target: "objA" },
          { id: "b", name: "b", target: "objB" },
        ],
        objects: [
          { id: "objA", label: "Node A", state: "live" },
          { id: "objB", label: "Node B", state: "live", note: "reachable from a.next and from b" },
        ],
        links: [
          { from: "a", to: "objA-v" },
          { from: "b", to: "objB-v" },
          { from: "objA-v", to: "objB-v", state: "active", label: "a.next" },
        ],
        callout: { tone: "info", text: "Objects hold references to other objects. The reachable set is a graph walk." },
      }),
    },
    {
      id: "static-root",
      title: "A static field is a root that never goes out of scope",
      body: [
        "`cache = new Node(\"C\")` makes C reachable from a static field. Static fields live as long as their class is loaded — effectively forever in most applications.",
        "This is the single most common cause of leaks in Java: a static collection that things get added to and never removed from.",
      ],
      code: CODE,
      activeLines: [2, 9],
      scene: scene({
        locals: [
          { id: "a", name: "a", target: "objA" },
          { id: "b", name: "b", target: "objB" },
          { id: "cache", name: "cache", target: "objC", state: "active", row: 1 },
        ],
        objects: [
          { id: "objA", label: "Node A", state: "live" },
          { id: "objB", label: "Node B", state: "live" },
          { id: "objC", label: "Node C", state: "live", note: "held by a static field — never collected" },
        ],
        links: [
          { from: "a", to: "objA-v" },
          { from: "objA-v", to: "objB-v" },
          { from: "cache", to: "objC-v", state: "active" },
        ],
        callout: { tone: "info", text: "C will survive every collection for as long as the class is loaded." },
      }),
    },
    {
      id: "one-null",
      title: "b = null changes nothing",
      body: [
        "Setting the local `b` to null removes one path to the object. But `a.next` still refers to it, so B remains reachable and is not collected.",
        "\"Setting things to null to help the GC\" only works if you are removing the *last* reference.",
      ],
      code: CODE,
      activeLines: [11],
      scene: scene({
        locals: [
          { id: "a", name: "a", target: "objA" },
          { id: "b", name: "b", target: null, state: "written" },
          { id: "cache", name: "cache", target: "objC", row: 1 },
        ],
        objects: [
          { id: "objA", label: "Node A", state: "live" },
          { id: "objB", label: "Node B", state: "live", note: "still reachable via a.next" },
          { id: "objC", label: "Node C", state: "live" },
        ],
        links: [
          { from: "a", to: "objA-v" },
          { from: "objA-v", to: "objB-v", state: "active", label: "the surviving path" },
          { from: "cache", to: "objC-v" },
        ],
        callout: { tone: "active", text: "One path removed, one path left. B lives." },
      }),
    },
    {
      id: "both-null",
      title: "a = null cuts the whole branch loose",
      body: [
        "Now no root reaches A, and the only reference to B was inside A. Both become unreachable in one step.",
        "Notice that B became garbage without anyone touching B — its fate was decided by what happened to the object pointing at it.",
      ],
      code: CODE,
      activeLines: [12],
      scene: scene({
        locals: [
          { id: "a", name: "a", target: null, state: "written" },
          { id: "b", name: "b", target: null },
          { id: "cache", name: "cache", target: "objC", row: 1 },
        ],
        objects: [
          { id: "objA", label: "Node A", state: "garbage" },
          { id: "objB", label: "Node B", state: "garbage", note: "only A referred to it" },
          { id: "objC", label: "Node C", state: "live" },
        ],
        links: [
          { from: "objA-v", to: "objB-v", state: "danger" },
          { from: "cache", to: "objC-v" },
        ],
        callout: {
          tone: "danger",
          text: "Unreachable, but not yet gone. Objects become eligible for collection; when it actually happens is the JVM's business.",
        },
      }),
    },
    {
      id: "cycle",
      title: "A reference cycle is still garbage",
      body: [
        "`d.self = d` makes the object refer to itself. A naive reference-counting scheme would see a count of 1 and never free it.",
        "Java does not count references — it walks from the roots. Once `d` is null, nothing outside the cycle points in, so the whole cycle is unreachable and collectable.",
      ],
      code: CODE,
      activeLines: [14, 15, 16],
      scene: scene({
        locals: [
          { id: "d", name: "d", target: null, state: "written" },
          { id: "cache", name: "cache", target: "objC", row: 1 },
        ],
        objects: [
          { id: "objD", label: "Node D", state: "garbage", note: "points only at itself" },
          { id: "objC", label: "Node C", state: "live" },
        ],
        links: [
          { from: "objD-v", to: "objD-v", state: "danger", label: "d.self" },
          { from: "cache", to: "objC-v" },
        ],
        callout: {
          tone: "success",
          text: "This is the advantage of tracing collection over reference counting — cycles cost nothing extra.",
        },
      }),
    },
    {
      id: "collected",
      title: "What a collection actually does",
      body: [
        "The collector reclaims A, B and D, and typically compacts the survivors together so that allocation stays a simple pointer bump.",
        "Most objects die very young, which is why the heap is split into generations: new objects are allocated in a small young space that is collected often and quickly, and only long-lived survivors are promoted.",
      ],
      code: CODE,
      activeLines: [17],
      scene: scene({
        locals: [{ id: "cache", name: "cache", target: "objC", state: "success" }],
        objects: [
          { id: "objA", label: "Node A", state: "collected" },
          { id: "objB", label: "Node B", state: "collected" },
          { id: "objD", label: "Node D", state: "collected" },
          { id: "objC", label: "Node C", state: "live" },
        ],
        links: [{ from: "cache", to: "objC-v", state: "active" }],
        callout: {
          tone: "success",
          text: "A leak in Java is not forgotten free() — it is an unwanted reference you forgot you were still holding.",
        },
      }),
    },
  ],
};
