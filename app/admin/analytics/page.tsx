"use client";

import { useState, useEffect } from "react";
import StatCard from "@/components/admin/StatCard";
import LoadingSpinner from "@/components/admin/LoadingSpinner";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900 p-3 text-sm">
      <p className="mb-1 font-medium text-slate-200">{label}</p>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
};

interface AnalyticsData {
  summary: {
    total_sent: number;
    total_failed: number;
    email_success_rate: number;
    whatsapp_success_rate: number;
  };
  daily_counts: {
    date: string;
    email_sent: number;
    whatsapp_sent: number;
    email_failed: number;
    whatsapp_failed: number;
  }[];
  email_count: number;
  whatsapp_count: number;
}

const periods = [
  { label: "7D", value: "7d" },
  { label: "30D", value: "30d" },
  { label: "90D", value: "90d" },
  { label: "1Y", value: "1y" },
];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("30d");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/analytics?period=${period}`);
        if (!res.ok) throw new Error("Failed to fetch analytics");
        const json = await res.json();
        setData(json);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, [period]);

  function formatShortDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  const barData = [
    { name: "Email", count: data?.email_count ?? 0 },
    { name: "WhatsApp", count: data?.whatsapp_count ?? 0 },
  ];

  return (
    <div className="min-h-full bg-[#020617] p-8">
      <div className="mx-auto max-w-7xl">
        <p className="text-sm font-bold tracking-[0.18em] text-blue-400">
          ANALYTICS
        </p>
        <h2 className="mt-3 text-3xl font-bold">Notification Analytics</h2>

        <div className="mt-6 flex gap-2">
          {periods.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setPeriod(p.value)}
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                period === p.value
                  ? "bg-blue-600 text-white"
                  : "border border-slate-700 text-slate-200 hover:border-blue-500 hover:text-blue-400"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="mt-8">
            <LoadingSpinner text="Loading analytics..." />
          </div>
        )}

        {error && (
          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-7 text-center text-red-400 shadow-2xl">
            {error}
          </div>
        )}

        {data && !loading && (
          <div className="mt-8 space-y-8">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total Sent"
                value={data.summary.total_sent}
                icon="📤"
              />
              <StatCard
                title="Total Failed"
                value={data.summary.total_failed}
                icon="❌"
              />
              <StatCard
                title="Email Success Rate"
                value={`${data.summary.email_success_rate}%`}
                icon="📧"
              />
              <StatCard
                title="WhatsApp Success Rate"
                value={`${data.summary.whatsapp_success_rate}%`}
                icon="💬"
              />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-7 shadow-2xl">
                <h3 className="mb-4 text-lg font-bold text-slate-100">
                  Daily Notification Activity
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={data.daily_counts}
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#334155"
                    />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatShortDate}
                      stroke="#94a3b8"
                      fontSize={12}
                    />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="email_sent"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Email Sent"
                    />
                    <Line
                      type="monotone"
                      dataKey="whatsapp_sent"
                      stroke="#22c55e"
                      strokeWidth={2}
                      name="WhatsApp Sent"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-7 shadow-2xl">
                <h3 className="mb-4 text-lg font-bold text-slate-100">
                  Email vs WhatsApp Usage
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={barData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#334155"
                    />
                    <XAxis stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="count" fill="#3b82f6" name="Count">
                      {barData.map((entry, i) => (
                        <rect
                          key={i}
                          fill={entry.name === "Email" ? "#3b82f6" : "#22c55e"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-7 shadow-2xl">
              <h3 className="mb-4 text-lg font-bold text-slate-100">
                Daily Breakdown
              </h3>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={data.daily_counts}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatShortDate}
                    stroke="#94a3b8"
                    fontSize={12}
                  />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar
                    dataKey="email_sent"
                    stackId="a"
                    fill="#3b82f6"
                    name="Email Sent"
                  />
                  <Bar
                    dataKey="email_failed"
                    stackId="a"
                    fill="#ef4444"
                    name="Email Failed"
                  />
                  <Bar
                    dataKey="whatsapp_sent"
                    stackId="a"
                    fill="#22c55e"
                    name="WhatsApp Sent"
                  />
                  <Bar
                    dataKey="whatsapp_failed"
                    stackId="a"
                    fill="#f59e0b"
                    name="WhatsApp Failed"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
