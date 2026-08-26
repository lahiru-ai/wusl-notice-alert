"use client";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
}

function getStatusClasses(status: string): string {
  const s = status.toLowerCase();

  if (
    s === "sent" ||
    s === "active" ||
    s === "success" ||
    s === "healthy"
  ) {
    return "border-green-500/30 bg-green-500/10 text-green-300";
  }

  if (s === "failed" || s === "error" || s === "inactive") {
    return "border-red-500/30 bg-red-500/10 text-red-300";
  }

  if (s === "pending" || s === "warning") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-300";
  }

  if (s === "email") {
    return "border-blue-500/30 bg-blue-500/10 text-blue-300";
  }

  if (s === "whatsapp") {
    return "border-green-500/30 bg-green-500/10 text-green-300";
  }

  return "border-slate-500/30 bg-slate-500/10 text-slate-300";
}

export default function StatusBadge({
  status,
  size = "md",
}: StatusBadgeProps) {
  const sizeClasses =
    size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${getStatusClasses(status)} ${sizeClasses}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}
