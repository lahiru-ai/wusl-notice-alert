"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import DataTable from "@/components/admin/DataTable";
import FilterBar from "@/components/admin/FilterBar";
import Pagination from "@/components/admin/Pagination";
import StatusBadge from "@/components/admin/StatusBadge";

interface Notification {
  id: string;
  title: string;
  subscriber_email: string;
  channel: string;
  status: string;
  sent_at: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  page: number;
  totalPages: number;
}

export default function NotificationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = Number(searchParams.get("page") ?? "1");
  const channel = searchParams.get("channel") ?? "";
  const status = searchParams.get("status") ?? "";
  const dateFrom = searchParams.get("date_from") ?? "";
  const dateTo = searchParams.get("date_to") ?? "";

  const [data, setData] = useState<NotificationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const filterValues = {
    channel,
    status,
    date_from: dateFrom,
    date_to: dateTo,
  };

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", "20");
      if (channel) params.set("channel", channel);
      if (status) params.set("status", status);
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo) params.set("date_to", dateTo);

      const res = await fetch(
        `/api/admin/notifications?${params.toString()}`
      );
      if (!res.ok) throw new Error("Failed to fetch notifications");
      const json = await res.json();
      setData(json);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, [page, channel, status, dateFrom, dateTo]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotifications();
  }, [fetchNotifications]);

  const handleFilterChange = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      if (key !== "page") {
        params.delete("page");
      }
      router.push(`/admin/notifications?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handleReset = useCallback(() => {
    router.push("/admin/notifications");
  }, [router]);

  const handlePageChange = useCallback(
    (newPage: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(newPage));
      router.push(`/admin/notifications?${params.toString()}`);
    },
    [router, searchParams]
  );

  const handleRetry = useCallback(
    async (id: string) => {
      setRetryingId(id);
      try {
        const res = await fetch(
          `/api/admin/notifications/${id}/retry`,
          { method: "POST" }
        );
        if (!res.ok) throw new Error("Retry failed");
        await fetchNotifications();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Retry failed");
      } finally {
        setRetryingId(null);
      }
    },
    [fetchNotifications]
  );

  const filters = [
    {
      key: "channel",
      label: "Channel",
      type: "select" as const,
      options: [
        { value: "email", label: "Email" },
        { value: "whatsapp", label: "WhatsApp" },
      ],
    },
    {
      key: "status",
      label: "Status",
      type: "select" as const,
      options: [
        { value: "sent", label: "Sent" },
        { value: "failed", label: "Failed" },
        { value: "pending", label: "Pending" },
      ],
    },
    {
      key: "date_from",
      label: "Date From",
      type: "search" as const,
    },
    {
      key: "date_to",
      label: "Date To",
      type: "search" as const,
    },
  ];

  const columns = [
    { key: "item_title", label: "Item" },
    { key: "subscriber_email", label: "Subscriber" },
    {
      key: "channel",
      label: "Channel",
      render: (value: string) => <StatusBadge status={value} size="sm" />,
    },
    {
      key: "status",
      label: "Status",
      render: (value: string) => <StatusBadge status={value} size="sm" />,
    },
    {
      key: "sent_at",
      label: "Sent At",
      render: (value: string) =>
        value ? new Date(value).toLocaleString() : "—",
    },
    {
      key: "id",
      label: "Actions",
      render: (value: string, row: Notification) =>
        row.status === "failed" ? (
          <button
            type="button"
            disabled={retryingId === value}
            onClick={(e) => {
              e.stopPropagation();
              handleRetry(value);
            }}
            className="rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {retryingId === value ? "Retrying..." : "Retry"}
          </button>
        ) : null,
    },
  ];

  if (error && !data) {
    return (
      <div className="min-h-full bg-[#020617]">
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-7 text-center">
          <p className="text-lg font-bold text-red-400">Error</p>
          <p className="mt-2 text-sm text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-[#020617]">
      <p className="text-sm font-bold tracking-[0.18em] text-blue-400">
        NOTIFICATIONS
      </p>
      <h2 className="mt-3 text-3xl font-bold">Notification History</h2>

      <div className="mt-8">
        <FilterBar
          filters={filters}
          values={filterValues}
          onChange={handleFilterChange}
          onReset={handleReset}
        />
      </div>

      {error && (
        <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <div className="mt-6">
        <DataTable
          columns={columns}
          data={data?.notifications ?? []}
          loading={loading}
          emptyMessage="No notifications found."
        />
      </div>

      {data && (
        <div className="mt-6">
          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}
