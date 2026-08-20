"use client";

import { useCallback } from "react";
import type { Cell, CellState, Region } from "@/lib/viz/types";
import { useCellRegistry } from "./cell-registry";

/**
 * Rows and columns: dataframes, hash buckets, query results.
 *
 * Every data cell registers itself like a memory cell does, so arrows can point
 * into a table the same way they point at a stack slot — that is what makes a
 * join or a hash lookup drawable with the existing arrow layer.
 */

const ROW_STATE: Record<CellState, string> = {
  idle: "",
  active: "bg-amber-wash",
  read: "bg-steel-wash",
  written: "bg-steel-wash",
  allocated: "bg-steel-wash",
  freed: "opacity-45 line-through",
  padding: "opacity-45",
  garbage: "opacity-45",
  success: "bg-green-wash",
  danger: "bg-danger-wash",
};

const CELL_STATE: Record<CellState, string> = {
  idle: "text-ink",
  active: "bg-amber-wash text-ink font-medium",
  read: "bg-steel-wash text-ink",
  written: "bg-steel-wash text-ink font-medium",
  allocated: "bg-steel-wash text-ink",
  freed: "text-muted line-through",
  padding: "text-muted",
  garbage: "text-muted italic",
  success: "bg-green-wash text-ink",
  danger: "bg-danger-wash text-ink",
};

export function TableRegion({ region }: { region: Region }) {
  const spec = region.table;
  if (!spec) return null;

  return (
    <div className="inline-block max-w-full overflow-x-auto rounded-md border border-border-strong bg-surface">
      <table className="border-collapse font-mono text-xs">
        <thead>
          <tr className="border-b border-border-strong bg-panel">
            {/* row-label gutter */}
            <th className="px-2 py-1.5 text-left font-normal text-muted" scope="col">
              <span className="sr-only">Row</span>
            </th>
            {spec.columns.map((column) => (
              <th
                key={column.id}
                scope="col"
                className={[
                  "border-l border-border px-2.5 py-1.5 text-left align-top",
                  column.state ? CELL_STATE[column.state] : "text-ink",
                ].join(" ")}
              >
                <span className="block font-medium">{column.label}</span>
                {column.note && (
                  <span className="mt-0.5 block text-[0.625rem] font-normal text-muted">
                    {column.note}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {spec.rows.map((row) => (
            <tr
              key={row.id}
              className={[
                "border-b border-border last:border-b-0",
                ROW_STATE[row.state ?? "idle"],
              ].join(" ")}
            >
              <th
                scope="row"
                className="px-2 py-1 text-left text-[0.625rem] font-normal text-muted tabular-nums"
              >
                {row.label ?? ""}
              </th>
              {row.cells.map((cell) => (
                <TableCell key={cell.id} cell={cell} />
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {spec.footer && (
        <p className="border-t border-border px-2.5 py-1.5 font-mono text-[0.625rem] text-muted">
          {spec.footer}
        </p>
      )}
    </div>
  );
}

function TableCell({ cell }: { cell: Cell }) {
  const { register } = useCellRegistry();
  const state = cell.state ?? "idle";

  const ref = useCallback(
    (el: HTMLTableCellElement | null) => {
      register(cell.id, el);
    },
    [register, cell.id],
  );

  return (
    <td
      ref={ref}
      data-cell={cell.id}
      data-state={state}
      className={[
        "border-l border-border px-2.5 py-1 tabular-nums transition-colors duration-300",
        CELL_STATE[state],
      ].join(" ")}
    >
      {cell.value ?? <span className="text-muted">—</span>}
      {cell.note && <span className="ml-1.5 text-[0.5625rem] text-muted">{cell.note}</span>}
    </td>
  );
}
