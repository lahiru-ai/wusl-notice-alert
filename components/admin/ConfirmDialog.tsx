"use client";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-7 shadow-2xl">
        <h3
          className={`text-xl font-bold ${
            danger ? "text-red-400" : "text-white"
          }`}
        >
          {title}
        </h3>

        <p className="mt-3 text-sm text-slate-400">{message}</p>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="flex-1 rounded-xl border border-slate-700 px-4 py-3 font-semibold text-slate-300 transition hover:border-slate-500 disabled:opacity-50"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={`flex-1 rounded-xl px-4 py-3 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
              danger
                ? "bg-red-600 hover:bg-red-500"
                : "bg-blue-600 hover:bg-blue-500"
            }`}
          >
            {loading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
