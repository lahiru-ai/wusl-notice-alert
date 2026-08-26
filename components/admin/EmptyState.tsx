"use client";

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
}

export default function EmptyState({
  icon,
  title,
  description,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 text-5xl">{icon}</div>

      <h3 className="text-lg font-bold">{title}</h3>

      <p className="mt-2 max-w-sm text-sm text-slate-400">
        {description}
      </p>
    </div>
  );
}
