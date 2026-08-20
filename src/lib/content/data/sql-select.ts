import type { CellState, Lesson, Region } from "@/lib/viz/types";

const CODE = `-- The logical order a query executes in:
-- 1. FROM   — pick the table
-- 2. WHERE  — filter rows
-- 3. SELECT — pick columns
-- 4. ORDER BY — sort the result

-- All rows, all columns
SELECT * FROM employees;

-- Pick columns
SELECT name, salary FROM employees;

-- Filter rows
SELECT name, salary
FROM employees
WHERE salary > 60000;

-- Sort
SELECT name, salary
FROM employees
WHERE salary > 60000
ORDER BY salary DESC;

-- Combine: alias, comparison, LIMIT
SELECT name, salary, salary * 12 AS annual
FROM employees
WHERE dept = 'eng'
ORDER BY salary DESC
LIMIT 3;`;

interface Row { id: string; name: string; dept: string; salary: number }

const DATA: Row[] = [
  { id: "1", name: "Ana", dept: "eng", salary: 75000 },
  { id: "2", name: "Ben", dept: "sales", salary: 55000 },
  { id: "3", name: "Cal", dept: "eng", salary: 90000 },
  { id: "4", name: "Dee", dept: "eng", salary: 65000 },
  { id: "5", name: "Eli", dept: "sales", salary: 48000 },
];

function tableRegion(opts: {
  id: string;
  label: string;
  columns: { id: string; label: string; note?: string; state?: CellState }[];
  rows: Row[];
  rowFilter?: (r: Row) => boolean;
  colFilter?: string[];
  computed?: (r: Row) => { id: string; value: string }[];
  rowState?: (r: Row) => CellState | undefined;
  footer?: string;
  sort?: (a: Row, b: Row) => number;
  limit?: number;
}): Region {
  let filtered = opts.rowFilter ? opts.rows.filter(opts.rowFilter) : opts.rows;
  if (opts.sort) filtered = [...filtered].sort(opts.sort);
  if (opts.limit) filtered = filtered.slice(0, opts.limit);

  return {
    id: opts.id,
    kind: "table",
    label: opts.label,
    table: {
      columns: opts.columns
        .filter((c) => !opts.colFilter || opts.colFilter.includes(c.id))
        .map((c) => ({ ...c })),
      rows: filtered.map((row) => ({
        id: `r${row.id}`,
        label: row.id,
        state: opts.rowState?.(row),
        cells: [
          ...((!opts.colFilter || opts.colFilter.includes("name"))
            ? [{ id: `r${row.id}-name`, value: row.name }] : []),
          ...((!opts.colFilter || opts.colFilter.includes("dept"))
            ? [{ id: `r${row.id}-dept`, value: row.dept }] : []),
          ...((!opts.colFilter || opts.colFilter.includes("salary"))
            ? [{ id: `r${row.id}-sal`, value: String(row.salary), state: opts.rowState?.(row) }] : []),
          ...(opts.computed?.(row) ?? []).map((c) => ({ id: c.id, value: c.value, state: "read" as CellState })),
        ],
      })),
      footer: opts.footer,
    },
  };
}

const ALL_COLS = [
  { id: "name", label: "name" },
  { id: "dept", label: "dept" },
  { id: "salary", label: "salary", note: "int" },
];

export const sqlSelect: Lesson = {
  slug: "sql-select",
  track: "data",
  title: "SELECT, WHERE & ORDER BY",
  tagline: "The logical order a query runs in, which is not the written order.",
  description:
    "Watch a SQL query execute in logical order — FROM picks the table, WHERE filters rows, SELECT picks columns, ORDER BY sorts — and see why the written order differs from the execution order.",
  difficulty: 1,
  minutes: 8,
  access: "free",
  language: "sql",
  filename: "query.sql",
  keywords: ["SELECT", "WHERE", "ORDER BY", "SQL", "FROM", "logical order"],
  intro: [
    "**SQL** is the language for asking questions of a database. Every query you'll ever write starts with the same four words: SELECT (columns), FROM (table), WHERE (filter), ORDER BY (sort).",
    "The tricky bit: SQL runs those clauses in a different order than you write them. You write SELECT first, but the database does WHERE first — because it needs to filter rows before it knows which values to select. That's why you can't refer to a column alias inside WHERE.",
    "This lesson runs a query step by step in the order the database actually executes it, so the rules stop feeling arbitrary and start making sense.",
  ],
  stages: [
    {
      id: "star",
      title: "SELECT * returns everything",
      body: [
        "`SELECT * FROM employees` returns every row and every column. The `*` means \"all columns\" — it is a shorthand for listing them all.",
        "This is useful for exploration, but in production queries you should name the columns you need. `*` makes queries brittle when columns are added later.",
      ],
      code: CODE,
      activeLines: [8],
      scene: {
        regions: [
          tableRegion({
            id: "t1",
            label: "SELECT * FROM employees",
            columns: ALL_COLS,
            rows: DATA,
            footer: "5 rows × 3 columns",
          }),
        ],
        callout: { tone: "info", text: "All rows, all columns. The starting point for any query." },
      },
    },
    {
      id: "columns",
      title: "SELECT picks columns",
      body: [
        "`SELECT name, salary` returns only those two columns. The `dept` column is not read from disk (in a well-optimised database).",
        "This is projection — reducing the width of the result. It runs *after* filtering in the logical order, even though it is written first.",
      ],
      code: CODE,
      activeLines: [11],
      scene: {
        regions: [
          tableRegion({
            id: "t2",
            label: "SELECT name, salary",
            columns: [...ALL_COLS],
            colFilter: ["name", "salary"],
            rows: DATA,
            footer: "5 rows × 2 columns",
          }),
        ],
        callout: { tone: "active", text: "SELECT chooses columns. Written first, executes third." },
      },
    },
    {
      id: "where",
      title: "WHERE filters rows",
      body: [
        "`WHERE salary > 60000` keeps only rows where the condition is true. Three employees earn more than 60 000; the other two are discarded.",
        "WHERE runs before SELECT in the execution order. That is why you cannot use a column alias in WHERE — the alias does not exist yet.",
      ],
      code: CODE,
      activeLines: [14, 15, 16],
      scene: {
        regions: [
          tableRegion({
            id: "t3",
            label: "WHERE salary > 60000",
            columns: ALL_COLS,
            colFilter: ["name", "salary"],
            rows: DATA,
            rowFilter: (r) => r.salary > 60000,
            rowState: (r) => r.salary > 60000 ? "success" : undefined,
            footer: "3 of 5 rows pass the filter",
          }),
        ],
        callout: { tone: "active", text: "WHERE filters rows. It runs BEFORE SELECT in the execution order." },
      },
    },
    {
      id: "order",
      title: "ORDER BY sorts the result",
      body: [
        "`ORDER BY salary DESC` sorts the surviving rows by salary, highest first. Without ORDER BY, the order is undefined — the database returns rows in whatever order is fastest.",
        "ORDER BY runs last. It is the only clause that can use a column alias, because everything else has already finished.",
      ],
      code: CODE,
      activeLines: [19, 20, 21, 22],
      scene: {
        regions: [
          tableRegion({
            id: "t4",
            label: "ORDER BY salary DESC",
            columns: ALL_COLS,
            colFilter: ["name", "salary"],
            rows: DATA,
            rowFilter: (r) => r.salary > 60000,
            sort: (a, b) => b.salary - a.salary,
            rowState: () => "success",
            footer: "sorted: 90000, 75000, 65000",
          }),
        ],
        callout: { tone: "success", text: "ORDER BY runs last. Without it, row order is not guaranteed." },
      },
    },
    {
      id: "alias",
      title: "Expressions and aliases",
      body: [
        "`salary * 12 AS annual` computes a value and names it. The alias `annual` appears as a column header in the result.",
        "LIMIT 3 truncates the output to three rows. Combined with ORDER BY, this is how you get \"top N\" queries.",
      ],
      code: CODE,
      activeLines: [25, 26, 27, 28, 29],
      scene: {
        regions: [
          tableRegion({
            id: "t5",
            label: "Top 3 eng by salary",
            columns: [
              { id: "name", label: "name" },
              { id: "salary", label: "salary" },
              { id: "annual", label: "annual", note: "computed" },
            ],
            rows: DATA,
            rowFilter: (r) => r.dept === "eng",
            sort: (a, b) => b.salary - a.salary,
            colFilter: ["name", "salary"],
            computed: (r) => [{ id: `r${r.id}-ann`, value: String(r.salary * 12) }],
            rowState: () => "active",
            footer: "3 eng employees, sorted, with computed column",
            limit: 3,
          }),
        ],
        callout: {
          tone: "success",
          text: "Logical order: FROM → WHERE → SELECT → ORDER BY → LIMIT. The written order is different.",
        },
      },
    },
  ],
};
