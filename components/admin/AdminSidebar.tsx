"use client";

import Link from "next/link";

interface AdminSidebarProps {
  currentPath: string;
}

const NAV_ITEMS = [
  { href: "/admin", icon: "📊", label: "Dashboard" },
  { href: "/admin/subscribers", icon: "👥", label: "Subscribers" },
  { href: "/admin/notifications", icon: "🔔", label: "Notifications" },
  { href: "/admin/test", icon: "🧪", label: "Test Center" },
  { href: "/admin/manual-notify", icon: "✉️", label: "Manual Notify" },
  { href: "/admin/monitoring", icon: "📈", label: "Monitoring" },
  { href: "/admin/analytics", icon: "📉", label: "Analytics" },
  { href: "/admin/activity-logs", icon: "📋", label: "Activity Logs" },
  { href: "/dashboard", icon: "←", label: "Back to Dashboard" },
];

export default function AdminSidebar({
  currentPath,
}: AdminSidebarProps) {
  return (
    <aside className="w-64 shrink-0 border-r border-slate-800 bg-slate-950/80">
      <nav className="flex flex-col gap-1 p-4">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/admin"
              ? currentPath === "/admin"
              : currentPath.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? "bg-blue-600/10 text-blue-400"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
              }`}
            >
              <span className="text-lg">{item.icon}</span>

              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
