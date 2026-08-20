import type { CellState, Lesson, Scene } from "@/lib/viz/types";
import { heapRegion } from "@/lib/viz/scene-helpers";

const CODE = `public class Person {
    // Field — raw storage
    private string _name;

    // Property — controlled access
    public string Name {
        get { return _name; }
        set { _name = value; }
    }

    // Auto-property — compiler generates the backing field
    public int Age { get; set; }

    // Init-only — settable in constructor or initialiser, then frozen
    public string Id { get; init; }

    // Computed — no storage, derived each time
    public bool IsAdult => Age >= 18;
}

// Usage
var p = new Person { Name = "Ana", Age = 25, Id = "A001" };
p.Name = "Ben";   // calls the set accessor
p.Age  = 30;      // calls the auto-generated set
// p.Id = "X";    // error: init-only after construction`;

function scene(opts: {
  fields: { id: string; name: string; value: string; state?: CellState; note?: string }[];
  callout?: Scene["callout"];
}): Scene {
  return {
    regions: [
      heapRegion([{
        id: "person",
        label: "Person",
        state: "active",
        cells: opts.fields.map((f) => ({
          id: f.id,
          name: f.name,
          value: f.value,
          state: f.state ?? "idle",
          note: f.note,
        })),
      }], "fields are the actual storage; properties are the API"),
    ],
    callout: opts.callout,
  };
}

export const propertiesAndFields: Lesson = {
  slug: "properties-and-fields",
  track: "csharp",
  title: "Properties, fields & auto-properties",
  tagline: "What the compiler generates behind { get; set; }.",
  description:
    "See that a field is raw storage, a property is a pair of methods wrapping it, and an auto-property generates both — then watch init-only and computed properties fill out the pattern.",
  difficulty: 1,
  minutes: 7,
  access: "free",
  language: "csharp",
  keywords: ["property", "field", "auto-property", "get set", "init", "backing field"],
  stages: [
    {
      id: "field",
      title: "A field is raw storage",
      body: [
        "`private string _name` allocates space inside the object for a string reference. It is the actual data — nothing runs when you read or write it.",
        "Fields are usually `private` because exposing them directly means any code can write any value, with no validation or notification.",
      ],
      code: CODE,
      activeLines: [3],
      scene: scene({
        fields: [
          { id: "name-f", name: "_name", value: "null", state: "active", note: "private field — raw storage" },
        ],
        callout: { tone: "info", text: "A field is just a slot in the object. No logic, no protection." },
      }),
    },
    {
      id: "property",
      title: "A property is two methods",
      body: [
        "`public string Name { get; set; }` looks like a field but compiles to a `get_Name()` and `set_Name(value)` method pair. Reading calls get, writing calls set.",
        "This lets you add validation, logging or change notification later without breaking callers — they keep writing `p.Name = x`.",
      ],
      code: CODE,
      activeLines: [6, 7, 8, 9],
      scene: scene({
        fields: [
          { id: "name-f2", name: "_name", value: "\"Ana\"", state: "active", note: "backing field" },
        ],
        callout: { tone: "active", text: "Name { get; set; } compiles to get_Name() and set_Name(). The field is hidden." },
      }),
    },
    {
      id: "auto",
      title: "Auto-property: the compiler writes the field",
      body: [
        "`public int Age { get; set; }` generates a hidden backing field (something like `<Age>k__BackingField`) plus trivial get and set methods.",
        "You never see the field. If you later need validation, replace the auto-property with an explicit one — callers do not change.",
      ],
      code: CODE,
      activeLines: [12],
      scene: scene({
        fields: [
          { id: "name-f3", name: "_name", value: "\"Ana\"", note: "explicit field" },
          { id: "age-f", name: "<Age>", value: "25", state: "active", note: "auto-generated field" },
        ],
        callout: { tone: "active", text: "Auto-property = compiler-generated field + trivial get/set. Zero boilerplate." },
      }),
    },
    {
      id: "init",
      title: "init: settable once, then frozen",
      body: [
        "`public string Id { get; init; }` allows setting in the constructor or object initialiser, but nowhere else. After construction, the setter is gone.",
        "This gives you immutability without writing a constructor parameter for every field — the object initialiser syntax still works.",
      ],
      code: CODE,
      activeLines: [15],
      scene: scene({
        fields: [
          { id: "name-f4", name: "_name", value: "\"Ana\"" },
          { id: "age-f2", name: "<Age>", value: "25" },
          { id: "id-f", name: "<Id>", value: "\"A001\"", state: "success", note: "init-only — frozen after construction" },
        ],
        callout: { tone: "success", text: "init = settable during construction, read-only after. Best of both worlds." },
      }),
    },
    {
      id: "computed",
      title: "Computed property: no storage",
      body: [
        "`public bool IsAdult => Age >= 18` has no backing field at all. It recalculates every time it is read.",
        "Use this for values derived from other fields. It always returns the current answer, and costs one method call per read.",
      ],
      code: CODE,
      activeLines: [18],
      scene: scene({
        fields: [
          { id: "name-f5", name: "_name", value: "\"Ana\"" },
          { id: "age-f3", name: "<Age>", value: "25", state: "read" },
          { id: "adult", name: "IsAdult", value: "true", state: "active", note: "computed — no field, derived from Age" },
        ],
        callout: { tone: "active", text: "No storage. Age >= 18 is evaluated fresh on every access." },
      }),
    },
    {
      id: "recap",
      title: "The spectrum",
      body: [
        "Field → raw slot, no logic. Property → methods wrapping a field. Auto-property → compiler does both. Init-only → writable once. Computed → no storage.",
        "Default to auto-properties for public data. Use fields only when you need `ref` access or when the type is a performance-critical struct.",
      ],
      code: CODE,
      activeLines: [3, 6, 12, 15, 18],
      scene: scene({
        fields: [
          { id: "f1", name: "_name", value: "\"Ana\"", note: "field — raw" },
          { id: "f2", name: "Age", value: "25", note: "auto { get; set; }" },
          { id: "f3", name: "Id", value: "\"A001\"", note: "{ get; init; }" },
          { id: "f4", name: "IsAdult", value: "true", note: "computed =>" },
        ],
        callout: {
          tone: "success",
          text: "Field = data. Property = data + logic. Start with auto-properties; refine as needed.",
        },
      }),
    },
  ],
};
