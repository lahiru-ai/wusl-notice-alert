"use client";

interface LoadingSpinnerProps {
  text?: string;
}

export default function LoadingSpinner({
  text = "Loading...",
}: LoadingSpinnerProps) {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500" />

        <p className="text-slate-400">{text}</p>
      </div>
    </div>
  );
}
