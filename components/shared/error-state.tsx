"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

export default function ErrorState({
  error,
  reset,
  title = "Terjadi Kesalahan",
}: {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
}) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl bg-white p-10 text-center shadow-sm">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
        <AlertTriangle className="text-red-500" size={28} />
      </div>

      <h2 className="text-lg font-bold text-slate-800">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        {process.env.NODE_ENV === "development"
          ? error.message
          : "Terjadi kesalahan saat memuat data. Silakan coba lagi atau hubungi administrator jika masalah berlanjut."}
      </p>

      <button
        onClick={reset}
        className="mt-6 flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700"
      >
        <RotateCcw size={16} />
        Coba Lagi
      </button>
    </div>
  );
}