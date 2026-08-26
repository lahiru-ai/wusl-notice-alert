"use client";

import { ReactNode } from "react";
import EmptyState from "./EmptyState";
import LoadingSpinner from "./LoadingSpinner";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => ReactNode;
  className?: string;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  emptyMessage?: string;
  loading?: boolean;
  onRowClick?: (row: any) => void;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export default function DataTable({
  columns,
  data,
  emptyMessage = "No data found.",
  loading = false,
  onRowClick,
}: DataTableProps) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 shadow-2xl">
        <LoadingSpinner text="Loading data..." />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 shadow-2xl">
      {data.length === 0 ? (
        <EmptyState
          icon="📭"
          title="No Results"
          description={emptyMessage}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400 ${col.className ?? ""}`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {data.map((row: Record<string, unknown>, i: number) => (
                <tr
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  key={(row as any).id ?? i}
                  onClick={
                    onRowClick ? () => onRowClick(row) : undefined
                  }
                  className={`border-b border-slate-800/50 transition last:border-b-0 ${
                    onRowClick
                      ? "cursor-pointer hover:bg-slate-800/30"
                      : ""
                  }`}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-6 py-4 text-slate-200 ${col.className ?? ""}`}
                    >
                      {col.render
                        ? col.render(row[col.key], row)
                        : (row[col.key] as ReactNode) ?? "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
