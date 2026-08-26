"use client";

import { useEffect, useState } from "react";
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
import StatCard from "@/components/admin/StatCard";
import DataTable from "@/components/admin/DataTable";
import LoadingSpinner from "@/components/admin/LoadingSpinner";
import StatusBadge from "@/components/admin/StatusBadge";

interface Stats {
  total_subscribers: number;
  active_subscribers: number;
  whatsapp_subscribers: number;
  notifications_sent: number;
  failed_notifications: number;
  notices_detected: number;
  results_detected: number;
  venues_detected: number;
}

interface Analytics {
  daily_counts: { date: string; email_sent: number; whatsapp_sent: number }[];
  email_count: number;
  whatsapp_count: number;
}

interface Notification {
  id: string;
  title: string;
  subscriber_email: string;
  channel: string;
  status: string;
  sent_at: string;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, analyticsRes, notifRes] = await Promise.all([
          fetch("/api/admin/stats"),
          fetch("/api/admin/analytics?period=30d"),
          fetch("/api/admin/notifications?limit=5"),
        ]);

        if (!statsRes.ok || !analyticsRes.ok || !notifRes.ok) {
          throw new Error("Failed to fetch dashboard data");
        }

        const [statsData, analyticsData, notifData] = await Promise.all([
          statsRes.json(),
          analyticsRes.json(),
          notifRes.json(),
        ]);

        setStats(statsData);
        setAnalytics(analyticsData);
        setNotifications(notifData.notifications ?? notifData);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-full bg-[#020617]">
        <LoadingSpinner text="Loading dashboard..." />
      </div>
    );
  }

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

  const notifColumns = [
    { key: "title", label: "Title" },
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
  ];

  return (
    <div className="min-h-full bg-[#020617]">
      <p className="text-sm font-bold tracking-[0.18em] text-blue-400">
        OVERVIEW
      </p>
      <h2 className="mt-3 text-3xl font-bold">Admin Dashboard</h2>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Subscribers"
          value={stats?.total_subscribers ?? 0}
          icon="👥"
        />
        <StatCard
          title="Active Subscribers"
          value={stats?.active_subscribers ?? 0}
          icon="✅"
        />
        <StatCard
          title="WhatsApp Subscribers"
          value={stats?.whatsapp_subscribers ?? 0}
          icon="💬"
        />
        <StatCard
          title="Notifications Sent"
          value={stats?.notifications_sent ?? 0}
          icon="📧"
        />
        <StatCard
          title="Failed Notifications"
          value={stats?.failed_notifications ?? 0}
          icon="❌"
        />
        <StatCard
          title="Notices Detected"
          value={stats?.notices_detected ?? 0}
          icon="📢"
        />
        <StatCard
          title="Results Detected"
          value={stats?.results_detected ?? 0}
          icon="📊"
        />
        <StatCard
          title="Venues Detected"
          value={stats?.venues_detected ?? 0}
          icon="🏫"
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-7 shadow-2xl lg:col-span-2">
          <p className="text-sm font-bold tracking-[0.18em] text-blue-400">
            ANALYTICS
          </p>
          <h3 className="mt-3 text-xl font-bold">Notification Activity</h3>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics?.daily_counts ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="date"
                  stroke="#64748b"
                  fontSize={12}
                  tickFormatter={(v: string) => {
                    const d = new Date(v);
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  }}
                />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #1e293b",
                    borderRadius: "12px",
                    color: "#e2e8f0",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="email_sent"
                  name="Email"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="whatsapp_sent"
                  name="WhatsApp"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-7 shadow-2xl">
          <p className="text-sm font-bold tracking-[0.18em] text-blue-400">
            USAGE
          </p>
          <h3 className="mt-3 text-xl font-bold">
            Email vs WhatsApp Usage
          </h3>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  {
                    name: "Email",
                    count: analytics?.email_count ?? 0,
                  },
                  {
                    name: "WhatsApp",
                    count: analytics?.whatsapp_count ?? 0,
                  },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #1e293b",
                    borderRadius: "12px",
                    color: "#e2e8f0",
                  }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <p className="text-sm font-bold tracking-[0.18em] text-blue-400">
          RECENT
        </p>
        <h3 className="mt-3 text-xl font-bold">Recent Notifications</h3>
        <div className="mt-4">
          <DataTable
            columns={notifColumns}
            data={notifications}
            emptyMessage="No notifications sent yet."
          />
        </div>
      </div>
    </div>
  );
}
