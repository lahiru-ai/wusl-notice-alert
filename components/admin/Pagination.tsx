"use client";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  page,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | "...")[] = [];

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);

    if (page > 3) pages.push("...");

    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);

    for (let i = start; i <= end; i++) pages.push(i);

    if (page < totalPages - 2) pages.push("...");

    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="rounded-xl border border-slate-700 px-3 py-2 text-sm font-medium text-slate-300 transition hover:border-blue-500 hover:text-blue-400 disabled:cursor-not-allowed disabled:opacity-40"
      >
        ← Prev
      </button>

      {pages.map((p, i) =>
        p === "..." ? (
          <span
            key={`ellipsis-${i}`}
            className="px-2 text-slate-500"
          >
            ...
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={`min-w-[40px] rounded-xl px-3 py-2 text-sm font-medium transition ${
              p === page
                ? "bg-blue-600 text-white"
                : "border border-slate-700 text-slate-300 hover:border-blue-500 hover:text-blue-400"
            }`}
          >
            {p}
          </button>
        )
      )}

      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className="rounded-xl border border-slate-700 px-3 py-2 text-sm font-medium text-slate-300 transition hover:border-blue-500 hover:text-blue-400 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next →
      </button>
    </div>
  );
}
