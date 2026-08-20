import type { CellState, Lesson, Region } from "@/lib/viz/types";

const CODE = `import pandas as pd

# CSV — the default
df = pd.read_csv("sales.csv")

# With options
df = pd.read_csv("sales.csv",
    sep=";",              # European CSVs use semicolons
    encoding="latin-1",   # not everything is UTF-8
    na_values=["N/A", ""], # treat these as missing
    parse_dates=["date"],  # convert to datetime
)

# Excel — needs openpyxl
df = pd.read_excel("report.xlsx", sheet_name="Q4")

# SQL — needs a connection
import sqlite3
conn = sqlite3.connect("app.db")
df = pd.read_sql("SELECT * FROM orders", conn)

# Inspect what you got
df.head()
df.info()
df.dtypes`;

function table(opts: {
  id: string;
  label: string;
  columns: { id: string; label: string; note?: string }[];
  rows: { id: string; cells: { id: string; value: string; state?: CellState }[] }[];
  footer?: string;
  caption?: string;
}): Region {
  return {
    id: opts.id,
    kind: "table",
    label: opts.label,
    caption: opts.caption,
    table: {
      columns: opts.columns.map((c) => ({ id: c.id, label: c.label, note: c.note })),
      rows: opts.rows.map((r) => ({
        id: r.id,
        label: r.id,
        cells: r.cells,
      })),
      footer: opts.footer,
    },
  };
}

export const loadingData: Lesson = {
  slug: "loading-data",
  track: "data",
  title: "Loading data",
  tagline: "CSV, Excel and SQL — delimiters, encodings and parse errors.",
  description:
    "Watch a CSV file parsed into a DataFrame, see what happens when the delimiter or encoding is wrong, and compare loading from Excel and SQL.",
  difficulty: 1,
  minutes: 7,
  access: "free",
  language: "python",
  filename: "load.py",
  keywords: ["read_csv", "read_excel", "read_sql", "CSV", "encoding", "parse errors"],
  stages: [
    {
      id: "csv",
      title: "read_csv parses text into columns",
      body: [
        "A CSV file is plain text: values separated by commas, one row per line. `read_csv` splits on commas, infers types, and builds a DataFrame.",
        "The first row is assumed to be column headers. If it is not, pass `header=None` and pandas assigns 0, 1, 2 as column names.",
      ],
      code: CODE,
      activeLines: [3, 4],
      scene: {
        regions: [
          table({
            id: "raw",
            label: "sales.csv (raw text)",
            caption: "commas separate fields",
            columns: [{ id: "raw", label: "text" }],
            rows: [
              { id: "h", cells: [{ id: "h-t", value: "date,region,amount", state: "read" }] },
              { id: "r1", cells: [{ id: "r1-t", value: "2024-01-15,north,120" }] },
              { id: "r2", cells: [{ id: "r2-t", value: "2024-01-16,south,80" }] },
            ],
          }),
          table({
            id: "df",
            label: "DataFrame",
            columns: [
              { id: "date", label: "date", note: "object" },
              { id: "region", label: "region", note: "object" },
              { id: "amount", label: "amount", note: "int64" },
            ],
            rows: [
              { id: "0", cells: [
                { id: "d0", value: "2024-01-15" },
                { id: "r0", value: "north" },
                { id: "a0", value: "120", state: "active" },
              ]},
              { id: "1", cells: [
                { id: "d1", value: "2024-01-16" },
                { id: "r1d", value: "south" },
                { id: "a1", value: "80", state: "active" },
              ]},
            ],
            footer: "2 rows × 3 columns",
          }),
        ],
        callout: { tone: "active", text: "Text in, DataFrame out. pandas split on commas and inferred int64 for amount." },
      },
    },
    {
      id: "sep",
      title: "Wrong delimiter = one giant column",
      body: [
        "European CSVs often use `;` as a separator (because commas appear inside numbers like `1.200,50`). If you pass a semicolon-separated file to `read_csv` without `sep=\";\"`, every row becomes one string.",
        "The symptom: one column with a name like `date;region;amount`. Fix: set `sep` to match the file.",
      ],
      code: CODE,
      activeLines: [8],
      scene: {
        regions: [
          table({
            id: "bad",
            label: "Wrong sep — one column",
            columns: [{ id: "all", label: "date;region;amount" }],
            rows: [
              { id: "b0", cells: [{ id: "b0-t", value: "2024-01-15;north;120", state: "danger" }] },
              { id: "b1", cells: [{ id: "b1-t", value: "2024-01-16;south;80", state: "danger" }] },
            ],
            footer: "one column instead of three",
          }),
        ],
        callout: { tone: "danger", text: "Wrong sep = one column. The file loaded without error — it just parsed wrong." },
      },
    },
    {
      id: "na",
      title: "na_values marks missing data",
      body: [
        "`na_values=[\"N/A\", \"\"]` tells pandas to treat those strings as NaN. Without it, \"N/A\" would be a regular string and numeric operations on the column would fail.",
        "pandas already treats an empty field between two commas as NaN. This parameter adds custom markers.",
      ],
      code: CODE,
      activeLines: [10],
      scene: {
        regions: [
          table({
            id: "na",
            label: "With na_values",
            columns: [
              { id: "date2", label: "date" },
              { id: "region2", label: "region" },
              { id: "amount2", label: "amount" },
            ],
            rows: [
              { id: "n0", cells: [
                { id: "n0-d", value: "2024-01-15" },
                { id: "n0-r", value: "north" },
                { id: "n0-a", value: "120" },
              ]},
              { id: "n1", cells: [
                { id: "n1-d", value: "2024-01-16" },
                { id: "n1-r", value: "N/A", state: "danger" },
                { id: "n1-a", value: "NaN", state: "danger" },
              ]},
            ],
            footer: "\"N/A\" and empty → NaN",
          }),
        ],
        callout: { tone: "active", text: "na_values converts marker strings to NaN so numeric ops work." },
      },
    },
    {
      id: "excel",
      title: "Excel: same idea, different format",
      body: [
        "`read_excel` understands `.xlsx` files (needs the `openpyxl` package). It reads a specific sheet — default is the first one.",
        "Excel files carry types, so you get fewer surprises than CSV. The tradeoff: they are larger, slower to parse, and harder to diff in version control.",
      ],
      code: CODE,
      activeLines: [15],
      scene: {
        regions: [
          table({
            id: "xl",
            label: "read_excel(\"report.xlsx\", sheet_name=\"Q4\")",
            columns: [
              { id: "x-date", label: "date", note: "datetime64" },
              { id: "x-region", label: "region", note: "object" },
              { id: "x-amount", label: "amount", note: "float64" },
            ],
            rows: [
              { id: "x0", cells: [
                { id: "x0-d", value: "2024-10-01", state: "success" },
                { id: "x0-r", value: "north" },
                { id: "x0-a", value: "350.0" },
              ]},
            ],
            footer: "types come from Excel — often more accurate",
          }),
        ],
        callout: { tone: "success", text: "Excel carries types. CSV needs you to specify them." },
      },
    },
    {
      id: "sql",
      title: "SQL: query directly into a DataFrame",
      body: [
        "`read_sql` runs a SQL query against a database connection and returns the result as a DataFrame. The query is plain SQL — pandas just captures the output.",
        "This is useful for pulling subsets from large databases. Let the database do the filtering (WHERE), then analyse the result in pandas.",
      ],
      code: CODE,
      activeLines: [18, 19, 20],
      scene: {
        regions: [
          table({
            id: "sql",
            label: "read_sql(\"SELECT * FROM orders\", conn)",
            columns: [
              { id: "s-id", label: "id", note: "int64" },
              { id: "s-item", label: "item", note: "object" },
              { id: "s-qty", label: "qty", note: "int64" },
            ],
            rows: [
              { id: "s0", cells: [
                { id: "s0-id", value: "1" },
                { id: "s0-item", value: "widget" },
                { id: "s0-qty", value: "5", state: "active" },
              ]},
              { id: "s1", cells: [
                { id: "s1-id", value: "2" },
                { id: "s1-item", value: "gadget" },
                { id: "s1-qty", value: "12", state: "active" },
              ]},
            ],
            footer: "query result → DataFrame",
          }),
        ],
        callout: {
          tone: "success",
          text: "CSV for files, Excel for spreadsheets, SQL for databases. Same DataFrame at the end.",
        },
      },
    },
  ],
};
