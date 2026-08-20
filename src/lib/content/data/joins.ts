import type { Lesson, Region, Scene, TableRow } from "@/lib/viz/types";

const CODE = `import pandas as pd

orders = pd.DataFrame({
    "order_id": [1, 2, 3, 4],
    "cust_id":  [10, 11, 12, 11],
    "amount":   [50, 70, 30, 90],
})

customers = pd.DataFrame({
    "cust_id": [10, 11, 13],
    "name":    ["Ana", "Ben", "Dee"],
})

pd.merge(orders, customers, on="cust_id", how="inner")
pd.merge(orders, customers, on="cust_id", how="left")
pd.merge(orders, customers, on="cust_id", how="outer")

orders.merge(customers, on="cust_id", how="left", indicator=True)`;

const ORDERS = [
  { order: "1", cust: "10", amount: "50" },
  { order: "2", cust: "11", amount: "70" },
  { order: "3", cust: "12", amount: "30" },
  { order: "4", cust: "11", amount: "90" },
];

const CUSTOMERS = [
  { cust: "10", name: "Ana" },
  { cust: "11", name: "Ben" },
  { cust: "13", name: "Dee" },
];

const MATCHED_ORDER_KEYS = new Set(["10", "11"]);

function ordersTable(highlight?: (cust: string) => boolean): Region {
  return {
    id: "orders",
    kind: "table",
    label: "orders (left)",
    caption: "4 rows · cust_id is the key",
    table: {
      columns: [
        { id: "order_id", label: "order_id" },
        { id: "cust_id", label: "cust_id", note: "join key" },
        { id: "amount", label: "amount" },
      ],
      rows: ORDERS.map((o) => ({
        id: `o${o.order}`,
        state: highlight?.(o.cust) ? "success" : highlight ? "danger" : "idle",
        cells: [
          { id: `o${o.order}-id`, value: o.order },
          { id: `o${o.order}-c`, value: o.cust, state: highlight?.(o.cust) ? "success" : "read" },
          { id: `o${o.order}-a`, value: o.amount },
        ],
      })),
    },
  };
}

function customersTable(highlight?: (cust: string) => boolean): Region {
  return {
    id: "customers",
    kind: "table",
    label: "customers (right)",
    caption: "3 rows · one row per customer",
    table: {
      columns: [
        { id: "cust_id", label: "cust_id", note: "join key" },
        { id: "name", label: "name" },
      ],
      rows: CUSTOMERS.map((c) => ({
        id: `c${c.cust}`,
        state: highlight?.(c.cust) ? "success" : highlight ? "danger" : "idle",
        cells: [
          { id: `c${c.cust}-c`, value: c.cust, state: highlight?.(c.cust) ? "success" : "read" },
          { id: `c${c.cust}-n`, value: c.name },
        ],
      })),
    },
  };
}

function resultTable(
  rows: { order: string; cust: string; amount: string; name: string; missing?: "left" | "right" }[],
  label: string,
  footer: string,
): Region {
  const tableRows: TableRow[] = rows.map((r, i) => ({
    id: `res${i}`,
    state: r.missing ? "danger" : "success",
    cells: [
      { id: `res${i}-o`, value: r.order, state: r.missing === "left" ? "garbage" : "idle" },
      { id: `res${i}-c`, value: r.cust },
      { id: `res${i}-a`, value: r.amount, state: r.missing === "left" ? "garbage" : "idle" },
      { id: `res${i}-n`, value: r.name, state: r.missing === "right" ? "garbage" : "idle" },
    ],
  }));

  return {
    id: "result",
    kind: "table",
    label,
    table: {
      columns: [
        { id: "order_id", label: "order_id" },
        { id: "cust_id", label: "cust_id" },
        { id: "amount", label: "amount" },
        { id: "name", label: "name" },
      ],
      rows: tableRows,
      footer,
    },
  };
}

const scene = (regions: Region[], callout?: Scene["callout"]): Scene => ({ regions, callout });

export const joins: Lesson = {
  slug: "joins-and-merges",
  track: "data",
  title: "Joins & merges",
  tagline: "Matching rows by key is easy. The interesting part is what happens to the rows that do not match.",
  description:
    "Compare inner, left and outer joins on the same two frames, see exactly which rows are dropped or filled with NaN, and watch a duplicated key multiply your row count.",
  difficulty: 2,
  minutes: 10,
  access: "free",
  language: "python",
  filename: "analysis.py",
  keywords: ["merge", "join", "inner join", "left join", "outer join", "pandas", "NaN"],
  stages: [
    {
      id: "inputs",
      title: "Two frames, one shared key",
      body: [
        "`orders` has four rows; `customers` has three. They share the `cust_id` column, which is what a join matches on.",
        "Look at the keys before joining: orders reference customers 10, 11, 12 and 11 again. Customers lists 10, 11 and 13. Customer 12 has no record, and customer 13 has no orders.",
      ],
      code: CODE,
      activeLines: [3, 10],
      scene: scene([ordersTable(), customersTable()], {
        tone: "info",
        text: "Every join question reduces to: what should happen to 12 and 13?",
      }),
    },
    {
      id: "inner",
      title: "inner keeps only rows that match on both sides",
      body: [
        "Order 3 disappears, because customer 12 is not in the customers frame. Customer 13 disappears too, because nobody ordered from them.",
        "Three rows out of four survive. This is the default, and it is the one that silently loses data — if you did not check the row count, you would not know.",
      ],
      code: CODE,
      activeLines: [15],
      scene: scene(
        [
          ordersTable((c) => MATCHED_ORDER_KEYS.has(c)),
          resultTable(
            [
              { order: "1", cust: "10", amount: "50", name: "Ana" },
              { order: "2", cust: "11", amount: "70", name: "Ben" },
              { order: "4", cust: "11", amount: "90", name: "Ben" },
            ],
            "how='inner'",
            "3 rows — order 3 and customer 13 both dropped",
          ),
        ],
        {
          tone: "danger",
          text: "Always compare len() before and after. A quiet drop from an inner join is the most common data bug there is.",
        },
      ),
    },
    {
      id: "left",
      title: "left keeps every row on the left",
      body: [
        "All four orders survive. Order 3 has no matching customer, so the columns coming from the right side are filled with `NaN`.",
        "This is usually what you want when enriching a primary table with lookup data: you keep your facts and accept that some labels are missing.",
      ],
      code: CODE,
      activeLines: [16],
      scene: scene(
        [
          resultTable(
            [
              { order: "1", cust: "10", amount: "50", name: "Ana" },
              { order: "2", cust: "11", amount: "70", name: "Ben" },
              { order: "3", cust: "12", amount: "30", name: "NaN", missing: "right" },
              { order: "4", cust: "11", amount: "90", name: "Ben" },
            ],
            "how='left'",
            "4 rows — every order kept, name missing for customer 12",
          ),
        ],
        {
          tone: "active",
          text: "NaN is how pandas says \"no match\". It also forces an int column to float, which surprises people.",
        },
      ),
    },
    {
      id: "outer",
      title: "outer keeps everything from both sides",
      body: [
        "Now customer 13 appears too, with `NaN` for every column that came from orders. Five rows: four orders plus the unmatched customer.",
        "Use this when you need to see both kinds of gap — records missing a lookup, and lookups nobody used.",
      ],
      code: CODE,
      activeLines: [17],
      scene: scene(
        [
          resultTable(
            [
              { order: "1", cust: "10", amount: "50", name: "Ana" },
              { order: "2", cust: "11", amount: "70", name: "Ben" },
              { order: "3", cust: "12", amount: "30", name: "NaN", missing: "right" },
              { order: "4", cust: "11", amount: "90", name: "Ben" },
              { order: "NaN", cust: "13", amount: "NaN", name: "Dee", missing: "left" },
            ],
            "how='outer'",
            "5 rows — unmatched rows from both sides retained",
          ),
        ],
        { tone: "info", text: "Outer joins are a reconciliation tool: they show you exactly what does not line up." },
      ),
    },
    {
      id: "duplicates",
      title: "A repeated key multiplies rows",
      body: [
        "Customer 11 appears in two orders, so `Ben` is attached twice. That is correct — but it means the output can be *longer* than either input.",
        "If the key is duplicated on **both** sides, you get every combination: 3 left rows × 2 right rows for the same key produces 6. That is how a join accidentally turns 10,000 rows into 4 million.",
        "Check with `df[\"key\"].duplicated().any()` before joining, or pass `validate=\"many_to_one\"` and let pandas raise instead of silently exploding.",
      ],
      code: CODE,
      activeLines: [16],
      scene: scene(
        [
          resultTable(
            [
              { order: "2", cust: "11", amount: "70", name: "Ben" },
              { order: "4", cust: "11", amount: "90", name: "Ben" },
            ],
            "one customer, two orders",
            "Ben appears twice — correct, and worth expecting",
          ),
        ],
        {
          tone: "danger",
          text: "Row counts after a join are the thing to check first. Duplicate keys are the usual cause of a surprise.",
        },
      ),
    },
    {
      id: "indicator",
      title: "indicator=True tells you where each row came from",
      body: [
        "Adding `indicator=True` appends a `_merge` column with the values `both`, `left_only` or `right_only`.",
        "It turns a join into a diagnostic: filter on `left_only` to see exactly which records failed to find a match, instead of hunting through NaNs.",
      ],
      code: CODE,
      activeLines: [18],
      scene: scene(
        [
          {
            id: "result",
            kind: "table",
            label: "how='left', indicator=True",
            table: {
              columns: [
                { id: "order_id", label: "order_id" },
                { id: "cust_id", label: "cust_id" },
                { id: "name", label: "name" },
                { id: "merge", label: "_merge" },
              ],
              rows: [
                { id: "i1", cells: [{ id: "i1a", value: "1" }, { id: "i1b", value: "10" }, { id: "i1c", value: "Ana" }, { id: "i1d", value: "both", state: "success" }] },
                { id: "i2", cells: [{ id: "i2a", value: "2" }, { id: "i2b", value: "11" }, { id: "i2c", value: "Ben" }, { id: "i2d", value: "both", state: "success" }] },
                { id: "i3", state: "danger", cells: [{ id: "i3a", value: "3" }, { id: "i3b", value: "12" }, { id: "i3c", value: "NaN", state: "garbage" }, { id: "i3d", value: "left_only", state: "danger" }] },
                { id: "i4", cells: [{ id: "i4a", value: "4" }, { id: "i4b", value: "11" }, { id: "i4c", value: "Ben" }, { id: "i4d", value: "both", state: "success" }] },
              ],
              footer: "filter _merge == 'left_only' to list the unmatched records",
            },
          },
        ],
        {
          tone: "success",
          text: "Pick the join by asking which side must survive, then verify with row counts and the indicator.",
        },
      ),
    },
  ],
};
