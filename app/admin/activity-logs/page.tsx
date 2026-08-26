"use client";

import { useState, useEffect } from "react";
import DataTable from "@/components/admin/DataTable";
import FilterBar from "@/components/admin/FilterBar";
import Pagination from "@/components/admin/Pagination";
import StatusBadge from "@/components/admin/StatusBadge";

interface ActivityLog {
  id: string;
  admin_email: string;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
}

interface ApiResponse {
  logs: ActivityLog[];
  total: number;
  page: number;
  totalPages: number;
}

const ACTION_OPTIONS = [
  { value: "view_dashboard", label: "view_dashboard" },
  { value: "test_notification", label: "test_notification" },
  { value: "manual_notification", label: "manual_notification" },
  { value: "retry_notification", label: "retry_notification" },
  { value: "notice_check", label: "notice_check" },
  { value: "settings_change", label: "settings_change" },
];

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDetails(details: Record<string, unknown> | null) {
  if (!details) return "—";
  const entries = Object.entries(details);
  if (entries.length === 0) return "—";
  return entries
    .map(([k, v]) => {
      const val = typeof v === "object" ? JSON.stringify(v) : String(v);
      return `${k}: ${val}`;
    })
    .join(", ");
}

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", "20");
        if (filters.action) params.set("action", filters.action);
        const res = await fetch(`/api/admin/activity-logs?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch activity logs");
        const json: ApiResponse = await res.json();
        setLogs(json.logs);
        setTotalPages(json.totalPages);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load activity logs");
      } finally {
        setLoading(false);
      }
    }
    fetchLogs();
  }, [page, filters.action]);

  function handleFilterChange(key: string, value: string) {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function handleReset() {
    setFilters({});
    setPage(1);
  }

  const columns = [
    {
      key: "admin_email",
      label: "Admin",
    },
    {
      key: "action",
      label: "Action",
      render: (value: string) => <StatusBadge status={value} size="sm" />,
    },
    {
      key: "details",
      label: "Details",
      render: (_: unknown, row: ActivityLog) => (
        <span className="text-sm text-slate-300">
          {formatDetails(row.details)}
        </span>
      ),
    },
    {
      key: "created_at",
      label: "Time",
      render: (value: string) => formatDateTime(value),
    },
  ];

  return (
    <div className="min-h-full bg-[#020617] p-8">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-bold tracking-[0.18em] text-blue-400">
          ACTIVITY LOGS
        </p>
        <h2 className="mt-3 text-3xl font-bold">Admin Activity Log</h2>

        <div className="mt-6">
          <FilterBar
            filters={[
              {
                key: "action",
                label: "Action Type",
                type: "select",
                options: ACTION_OPTIONS,
              },
            ]}
            values={filters}
            onChange={handleFilterChange}
            onReset={handleReset}
          />
        </div>

        <div className="mt-6">
          {error ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-7 text-center text-red-400 shadow-2xl">
              {error}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={logs}
              loading={loading}
              emptyMessage="No activity logs found."
            />
          )}
        </div>

        <div className="mt-6">
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>
    </div>
  );
}
