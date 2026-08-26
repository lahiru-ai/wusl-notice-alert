"use client";

interface FilterOption {
  value: string;
  label: string;
}

interface Filter {
  key: string;
  label: string;
  type: "search" | "select";
  options?: FilterOption[];
}

interface FilterBarProps {
  filters: Filter[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onReset?: () => void;
}

export default function FilterBar({
  filters,
  values,
  onChange,
  onReset,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap items-end gap-4">
      {filters.map((filter) => (
        <div key={filter.key} className="min-w-[180px] flex-1">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
            {filter.label}
          </label>

          {filter.type === "search" ? (
            <input
              type="text"
              value={values[filter.key] ?? ""}
              onChange={(e) => onChange(filter.key, e.target.value)}
              placeholder={`Search ${filter.label.toLowerCase()}...`}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none transition focus:border-blue-500"
            />
          ) : (
            <select
              value={values[filter.key] ?? ""}
              onChange={(e) => onChange(filter.key, e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-white outline-none transition focus:border-blue-500"
            >
              <option value="">All</option>

              {filter.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}
        </div>
      ))}

      {onReset && (
        <button
          type="button"
          onClick={onReset}
          className="rounded-xl border border-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-blue-500 hover:text-blue-400"
        >
          Reset
        </button>
      )}
    </div>
  );
}
