"use client";

import { useState, useEffect, useCallback } from "react";
import StatCard from "@/components/admin/StatCard";
import StatusBadge from "@/components/admin/StatusBadge";
import LoadingSpinner from "@/components/admin/LoadingSpinner";

interface Stats {
  notices_detected: number;
  results_detected: number;
  venues_detected: number;
}

interface HealthCheck {
  name: string;
  status: string;
  detail?: string;
}

interface ActivityLog {
  created_at: string;
}

interface CheckResult {
  new_notices: number;
  total_on_site: number;
  message?: string;
}

export default function MonitoringPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [health, setHealth] = useState<HealthCheck[]>([]);
  const [lastCheck, setLastCheck] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setError("");

      const [statsRes, healthRes, logsRes] = await Promise.allSettled([
        fetch("/api/admin/stats"),
        fetch("/api/admin/health"),
        fetch("/api/admin/activity-logs?action=notice_check&limit=1"),
      ]);

      if (statsRes.status === "fulfilled" && statsRes.value.ok) {
        const data = await statsRes.value.json();
        setStats(data);
      }

      if (healthRes.status === "fulfilled" && healthRes.value.ok) {
        const raw = await healthRes.value.json();
        const checks: HealthCheck[] = [];
        for (const [key, val] of Object.entries(raw)) {
          if (key === "checked_at") continue;
          const v = val as Record<string, unknown>;
          checks.push({
            name: key,
            status: (v.status as string) || "unknown",
            detail: (v.detail as string) || undefined,
          });
        }
        setHealth(checks);
      }

      if (logsRes.status === "fulfilled" && logsRes.value.ok) {
        const data = await logsRes.value.json();
        const logs: ActivityLog[] = data.logs || data || [];
        if (logs.length > 0) {
          setLastCheck(logs[0].created_at);
        }
      }
    } catch {
      setError("Failed to load monitoring data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  async function handleCheckNow() {
    setChecking(true);
    setCheckResult(null);

    try {
      const res = await fetch("/api/admin/check-notices", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Check failed.");
      } else {
        setCheckResult(data);
        fetchData();
      }
    } catch {
      setError("Something went wrong during the check.");
    } finally {
      setChecking(false);
    }
  }

  function formatTime(iso: string | null): string {
    if (!iso) return "Never";
    const d = new Date(iso);
    return d.toLocaleString();
  }

  if (loading) {
    return (
      <main className="min-h-full bg-[#020617] text-white">
        <LoadingSpinner text="Loading monitoring data..." />
      </main>
    );
  }

  return (
    <main className="min-h-full bg-[#020617] text-white">
      <div className="mb-8">
        <p className="text-sm font-bold tracking-[0.18em] text-blue-400">
          MONITORING
        </p>
        <h2 className="mt-3 text-3xl font-bold">
          Notice Monitoring
        </h2>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Last Check"
          value={formatTime(lastCheck)}
          icon="🕐"
        />
        <StatCard
          title="Notices on Site"
          value={stats?.notices_detected ?? "—"}
          icon="🌐"
        />
        <StatCard
          title="Notices in DB"
          value={stats?.notices_detected ?? "—"}
          icon="📢"
        />
        <StatCard
          title="Results in DB"
          value={stats?.results_detected ?? "—"}
          icon="📊"
        />
        <StatCard
          title="Venues in DB"
          value={stats?.venues_detected ?? "—"}
          icon="🏫"
        />
      </div>

      <div className="mb-8">
        <p className="mb-5 text-sm font-bold tracking-[0.18em] text-blue-400">
          SYSTEM HEALTH
        </p>

        {health.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-7 shadow-2xl">
            <p className="text-center text-sm text-slate-500">
              No health check data available.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {health.map((check) => (
              <div
                key={check.name}
                className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-2xl"
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-white">{check.name}</p>
                  <StatusBadge status={check.status} />
                </div>
                {check.detail && (
                  <p className="mt-2 text-sm text-slate-400">
                    {check.detail}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-7 shadow-2xl">
        <p className="mb-5 text-sm font-bold tracking-[0.18em] text-blue-400">
          CHECK NOW
        </p>

        {checkResult && (
          <div className="mb-5 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300">
            Check complete. Found {checkResult.new_notices} new notice{checkResult.new_notices !== 1 ? "s" : ""}.
            Total on site: {checkResult.total_on_site}.
          </div>
        )}

        {checking ? (
          <LoadingSpinner text="Checking notices..." />
        ) : (
          <button
            type="button"
            onClick={handleCheckNow}
            disabled={checking}
            className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Check Now
          </button>
        )}
      </div>
    </main>
  );
}
