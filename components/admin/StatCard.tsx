"use client";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  subtitle?: string;
  trend?: {
    value: number;
    positive: boolean;
  };
}

export default function StatCard({
  title,
  value,
  icon,
  subtitle,
  trend,
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-2xl">
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm text-slate-400">{title}</p>

          <p className="mt-2 text-3xl font-bold">{value}</p>

          {subtitle && (
            <p className="mt-1 text-sm text-slate-500">
              {subtitle}
            </p>
          )}

          {trend && (
            <p
              className={`mt-2 text-sm font-medium ${
                trend.positive ? "text-green-400" : "text-red-400"
              }`}
            >
              {trend.positive ? "↑" : "↓"} {trend.value}%
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
