import type { CellState, Lesson, Region, Scene } from "@/lib/viz/types";

const CODE = `import pandas as pd
import numpy as np

df.isna().sum()             # count missing per column

df.dropna()                  # drop any row with a gap
df.dropna(subset=["score"])  # only care about one column

df["score"].fillna(0)              # a constant
df["score"].fillna(df["score"].mean())   # the column mean
df["score"].ffill()                 # carry the last value forward

df["score"].mean()          # skips NaN by default
len(df["score"])            # counts NaN
df["score"].count()         # does not`;

interface Row {
  id: string;
  name: string;
  score: number | null;
  city: string | null;
}

const DATA: Row[] = [
  { id: "0", name: "Ana", score: 80, city: "north" },
  { id: "1", name: "Ben", score: null, city: "south" },
  { id: "2", name: "Cal", score: 60, city: null },
  { id: "3", name: "Dee", score: null, city: null },
  { id: "4", name: "Eli", score: 100, city: "east" },
];

function table(opts: {
  rows?: Row[];
  scoreOverride?: (row: Row) => string | undefined;
  label?: string;
  footer?: string;
  markMissing?: boolean;
}): Region {
  const rows = opts.rows ?? DATA;

  const cellFor = (row: Row, value: string | number | null, id: string) => {
    const isMissing = value === null;
    return {
      id,
      value: isMissing ? "NaN" : String(value),
      state: (isMissing && opts.markMissing !== false ? "danger" : "idle") as CellState,
    };
  };

  return {
    id: "df",
    kind: "table",
    label: opts.label ?? "df",
    caption: "NaN is a float value, not an empty cell",
    table: {
      columns: [
        { id: "name", label: "name" },
        { id: "score", label: "score", note: "float64" },
        { id: "city", label: "city", note: "object" },
      ],
      rows: rows.map((row) => {
        const override = opts.scoreOverride?.(row);
        return {
          id: `r${row.id}`,
          label: row.id,
          state: row.score === null || row.city === null ? "idle" : "idle",
          cells: [
            { id: `r${row.id}-n`, value: row.name },
            override !== undefined
              ? { id: `r${row.id}-s`, value: override, state: "success" as CellState }
              : cellFor(row, row.score, `r${row.id}-s`),
            cellFor(row, row.city, `r${row.id}-c`),
          ],
        };
      }),
      footer: opts.footer,
    },
  };
}

const countRegion = (): Region => ({
  id: "counts",
  kind: "table",
  label: "df.isna().sum()",
  table: {
    columns: [{ id: "missing", label: "missing" }],
    rows: [
      { id: "cn", label: "name", cells: [{ id: "cn-v", value: "0", state: "success" }] },
      { id: "cs", label: "score", cells: [{ id: "cs-v", value: "2", state: "danger" }] },
      { id: "cc", label: "city", cells: [{ id: "cc-v", value: "2", state: "danger" }] },
    ],
  },
});

const scene = (regions: Region[], callout?: Scene["callout"]): Scene => ({ regions, callout });

export const missingData: Lesson = {
  slug: "missing-data",
  track: "data",
  title: "Missing data & NaN",
  tagline: "A gap is a value. Deciding what it means is your job, not pandas'.",
  description:
    "See what NaN really is, why dropping rows can quietly bias your results, how each fill strategy changes the numbers, and which operations skip missing values.",
  difficulty: 2,
  minutes: 9,
  access: "free",
  language: "python",
  filename: "analysis.py",
  keywords: ["NaN", "missing data", "dropna", "fillna", "imputation", "pandas"],
  intro: [
    "Real data has gaps. A survey response is blank, a sensor was offline, a database field was NULL. Pandas represents these gaps with a special value: `NaN` (\"not a number\").",
    "How you handle NaN is a design decision, not a technical one. Drop the rows? Fill with zero? Fill with the average? Each choice tells a different story — some are honest, some silently distort your answer.",
    "This lesson shows the three common strategies (`dropna`, `fillna`, forward-fill) and points out the traps: e.g., `sum()` skips NaN silently, so a column that's mostly missing can produce a suspiciously small total.",
  ],
  stages: [
    {
      id: "look",
      title: "Find the gaps before anything else",
      body: [
        "`isna()` returns a frame of booleans; summing it counts the missing values per column. Two scores and two cities are absent.",
        "Do this first, every time. Every later decision — drop, fill, or leave alone — depends on how much is missing and where.",
      ],
      code: CODE,
      activeLines: [4],
      scene: scene([table({}), countRegion()], {
        tone: "info",
        text: "NaN is a floating-point value, which is why an int column with a gap becomes float64.",
      }),
    },
    {
      id: "dropna",
      title: "dropna() removes any row with any gap",
      body: [
        "Five rows become two. Row 2 was discarded because its city was missing, even though its score was perfectly good.",
        "That is the danger: the default drops a row for a gap in *any* column, including columns you were not going to use.",
      ],
      code: CODE,
      activeLines: [6],
      scene: scene(
        [
          table({
            rows: DATA.filter((r) => r.score !== null && r.city !== null),
            label: "df.dropna()",
            footer: "2 of 5 rows survive — 60% of the data gone",
          }),
        ],
        {
          tone: "danger",
          text: "Rows are rarely missing at random. Dropping them usually removes a particular kind of record, which biases the result.",
        },
      ),
    },
    {
      id: "subset",
      title: "subset limits it to the columns you care about",
      body: [
        "`dropna(subset=[\"score\"])` only removes rows where the score is missing. Row 2 stays, missing city and all.",
        "If you are about to compute an average score, this is the honest version of dropping: it removes exactly the rows that cannot contribute.",
      ],
      code: CODE,
      activeLines: [7],
      scene: scene(
        [
          table({
            rows: DATA.filter((r) => r.score !== null),
            label: "df.dropna(subset=['score'])",
            footer: "3 rows — city gaps tolerated",
          }),
        ],
        { tone: "active", text: "Be specific about which column's absence actually invalidates the row." },
      ),
    },
    {
      id: "fill-constant",
      title: "fillna(0) is a decision, not a cleanup",
      body: [
        "Replacing missing scores with 0 asserts that those people scored zero. If the score was simply not recorded, you have invented two failing results.",
        "The mean drops from 80 to 48 as a direct consequence. A constant fill is right when the gap genuinely means \"none\" — an unpaid invoice, a product with no discount.",
      ],
      code: CODE,
      activeLines: [9],
      scene: scene(
        [
          table({
            scoreOverride: (r) => (r.score === null ? "0" : undefined),
            label: "fillna(0)",
            footer: "mean is now 48, was 80",
          }),
        ],
        { tone: "danger", text: "Zero is a value with meaning. Do not use it as a synonym for \"unknown\"." },
      ),
    },
    {
      id: "fill-mean",
      title: "Filling with the mean keeps the average but flattens the spread",
      body: [
        "Substituting the column mean (80) leaves the average unchanged, which sounds harmless. It is not: variance shrinks, and any correlation involving that column is weakened.",
        "It is a reasonable default for a small number of gaps in a roughly symmetric column. Use the median instead when the data is skewed or has outliers.",
      ],
      code: CODE,
      activeLines: [10],
      scene: scene(
        [
          table({
            scoreOverride: (r) => (r.score === null ? "80.0" : undefined),
            label: "fillna(df['score'].mean())",
            footer: "mean still 80 · standard deviation reduced",
          }),
        ],
        {
          tone: "info",
          text: "Record what you filled. An imputation flag column costs nothing and saves the analysis later.",
        },
      ),
    },
    {
      id: "ffill",
      title: "ffill carries the previous value forward",
      body: [
        "Forward-fill takes the last known value and repeats it into the gap. For an ordered series — a sensor reading, a daily price, a running status — this is often the most defensible choice.",
        "It is meaningless on unordered rows. Sort by time first, and be aware that a leading gap has nothing before it to carry, so it stays `NaN`.",
      ],
      code: CODE,
      activeLines: [11],
      scene: scene(
        [
          table({
            scoreOverride: (r) => {
              if (r.score !== null) return undefined;
              return r.id === "1" ? "80.0" : "60.0";
            },
            label: "df['score'].ffill()",
            footer: "each gap takes the value above it",
          }),
        ],
        { tone: "active", text: "Only valid when row order carries meaning. On shuffled data it is nonsense." },
      ),
    },
    {
      id: "skipna",
      title: "Aggregations already ignore NaN",
      body: [
        "`mean()`, `sum()` and friends skip missing values by default. The mean of the three real scores is 80 — the gaps did not drag it toward zero.",
        "But `len(df)` counts every row while `count()` counts only non-missing ones. Dividing by the wrong one is a quiet, common error.",
        "Often the best move is to fill nothing at all: let the aggregations skip the gaps, and report how many there were.",
      ],
      code: CODE,
      activeLines: [13, 14, 15],
      scene: scene(
        [
          table({}),
          {
            id: "aggs",
            kind: "table",
            label: "what each one reports",
            table: {
              columns: [{ id: "value", label: "value" }],
              rows: [
                { id: "a1", label: "mean()", cells: [{ id: "a1v", value: "80.0", state: "success" }] },
                { id: "a2", label: "len(df)", cells: [{ id: "a2v", value: "5", state: "danger" }] },
                { id: "a3", label: "count()", cells: [{ id: "a3v", value: "3", state: "success" }] },
              ],
            },
          },
        ],
        {
          tone: "success",
          text: "Count the gaps, decide what they mean, then choose. Never let a default silently make that choice for you.",
        },
      ),
    },
  ],
};
