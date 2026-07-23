"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BaaError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl shadow-xl border bg-white p-8 text-center space-y-4">
        <div className="mx-auto h-14 w-14 rounded-full bg-red-50 flex items-center justify-center">
          <AlertTriangle className="text-red-500" size={26} />
        </div>

        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-900">Gagal Memuat Data BAA</h2>
          <p className="text-sm text-slate-500">
            Terjadi kesalahan saat mengambil data. Coba lagi, atau pastikan koneksi database
            sedang aktif.
          </p>
        </div>

        <Button
          onClick={() => reset()}
          className="h-11 rounded-2xl font-semibold bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 text-white"
        >
          <RotateCcw className="mr-2 h-4 w-4" /> Coba Lagi
        </Button>
      </div>
    </div>
  );
}