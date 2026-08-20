import type { Lesson, Region, Scene } from "@/lib/viz/types";

const CODE = `import pandas as pd

df = pd.read_csv("sales.csv")

df.groupby("region")["amount"].sum()

df.groupby("region").agg(
    total=("amount", "sum"),
    deals=("amount", "count"),
    best=("amount", "max"),
)

df.groupby("region", as_index=False)["amount"].sum()

df.groupby("region")["amount"].transform("sum")   # same shape as df`;

interface Row {
  id: string;
  region: string;
  amount: number;
}

const DATA: Row[] = [
  { id: "0", region: "north", amount: 120 },
  { id: "1", region: "south", amount: 80 },
  { id: "2", region: "north", amount: 200 },
  { id: "3", region: "east", amount: 95 },
  { id: "4", region: "north", amount: 150 },
  { id: "5", region: "south", amount: 60 },
];

const GROUP_STATE = {
  north: "active",
  south: "read",
  east: "success",
} as const;

function sourceTable(opts: { grouped?: boolean; highlight?: string; footer?: string }): Region {
  const rows = opts.grouped
    ? [...DATA].sort((a, b) => a.region.localeCompare(b.region))
    : DATA;

  return {
    id: "src",
    kind: "table",
    label: opts.grouped ? "split: rows bucketed by key" : "df",
    caption: opts.grouped ? "conceptually — pandas does not physically reorder" : "6 rows",
    table: {
      columns: [
        { id: "region", label: "region", note: "the key" },
        { id: "amount", label: "amount" },
      ],
      rows: rows.map((row) => ({
        id: `r${row.id}`,
        label: row.id,
        state:
          opts.highlight && row.region !== opts.highlight
            ? "idle"
            : opts.grouped
              ? GROUP_STATE[row.region as keyof typeof GROUP_STATE]
              : "idle",
        cells: [
          {
            id: `r${row.id}-region`,
            value: row.region,
            state: opts.grouped ? GROUP_STATE[row.region as keyof typeof GROUP_STATE] : "idle",
          },
          {
            id: `r${row.id}-amount`,
            value: String(row.amount),
            state: opts.highlight === row.region ? "active" : "idle",
          },
        ],
      })),
      footer: opts.footer,
    },
  };
}

function resultTable(opts: {
  columns: { id: string; label: string; note?: string }[];
  rows: { key: string; values: string[]; state?: "idle" | "active" | "success" }[];
  label: string;
  caption?: string;
  footer?: string;
}): Region {
  return {
    id: "result",
    kind: "table",
    label: opts.label,
    caption: opts.caption,
    table: {
      columns: opts.columns,
      rows: opts.rows.map((r) => ({
        id: `g-${r.key}`,
        label: r.key,
        state: r.state ?? "idle",
        cells: r.values.map((v, i) => ({
          id: `g-${r.key}-${i}`,
          value: v,
          state: r.state === "active" ? "active" : "idle",
        })),
      })),
      footer: opts.footer,
    },
  };
}

const scene = (regions: Region[], callout?: Scene["callout"]): Scene => ({ regions, callout });

export const groupBy: Lesson = {
  slug: "group-by",
  track: "data",
  title: "Group-by: split, apply, combine",
  tagline: "Three steps, one line of code. Knowing the three is what makes the line predictable.",
  description:
    "Watch rows split into buckets by key, an aggregation collapse each bucket to one value, and the results combine into a new frame — plus when to use transform instead.",
  difficulty: 2,
  minutes: 10,
  access: "free",
  language: "python",
  filename: "analysis.py",
  keywords: ["groupby", "split apply combine", "aggregation", "pandas", "transform", "agg"],
  intro: [
    "\"Total sales per region\", \"average score per class\", \"count of orders per customer\" — all of these follow the same pattern: split the rows into groups, apply a function to each group, combine the results.",
    "Pandas gives you this with `.groupby()`. It looks like a single line of code, but three separate steps are happening: **split** (bucket rows by group key), **apply** (compute per bucket), **combine** (glue results back into one frame).",
    "This lesson breaks that one line into its three phases so you can see exactly what happens between `.groupby(\"region\")` and the final result.",
  ],
  stages: [
    {
      id: "start",
      title: "Six rows, three regions",
      body: [
        "The question is \"how much did each region sell?\". Answering it by hand means sorting the rows into piles and adding up each pile.",
        "`groupby` is that process, named. Every group-by is three steps: **split** the rows by key, **apply** a function to each group, **combine** the answers.",
      ],
      code: CODE,
      activeLines: [3],
      scene: scene([sourceTable({ footer: "6 rows, 3 distinct regions" })], {
        tone: "info",
        text: "The key column decides the piles. Everything else follows from that choice.",
      }),
    },
    {
      id: "split",
      title: "Split: rows are bucketed by key",
      body: [
        "Each distinct value of `region` becomes a group: north has three rows, south two, east one.",
        "Nothing is computed yet. `df.groupby(\"region\")` on its own just returns a lazy `GroupBy` object — printing it tells you nothing useful, which surprises people.",
      ],
      code: CODE,
      activeLines: [5],
      scene: scene([sourceTable({ grouped: true, footer: "north 3 · south 2 · east 1" })], {
        tone: "active",
        text: "Three groups. No aggregation has run — this step only decides membership.",
      }),
    },
    {
      id: "apply",
      title: "Apply: each group collapses to one value",
      body: [
        "`[\"amount\"].sum()` runs on each bucket independently. North's three values become 470; south's two become 140; east's single row becomes 95.",
        "Any function that reduces many values to one works here: `mean`, `count`, `max`, `median`, or your own via `agg`.",
      ],
      code: CODE,
      activeLines: [5],
      scene: scene(
        [
          sourceTable({ grouped: true, highlight: "north" }),
          resultTable({
            label: "apply: sum per group",
            columns: [{ id: "amount", label: "amount" }],
            rows: [
              { key: "north", values: ["470"], state: "active" },
              { key: "south", values: ["140"] },
              { key: "east", values: ["95"] },
            ],
          }),
        ],
        { tone: "active", text: "120 + 200 + 150 = 470. Each group is reduced on its own." },
      ),
    },
    {
      id: "combine",
      title: "Combine: the keys become the index",
      body: [
        "The per-group answers are assembled into a new `Series` whose **index is the grouping key**. There are three rows out because there were three distinct keys in.",
        "This is why the result no longer has a `region` column — `region` was promoted to the index. That catches people on the next line, when they try to select it as a column.",
      ],
      code: CODE,
      activeLines: [5],
      scene: scene(
        [
          resultTable({
            label: "df.groupby('region')['amount'].sum()",
            caption: "index = region, values = the sums",
            columns: [{ id: "amount", label: "amount" }],
            rows: [
              { key: "north", values: ["470"], state: "success" },
              { key: "south", values: ["140"], state: "success" },
              { key: "east", values: ["95"], state: "success" },
            ],
            footer: "3 rows — one per group",
          }),
        ],
        { tone: "success", text: "Rows in: 6. Rows out: 3. An aggregation always shrinks to one row per key." },
      ),
    },
    {
      id: "as-index",
      title: "as_index=False keeps it a normal column",
      body: [
        "If you would rather have `region` stay an ordinary column — for a later merge, or to write to CSV — pass `as_index=False`.",
        "`reset_index()` afterwards does the same thing. Both are common; neither changes the numbers.",
      ],
      code: CODE,
      activeLines: [13],
      scene: scene(
        [
          resultTable({
            label: "as_index=False",
            caption: "region is a column again, index is 0,1,2",
            columns: [
              { id: "region", label: "region" },
              { id: "amount", label: "amount" },
            ],
            rows: [
              { key: "0", values: ["north", "470"] },
              { key: "1", values: ["south", "140"] },
              { key: "2", values: ["east", "95"] },
            ],
          }),
        ],
        { tone: "info", text: "Same aggregation, different shape. Choose based on what the next step needs." },
      ),
    },
    {
      id: "agg",
      title: "agg computes several things at once",
      body: [
        "Named aggregation gives each output column a name and a `(column, function)` pair, so one pass produces total, count and max together.",
        "This is both faster and clearer than grouping three separate times and merging the results.",
      ],
      code: CODE,
      activeLines: [7, 8, 9, 10, 11],
      scene: scene(
        [
          resultTable({
            label: "df.groupby('region').agg(...)",
            columns: [
              { id: "total", label: "total", note: "sum" },
              { id: "deals", label: "deals", note: "count" },
              { id: "best", label: "best", note: "max" },
            ],
            rows: [
              { key: "north", values: ["470", "3", "200"], state: "success" },
              { key: "south", values: ["140", "2", "80"], state: "success" },
              { key: "east", values: ["95", "1", "95"], state: "success" },
            ],
          }),
        ],
        { tone: "success", text: "One split, three applies, one combine. Grouping by several keys works the same way." },
      ),
    },
    {
      id: "transform",
      title: "transform broadcasts the answer back",
      body: [
        "Sometimes you want each row to know its group's total — to compute a share of region, say. `agg` cannot do that, because it returns one row per group.",
        "`transform` applies the same function but returns a result **the same length as the original**, with each group's answer repeated across its rows. That makes it directly assignable as a new column.",
      ],
      code: CODE,
      activeLines: [15],
      scene: scene(
        [
          {
            id: "result",
            kind: "table",
            label: "df with the group total attached",
            caption: "6 rows in, 6 rows out",
            table: {
              columns: [
                { id: "region", label: "region" },
                { id: "amount", label: "amount" },
                { id: "total", label: "region_total", note: "transform('sum')" },
              ],
              rows: DATA.map((row) => {
                const totals: Record<string, string> = { north: "470", south: "140", east: "95" };
                return {
                  id: `t${row.id}`,
                  label: row.id,
                  cells: [
                    { id: `t${row.id}-r`, value: row.region },
                    { id: `t${row.id}-a`, value: String(row.amount) },
                    { id: `t${row.id}-t`, value: totals[row.region], state: "active" },
                  ],
                };
              }),
            },
          },
        ],
        {
          tone: "success",
          text: "agg to summarise, transform to annotate. If the row count changed and you did not want it to, you wanted transform.",
        },
      ),
    },
  ],
};
