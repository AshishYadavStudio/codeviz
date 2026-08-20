import type { CellState, Lesson, Region, Scene, TableRow } from "@/lib/viz/types";

const CODE = `import pandas as pd

df = pd.read_csv("sales.csv")

df.shape          # (5, 3) — rows, columns
df.dtypes         # per-column types
df["amount"]      # one column: a Series

mask = df["amount"] > 100        # a boolean Series
df[mask]                          # keep rows where mask is True

df[(df["amount"] > 100) & (df["region"] == "north")]

df.loc[df["amount"] > 100, "amount"] = 0   # filter and assign`;

interface Row {
  id: string;
  region: string;
  rep: string;
  amount: number;
}

const DATA: Row[] = [
  { id: "0", region: "north", rep: "Ana", amount: 120 },
  { id: "1", region: "south", rep: "Ben", amount: 80 },
  { id: "2", region: "north", rep: "Cal", amount: 200 },
  { id: "3", region: "east", rep: "Dee", amount: 95 },
  { id: "4", region: "north", rep: "Eli", amount: 150 },
];

function table(opts: {
  rows?: Row[];
  highlightColumn?: "region" | "rep" | "amount";
  rowState?: (row: Row) => CellState | undefined;
  amountOverride?: (row: Row) => string | undefined;
  footer?: string;
  label?: string;
}): Region {
  const rows = opts.rows ?? DATA;

  const tableRows: TableRow[] = rows.map((row) => {
    const state = opts.rowState?.(row);
    return {
      id: `r${row.id}`,
      label: row.id,
      state: state === "danger" ? "danger" : state === "success" ? "success" : "idle",
      cells: [
        {
          id: `r${row.id}-region`,
          value: row.region,
          state: opts.highlightColumn === "region" ? "read" : state,
        },
        {
          id: `r${row.id}-rep`,
          value: row.rep,
          state: opts.highlightColumn === "rep" ? "read" : state,
        },
        {
          id: `r${row.id}-amount`,
          value: opts.amountOverride?.(row) ?? String(row.amount),
          state: opts.highlightColumn === "amount" ? "read" : state,
        },
      ],
    };
  });

  return {
    id: "df",
    kind: "table",
    label: opts.label ?? "df",
    caption: "a DataFrame is columns, each with one type",
    table: {
      columns: [
        { id: "region", label: "region", note: "object", state: opts.highlightColumn === "region" ? "read" : undefined },
        { id: "rep", label: "rep", note: "object", state: opts.highlightColumn === "rep" ? "read" : undefined },
        { id: "amount", label: "amount", note: "int64", state: opts.highlightColumn === "amount" ? "read" : undefined },
      ],
      rows: tableRows,
      footer: opts.footer,
    },
  };
}

function maskRegion(predicate: (row: Row) => boolean, label: string): Region {
  return {
    id: "mask",
    kind: "table",
    label,
    caption: "one boolean per row, in row order",
    table: {
      columns: [{ id: "value", label: "mask" }],
      rows: DATA.map((row) => {
        const keep = predicate(row);
        return {
          id: `m${row.id}`,
          label: row.id,
          state: keep ? "success" : "idle",
          cells: [
            {
              id: `mc${row.id}`,
              value: keep ? "True" : "False",
              state: keep ? "success" : "padding",
            },
          ],
        };
      }),
    },
  };
}

const scene = (regions: Region[], callout?: Scene["callout"]): Scene => ({ regions, callout });

export const dataframesAndFiltering: Lesson = {
  slug: "dataframes-and-filtering",
  track: "data",
  title: "DataFrames & filtering",
  tagline: "Filtering is not a loop. It is a column of True and False laid over your rows.",
  description:
    "See what a DataFrame actually is, how a comparison produces a boolean mask, why filters need & rather than and, and how loc filters and assigns in one step.",
  difficulty: 1,
  minutes: 9,
  access: "free",
  language: "python",
  filename: "analysis.py",
  keywords: ["pandas", "dataframe", "boolean mask", "filtering", "loc", "vectorised"],
  stages: [
    {
      id: "shape",
      title: "A DataFrame is a set of columns",
      body: [
        "Rows are how you read it, but columns are how it is stored. Each column is a single array with one dtype — `amount` is `int64`, `region` holds Python objects.",
        "That layout is why column operations are fast and why mixing types inside a column quietly makes everything slower.",
      ],
      code: CODE,
      activeLines: [3, 5, 6],
      scene: scene([table({ footer: "5 rows × 3 columns" })], {
        tone: "info",
        text: "df.shape is (5, 3) — rows first, then columns.",
      }),
    },
    {
      id: "column",
      title: "One column is a Series",
      body: [
        "`df[\"amount\"]` returns a `Series`: the column's values plus the index that labels each row.",
        "The index travels with the data. That is what lets pandas line values up correctly when you combine columns or assign results back.",
      ],
      code: CODE,
      activeLines: [7],
      scene: scene([table({ highlightColumn: "amount", footer: "df['amount'] → Series of 5 int64" })], {
        tone: "active",
        text: "A DataFrame is a dict of Series that share one index.",
      }),
    },
    {
      id: "mask",
      title: "A comparison produces a whole column of booleans",
      body: [
        "`df[\"amount\"] > 100` does not return one answer. It compares every element at once and returns a `Series` of `True`/`False` the same length as the frame.",
        "There is no loop written and none run in Python — the comparison happens in compiled code over the whole array.",
      ],
      code: CODE,
      activeLines: [9],
      scene: scene(
        [
          table({ highlightColumn: "amount" }),
          maskRegion((r) => r.amount > 100, "mask = df['amount'] > 100"),
        ],
        { tone: "active", text: "Three True, two False — one boolean per row, aligned by index." },
      ),
    },
    {
      id: "apply",
      title: "Indexing with the mask keeps the True rows",
      body: [
        "`df[mask]` returns a new frame containing only the rows whose mask value is `True`. The original `df` is unchanged.",
        "Notice the index: the surviving rows keep their original labels 0, 2 and 4. Filtering does not renumber anything, which is why an index can have gaps.",
      ],
      code: CODE,
      activeLines: [10],
      scene: scene(
        [
          maskRegion((r) => r.amount > 100, "the mask"),
          table({
            rows: DATA.filter((r) => r.amount > 100),
            rowState: () => "success",
            footer: "3 rows × 3 columns · index 0, 2, 4",
            label: "df[mask]",
          }),
        ],
        { tone: "success", text: "Gaps in the index are normal after filtering. reset_index(drop=True) renumbers if you need it." },
      ),
    },
    {
      id: "combine",
      title: "Combine conditions with & and |",
      body: [
        "Each condition produces its own boolean column, and `&` combines them element by element into a third.",
        "You must use `&` and `|`, not `and` and `or`. The Python keywords demand a single true/false value and raise \"truth value of a Series is ambiguous\" when handed a whole column.",
        "The parentheses are not optional either: `&` binds more tightly than `>`, so without them the expression is grouped wrongly and fails.",
      ],
      code: CODE,
      activeLines: [12],
      scene: scene(
        [
          table({
            rowState: (r) => (r.amount > 100 && r.region === "north" ? "success" : undefined),
            footer: "amount > 100  &  region == 'north'",
          }),
        ],
        {
          tone: "danger",
          text: "Write (df['a'] > 1) & (df['b'] == 'x'). Both the symbols and the brackets matter.",
        },
      ),
    },
    {
      id: "loc",
      title: "loc filters and assigns in one step",
      body: [
        "`df.loc[condition, \"amount\"] = 0` selects rows *and* a column, then writes to that selection in place.",
        "Doing it in two steps — `df[df[\"amount\"] > 100][\"amount\"] = 0` — usually fails with a `SettingWithCopyWarning`, because the first bracket may return a copy and the assignment lands on a temporary that is thrown away.",
      ],
      code: CODE,
      activeLines: [14],
      scene: scene(
        [
          table({
            amountOverride: (r) => (r.amount > 100 ? "0" : undefined),
            rowState: (r) => (r.amount > 100 ? "success" : undefined),
            footer: "modified in place",
          }),
        ],
        {
          tone: "success",
          text: "One bracket for reading, .loc[rows, cols] for writing. That habit avoids the whole chained-assignment problem.",
        },
      ),
    },
    {
      id: "why",
      title: "Why this beats a loop",
      body: [
        "The mask approach hands the entire operation to compiled code that walks contiguous memory, instead of stepping through rows one at a time in the interpreter.",
        "On a million rows that difference is typically two orders of magnitude. The rule of thumb: if you are writing `for` over a DataFrame, there is almost always a column operation that replaces it.",
      ],
      code: CODE,
      activeLines: [9, 10],
      scene: scene([table({ highlightColumn: "amount" })], {
        tone: "success",
        text: "Think in columns, not rows. Every technique in this track builds on that.",
      }),
    },
  ],
};
