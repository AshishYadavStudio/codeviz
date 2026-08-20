import type { CellState, Lesson, Scene } from "@/lib/viz/types";
import { stackRegion } from "@/lib/viz/scene-helpers";

const CODE = `int  x = 42;       // always has a value
int? y = null;     // Nullable<int> — may be absent
int? z = 7;

// Check before use
if (y.HasValue)
    Console.WriteLine(y.Value);

// Null-coalescing: default if null
int safe = y ?? 0;              // 0

// Null-conditional: short-circuit on null
string? name = null;            // nullable reference type
int? len = name?.Length;        // null, no exception

// Pattern matching
string Describe(int? n) => n switch {
    null      => "absent",
    < 0       => "negative",
    0         => "zero",
    int val   => $"positive: {val}"
};`;

function scene(opts: {
  vars: { id: string; name: string; type: string; value: string; hasValue: string; state?: CellState; note?: string }[];
  callout?: Scene["callout"];
}): Scene {
  return {
    regions: [
      stackRegion([{
        id: "main",
        label: "Main()",
        state: "active",
        cells: opts.vars.map((v) => ({
          id: v.id,
          name: v.name,
          type: v.type,
          value: v.value,
          state: v.state ?? "idle",
          note: v.note ?? `HasValue: ${v.hasValue}`,
        })),
      }], "nullable value types are structs with a flag"),
    ],
    callout: opts.callout,
  };
}

export const nullableTypes: Lesson = {
  slug: "nullable-types",
  track: "csharp",
  title: "Nullable value types & null safety",
  tagline: "int? is a struct; nullable reference types are a compiler promise.",
  description:
    "See how int? wraps an int with a HasValue flag on the stack, how ?? and ?. avoid null checks, and how nullable reference types differ — they are annotations, not runtime wrappers.",
  difficulty: 2,
  minutes: 8,
  access: "free",
  language: "csharp",
  keywords: ["nullable", "int?", "null coalescing", "null conditional", "Nullable<T>"],
  intro: [
    "A regular `int` cannot be null — it always holds a number. But real data has gaps: a database field that might be NULL, an optional config value, a form input someone left blank.",
    "C# gives you two answers. `int?` (nullable value type) is a real struct that wraps the int with a \"do I have a value?\" flag — a runtime construct. `string?` (nullable reference type) is a compiler annotation only, telling the checker \"this might be null\", with zero runtime cost.",
    "This lesson visualises both, and shows the `??` and `?.` operators that make working with maybe-null values a lot less painful.",
  ],
  stages: [
    {
      id: "non-null",
      title: "int always has a value",
      body: [
        "`int x = 42` stores 42. You cannot assign `null` to an `int` — the compiler rejects it. A value type always contains a value.",
        "But sometimes \"no value\" is a legitimate state: a database field that can be NULL, an optional configuration setting. That is what `int?` is for.",
      ],
      code: CODE,
      activeLines: [1],
      scene: scene({
        vars: [
          { id: "x", name: "x", type: "int", value: "42", hasValue: "always", state: "active", note: "4 bytes" },
        ],
        callout: { tone: "info", text: "int cannot be null. The type guarantees a value exists." },
      }),
    },
    {
      id: "nullable-null",
      title: "int? adds a HasValue flag",
      body: [
        "`int? y = null` is syntactic sugar for `Nullable<int>`. It is a struct with two fields: a `bool HasValue` and an `int Value`. When null, HasValue is false and Value is undefined.",
        "This is not a reference — it lives on the stack, costs 8 bytes (4 for the int, 1 for the bool, 3 padding), and has no heap allocation.",
      ],
      code: CODE,
      activeLines: [2],
      scene: scene({
        vars: [
          { id: "x2", name: "x", type: "int", value: "42", hasValue: "always" },
          { id: "y", name: "y", type: "int?", value: "—", hasValue: "false", state: "danger", note: "null · 8 bytes on stack" },
        ],
        callout: { tone: "active", text: "int? is a struct: { bool HasValue; int Value; }. No heap involved." },
      }),
    },
    {
      id: "nullable-value",
      title: "int? with a value",
      body: [
        "`int? z = 7` sets HasValue to true and Value to 7. Accessing `.Value` when HasValue is false throws `InvalidOperationException`.",
        "The compiler does not prevent you from accessing `.Value` without checking — that is your responsibility.",
      ],
      code: CODE,
      activeLines: [3],
      scene: scene({
        vars: [
          { id: "x3", name: "x", type: "int", value: "42", hasValue: "always" },
          { id: "y2", name: "y", type: "int?", value: "—", hasValue: "false", state: "danger" },
          { id: "z", name: "z", type: "int?", value: "7", hasValue: "true", state: "active" },
        ],
        callout: { tone: "active", text: "HasValue: true, Value: 7. Always check before accessing .Value." },
      }),
    },
    {
      id: "coalesce",
      title: "?? provides a default",
      body: [
        "`y ?? 0` evaluates to `y.Value` if y has a value, or `0` if it does not. No exception, no if-check — one expression.",
        "This is the null-coalescing operator. It works on both nullable value types and reference types.",
      ],
      code: CODE,
      activeLines: [9],
      scene: scene({
        vars: [
          { id: "y3", name: "y", type: "int?", value: "—", hasValue: "false", state: "read" },
          { id: "safe", name: "safe", type: "int", value: "0", hasValue: "always", state: "success", note: "y was null → used default" },
        ],
        callout: { tone: "success", text: "y ?? 0 → y is null, so the result is 0. One line, no branch." },
      }),
    },
    {
      id: "null-conditional",
      title: "?. short-circuits on null",
      body: [
        "`name?.Length` checks if name is null. If so, the entire expression evaluates to null — no NullReferenceException. If not null, it evaluates `.Length` normally.",
        "The result type is `int?` because the operation might produce null. This propagates: you can chain `a?.b?.c` and null at any point stops the chain.",
      ],
      code: CODE,
      activeLines: [12, 13],
      scene: scene({
        vars: [
          { id: "name", name: "name", type: "string?", value: "null", hasValue: "false", state: "danger" },
          { id: "len", name: "len", type: "int?", value: "null", hasValue: "false", state: "read", note: "short-circuited" },
        ],
        callout: { tone: "info", text: "name is null → name?.Length is null. No exception thrown." },
      }),
    },
    {
      id: "recap",
      title: "Two kinds of nullable",
      body: [
        "`int?` is a runtime struct that actually wraps the value with a flag. `string?` is a compile-time annotation — at runtime, it is just a regular `string` that the compiler warns you might be null.",
        "Both use the same `?.` and `??` operators. The difference: `int?` costs memory (the HasValue flag), `string?` costs nothing at runtime — it is purely a linting aid.",
      ],
      code: CODE,
      activeLines: [2, 12],
      scene: scene({
        vars: [
          { id: "yf", name: "y", type: "int?", value: "—", hasValue: "false", note: "struct wrapper — runtime" },
          { id: "nf", name: "name", type: "string?", value: "null", hasValue: "false", note: "annotation — compile-time" },
        ],
        callout: {
          tone: "success",
          text: "int? = Nullable<int> struct on the stack. string? = compiler annotation, same reference at runtime.",
        },
      }),
    },
  ],
};
