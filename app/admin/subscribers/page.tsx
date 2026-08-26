"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DataTable from "@/components/admin/DataTable";
import FilterBar from "@/components/admin/FilterBar";
import Pagination from "@/components/admin/Pagination";
import StatusBadge from "@/components/admin/StatusBadge";

interface Subscriber {
  id: string;
  email: string;
  email_enabled: boolean;
  notice_enabled: boolean;
  result_enabled: boolean;
  venue_enabled: boolean;
  whatsapp_enabled: boolean;
  phone_number: string | null;
  created_at: string;
}

interface SubscribersResponse {
  subscribers: Subscriber[];
  total: number;
  page: number;
  totalPages: number;
}

export default function SubscribersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = Number(searchParams.get("page") ?? "1");
  const search = searchParams.get("search") ?? "";
  const channel = searchParams.get("channel") ?? "";
  const status = searchParams.get("status") ?? "";

  const [data, setData] = useState<SubscribersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filterValues = { search, channel, status };

  const buildUrl = useCallback(
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
      return `/admin/subscribers?${params.toString()}`;
    },
    [searchParams]
  );

  const handleFilterChange = useCallback(
    (key: string, value: string) => {
      router.push(buildUrl(key, value));
    },
    [router, buildUrl]
  );

  const handleReset = useCallback(() => {
    router.push("/admin/subscribers");
  }, [router]);

  const handlePageChange = useCallback(
    (newPage: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(newPage));
      router.push(`/admin/subscribers?${params.toString()}`);
    },
    [router, searchParams]
  );

  useEffect(() => {
    async function fetchSubscribers() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", "20");
        if (search) params.set("search", search);
        if (channel) params.set("channel", channel);
        if (status) params.set("status", status);

        const res = await fetch(
          `/api/admin/subscribers?${params.toString()}`
        );
        if (!res.ok) throw new Error("Failed to fetch subscribers");
        const json = await res.json();
        setData(json);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchSubscribers();
  }, [page, search, channel, status]);

  const filters = [
    { key: "search", label: "Search", type: "search" as const },
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
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ],
    },
  ];

  const columns = [
    { key: "email", label: "Email" },
    {
      key: "email_enabled",
      label: "Email",
      render: (value: boolean) => (
        <StatusBadge status={value ? "Active" : "Inactive"} size="sm" />
      ),
    },
    {
      key: "notice_enabled",
      label: "Notice",
      render: (value: boolean) => (
        <StatusBadge status={value ? "Active" : "Inactive"} size="sm" />
      ),
    },
    {
      key: "result_enabled",
      label: "Result",
      render: (value: boolean) => (
        <StatusBadge status={value ? "Active" : "Inactive"} size="sm" />
      ),
    },
    {
      key: "venue_enabled",
      label: "Venue",
      render: (value: boolean) => (
        <StatusBadge status={value ? "Active" : "Inactive"} size="sm" />
      ),
    },
    {
      key: "whatsapp_enabled",
      label: "WhatsApp",
      render: (value: boolean, row: Subscriber) => (
        <StatusBadge
          status={
            value && row.phone_number ? "Active" : "Inactive"
          }
          size="sm"
        />
      ),
    },
    {
      key: "phone_number",
      label: "Phone",
      render: (value: string | null) => value ?? "—",
    },
    {
      key: "created_at",
      label: "Joined",
      render: (value: string) =>
        value ? new Date(value).toLocaleString() : "—",
    },
  ];

  if (error) {
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
        SUBSCRIBERS
      </p>
      <h2 className="mt-3 text-3xl font-bold">Subscriber Management</h2>

      <div className="mt-8">
        <FilterBar
          filters={filters}
          values={filterValues}
          onChange={handleFilterChange}
          onReset={handleReset}
        />
      </div>

      <div className="mt-6">
        <DataTable
          columns={columns}
          data={data?.subscribers ?? []}
          loading={loading}
          emptyMessage="No subscribers found."
          onRowClick={(row) => router.push(`/admin/subscribers/${row.id}`)}
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
