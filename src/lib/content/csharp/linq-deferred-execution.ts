import type { Frame, Lesson, Region, Scene } from "@/lib/viz/types";
import { blocksRegion } from "@/lib/viz/scene-helpers";

const CODE = `int[] numbers = { 1, 2, 3, 4, 5, 6 };

var query = numbers
    .Where(n => n % 2 == 0)     // nothing runs yet
    .Select(n => n * 10);       // still nothing

foreach (var n in query) { }    // now it runs

var list = query.ToList();      // runs again, from scratch

var first = numbers.Where(n => n > 3).First();  // stops early`;

const SOURCE = [1, 2, 3, 4, 5, 6];

/** Each operator is a stage; one element flows through at a time. */
function pipeline(opts: {
  current?: number;
  stage?: "source" | "where" | "select" | "sink";
  passed?: boolean;
  emitted: number[];
  built?: boolean;
  stopAt?: number;
}): Frame[] {
  const active = (s: string) => (opts.stage === s ? "active" : opts.built ? "idle" : "idle");

  return [
    {
      id: "source",
      label: "numbers[]",
      state: active("source") as Frame["state"],
      badge: opts.stopAt ? `stopped after ${opts.stopAt}` : "the only real collection",
      cells: SOURCE.map((n) => ({
        id: `s${n}`,
        value: String(n),
        state:
          opts.stopAt && n > opts.stopAt
            ? "padding"
            : opts.current === n
              ? "active"
              : "idle",
        row: 0,
      })),
    },
    {
      id: "where",
      label: "Where(n => n % 2 == 0)",
      state: active("where") as Frame["state"],
      badge: "a filter, not a collection",
      cells: [
        {
          id: "w-in",
          name: "in",
          value: opts.current !== undefined ? String(opts.current) : "—",
          state: opts.stage === "where" ? "active" : "idle",
          row: 0,
        },
        {
          id: "w-out",
          name: "passes?",
          value:
            opts.current === undefined
              ? "—"
              : opts.passed
                ? "yes"
                : "no",
          state:
            opts.current === undefined
              ? "idle"
              : opts.passed
                ? "success"
                : "danger",
          row: 0,
        },
      ],
    },
    {
      id: "select",
      label: "Select(n => n * 10)",
      state: active("select") as Frame["state"],
      badge: "a projection",
      cells: [
        {
          id: "sel-out",
          name: "yields",
          value: opts.stage === "select" && opts.current !== undefined ? String(opts.current * 10) : "—",
          state: opts.stage === "select" ? "active" : "idle",
          row: 0,
        },
      ],
    },
    {
      id: "sink",
      label: opts.built ? "ToList()" : "foreach",
      state: active("sink") as Frame["state"],
      badge: opts.built ? "materialised" : "pulls one at a time",
      cells:
        opts.emitted.length === 0
          ? [{ id: "sink-empty", value: "nothing yet", state: "garbage", row: 0 }]
          : opts.emitted.map((n, i) => ({
              id: `e${i}`,
              value: String(n),
              state: (i === opts.emitted.length - 1 ? "active" : "success") as "active" | "success",
              row: 0,
            })),
    },
  ];
}

const scene = (frames: Frame[], callout?: Scene["callout"], extra?: Region[]): Scene => ({
  regions: [
    blocksRegion("pipe", "LINQ pipeline", frames, "data is pulled from the end, not pushed from the start"),
    ...(extra ?? []),
  ],
  callout,
});

export const linqDeferredExecution: Lesson = {
  slug: "linq-deferred-execution",
  track: "csharp",
  title: "LINQ & deferred execution",
  tagline: "Building a query runs nothing. The last operator pulls each element through, one at a time.",
  description:
    "Step an element at a time through Where and Select to see why LINQ is lazy, why enumerating twice runs the query twice, and how First stops early.",
  difficulty: 2,
  minutes: 10,
  access: "free",
  language: "csharp",
  filename: "Program.cs",
  keywords: ["LINQ", "deferred execution", "IEnumerable", "lazy evaluation", "ToList", "yield"],
  stages: [
    {
      id: "build",
      title: "Defining the query executes nothing",
      body: [
        "After both lines, `query` holds an object that *describes* the work — a `Where` wrapped around the array, and a `Select` wrapped around that.",
        "No element has been examined. No lambda has been called. Set a breakpoint inside the `Where` predicate and it will not be hit yet.",
      ],
      code: CODE,
      activeLines: [3, 4, 5],
      scene: scene(pipeline({ emitted: [] }), {
        tone: "info",
        text: "var query is not a result. It is a recipe, and recipes do not cook themselves.",
      }),
    },
    {
      id: "first-pull",
      title: "foreach asks for the first element",
      body: [
        "Enumeration starts at the *end* of the chain. `foreach` asks `Select` for an element, `Select` asks `Where`, and `Where` asks the array.",
        "The array offers 1. The predicate runs: `1 % 2 == 0` is false, so `Where` discards it and asks for the next one.",
      ],
      code: CODE,
      activeLines: [7],
      scene: scene(pipeline({ current: 1, stage: "where", passed: false, emitted: [] }), {
        tone: "active",
        text: "Pull, not push. Nothing is produced until something downstream asks for it.",
      }),
    },
    {
      id: "pass",
      title: "2 passes the filter and reaches Select",
      body: [
        "The array offers 2, `2 % 2 == 0` is true, so `Where` hands it upward. `Select` multiplies it by 10 and yields 20 to the `foreach` body.",
        "One element has travelled the whole pipeline. Elements 3 to 6 have not been looked at yet.",
      ],
      code: CODE,
      activeLines: [4, 5],
      scene: scene(pipeline({ current: 2, stage: "select", passed: true, emitted: [20] }), {
        tone: "active",
        text: "One element all the way through, then back for the next. No intermediate arrays are ever built.",
      }),
    },
    {
      id: "streaming",
      title: "This is why LINQ handles huge sequences",
      body: [
        "Because only one element is in flight at a time, the pipeline works on a million-row file or an infinite generator without allocating a million-element temporary.",
        "Chaining ten operators does not create ten intermediate collections — it creates ten small objects that each pull from the previous.",
      ],
      code: CODE,
      activeLines: [3, 4, 5],
      scene: scene(pipeline({ current: 6, stage: "select", passed: true, emitted: [20, 40, 60] }), {
        tone: "success",
        text: "Constant memory regardless of source size. That is the payoff for being lazy.",
      }),
    },
    {
      id: "twice",
      title: "Enumerating again runs everything again",
      body: [
        "`query.ToList()` starts a *fresh* enumeration. Every predicate and projection runs a second time, from the first element.",
        "If the source is a database or a file, that is a second round trip. If the lambdas have side effects, they happen twice.",
      ],
      code: CODE,
      activeLines: [9],
      scene: scene(pipeline({ current: 2, stage: "where", passed: true, emitted: [], built: true }), {
        tone: "danger",
        text: "The classic bug: a query passed around and enumerated in three places, quietly doing the work three times.",
      }),
    },
    {
      id: "materialise",
      title: "ToList() ends the laziness",
      body: [
        "`ToList` and `ToArray` walk the pipeline once and store the results. From then on you are holding a real collection, and reading it costs nothing extra.",
        "The rule of thumb: keep it lazy while you are still composing, materialise once at the point where you actually need the values — especially before enumerating more than once.",
      ],
      code: CODE,
      activeLines: [9],
      scene: scene(pipeline({ emitted: [20, 40, 60], built: true, stage: "sink" }), {
        tone: "success",
        text: "One enumeration, results kept. Note that Count() on a lazy query re-runs it; on a List it does not.",
      }),
    },
    {
      id: "short-circuit",
      title: "First() stops as soon as it can",
      body: [
        "`numbers.Where(n => n > 3).First()` examines 1, 2, 3, then 4 — and returns immediately. Elements 5 and 6 are never touched.",
        "That only works because of deferred execution. Had `Where` eagerly built a filtered list, all six would have been tested first.",
        "The same applies to `Any`, `Take` and `FirstOrDefault`. Putting the cheapest, most selective filter earliest genuinely saves work.",
      ],
      code: CODE,
      activeLines: [11],
      scene: scene(
        pipeline({ current: 4, stage: "where", passed: true, emitted: [4], stopAt: 4 }),
        {
          tone: "success",
          text: "Laziness is not only about memory. It lets the pipeline stop the moment the answer is known.",
        },
      ),
    },
  ],
};
