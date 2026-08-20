import type { Arrow, CellState, Lesson, Scene } from "@/lib/viz/types";
import { heapRegion, stackRegion } from "@/lib/viz/scene-helpers";

const CODE = `public class Dog {
    String name;       // instance field — per object
    int    age;        // instance field — per object
    static int count;  // class field — one copy total

    Dog(String name, int age) {
        this.name = name;
        this.age  = age;
        count++;
    }

    String greet() {          // instance method
        return "I'm " + name;
    }

    static int getCount() {   // static method
        return count;          // cannot access 'name' here
    }
}

Dog a = new Dog("Rex", 3);   // count → 1
Dog b = new Dog("Luna", 5);  // count → 2
a.greet();                    // "I'm Rex"
Dog.getCount();               // 2`;

function scene(opts: {
  dogs: { id: string; name: string; age: string; state?: CellState; badge?: string }[];
  refs: { id: string; varName: string; to: string; state?: CellState }[];
  count: string;
  countState?: CellState;
  callout?: Scene["callout"];
}): Scene {
  const arrows: Arrow[] = opts.refs.map((r) => ({
    id: `ref-${r.id}`,
    from: r.id,
    to: r.to,
    state: r.state === "active" ? "active" : "idle",
  }));

  return {
    regions: [
      stackRegion([{
        id: "main",
        label: "main()",
        state: "active",
        cells: opts.refs.map((r) => ({
          id: r.id,
          name: r.varName,
          type: "Dog",
          value: "ref",
          state: r.state ?? "idle",
          row: 1,
        })),
      }], "references on the stack"),
      heapRegion(
        opts.dogs.map((d) => ({
          id: d.id,
          label: `Dog`,
          state: d.state === "active" ? "active" : ("idle" as const),
          badge: d.badge,
          cells: [
            { id: `${d.id}-name`, name: "name", type: "String", value: d.name, state: d.state ?? "idle" },
            { id: `${d.id}-age`, name: "age", type: "int", value: d.age, state: d.state ?? "idle" },
          ],
        })),
        "each object has its own fields",
      ),
      {
        id: "class-data",
        kind: "static" as const,
        label: "Dog.class",
        caption: "shared across all instances",
        frames: [{
          id: "class-frame",
          label: "static",
          cells: [
            { id: "count", name: "count", type: "int", value: opts.count, state: opts.countState ?? "idle" },
          ],
        }],
      },
    ],
    arrows,
    callout: opts.callout,
  };
}

export const classesAndInstances: Lesson = {
  slug: "classes-and-instances",
  track: "java",
  title: "Classes & instances",
  tagline: "Fields per object, methods shared, constructors chained.",
  description:
    "Watch two Dog objects get created on the heap with independent instance fields, see the static count field shared between them, and understand that instance methods receive a hidden this reference while static methods do not.",
  difficulty: 1,
  minutes: 8,
  access: "free",
  language: "java",
  keywords: ["class", "instance", "constructor", "static field", "this", "object creation"],
  intro: [
    "A **class** is a blueprint. An **instance** is a house built from that blueprint. The class describes what fields and methods exist; each instance is a separate object on the heap with its own field values.",
    "The **constructor** is the code that runs when you call `new` — it sets up the fresh object's fields. And `static` marks something as belonging to the class itself, not to any one instance: one copy total, shared by everyone.",
    "This lesson creates two `Dog` objects, watches each one get its own name and age, and shows a static counter shared between them.",
  ],
  stages: [
    {
      id: "first-new",
      title: "new allocates and calls the constructor",
      body: [
        "`new Dog(\"Rex\", 3)` does two things: allocates space on the heap for a Dog object, then calls the constructor to fill in its fields.",
        "The constructor also increments `count`, which is a `static` field — it belongs to the class, not to any one object.",
      ],
      code: CODE,
      activeLines: [19],
      scene: scene({
        dogs: [{ id: "d1", name: "Rex", age: "3", state: "active", badge: "just created" }],
        refs: [{ id: "a", varName: "a", to: "d1-name", state: "active" }],
        count: "1",
        countState: "active",
        callout: { tone: "active", text: "One object on the heap. count is 1 — shared across all Dogs." },
      }),
    },
    {
      id: "second-new",
      title: "A second Dog, same class, separate data",
      body: [
        "Creating Luna allocates a second, independent object. Each Dog has its own `name` and `age` — modifying one does not affect the other.",
        "`count` is now 2. Both constructors incremented the same variable, because `static` means one copy per class.",
      ],
      code: CODE,
      activeLines: [20],
      scene: scene({
        dogs: [
          { id: "d1", name: "Rex", age: "3" },
          { id: "d2", name: "Luna", age: "5", state: "active", badge: "just created" },
        ],
        refs: [
          { id: "a", varName: "a", to: "d1-name" },
          { id: "b", varName: "b", to: "d2-name", state: "active" },
        ],
        count: "2",
        countState: "active",
        callout: { tone: "active", text: "Two objects, each with its own fields. One count, shared." },
      }),
    },
    {
      id: "instance-method",
      title: "Instance methods know which object called them",
      body: [
        "`a.greet()` calls `greet` with `this` set to the object `a` refers to. Inside the method, `name` means `this.name`, which is \"Rex\".",
        "If you called `b.greet()`, the same method would run, but `this` would point at Luna, so `name` would be \"Luna\".",
      ],
      code: CODE,
      activeLines: [21, 11],
      scene: scene({
        dogs: [
          { id: "d1", name: "Rex", age: "3", state: "active", badge: "this" },
          { id: "d2", name: "Luna", age: "5" },
        ],
        refs: [
          { id: "a", varName: "a", to: "d1-name", state: "active" },
          { id: "b", varName: "b", to: "d2-name" },
        ],
        count: "2",
        callout: { tone: "active", text: "a.greet() → this = Rex's object. name resolves to \"Rex\"." },
      }),
    },
    {
      id: "static-method",
      title: "Static methods have no this",
      body: [
        "`Dog.getCount()` is called on the class, not on an object. There is no `this` — the method can only access static members.",
        "That is why a static method cannot read `name` or `age`: it has no way to know which Dog you meant.",
      ],
      code: CODE,
      activeLines: [22, 14, 15],
      scene: scene({
        dogs: [
          { id: "d1", name: "Rex", age: "3" },
          { id: "d2", name: "Luna", age: "5" },
        ],
        refs: [
          { id: "a", varName: "a", to: "d1-name" },
          { id: "b", varName: "b", to: "d2-name" },
        ],
        count: "2",
        countState: "active",
        callout: { tone: "info", text: "Static method: no this, no instance fields. Only class-level data." },
      }),
    },
    {
      id: "recap",
      title: "Instance vs static — the split",
      body: [
        "Instance fields and methods belong to an object — each object has its own copy, and methods receive `this`. Static fields and methods belong to the class — one copy total, no `this`.",
        "The constructor is the bridge: it runs per object, but can touch both instance and static members.",
      ],
      code: CODE,
      activeLines: [2, 3, 4],
      scene: scene({
        dogs: [
          { id: "d1", name: "Rex", age: "3", state: "success" },
          { id: "d2", name: "Luna", age: "5", state: "success" },
        ],
        refs: [
          { id: "a", varName: "a", to: "d1-name" },
          { id: "b", varName: "b", to: "d2-name" },
        ],
        count: "2",
        countState: "success",
        callout: {
          tone: "success",
          text: "Instance = per object, has this. Static = per class, no this. Constructors bridge both.",
        },
      }),
    },
  ],
};
