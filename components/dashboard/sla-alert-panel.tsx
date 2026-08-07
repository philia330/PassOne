"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { getSlaSeverity, getDaysPending, SLA_COLORS } from "@/lib/sla";

type FabItem = { id_fab: number; kode_fab: string; nama_pelanggan: string; createdAt: Date };
type BaaItem = { id_baa: number; kode_baa: string; createdAt: Date };

const PER_PAGE = 5;

export default function SlaAlertPanel({
  fabOpen,
  baaOpen,
}: {
  fabOpen: FabItem[];
  baaOpen: BaaItem[];
}) {
  const [page, setPage] = useState(1);
  const totalPending = fabOpen.length + baaOpen.length;

  // Hitung total pages
  const totalPages = Math.ceil(totalPending / PER_PAGE);

  // Ambil data untuk halaman saat ini
  const allItems = [...fabOpen, ...baaOpen];
  const startIndex = (page - 1) * PER_PAGE;
  const paginatedItems = allItems.slice(startIndex, startIndex + PER_PAGE);

  if (totalPending === 0) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-slate-900 dark:shadow-none">
        <div className="flex items-center gap-2">
          <Clock className="text-emerald-500" size={20} />
          <h2 className="text-lg font-bold dark:text-white">Status SLA</h2>
        </div>
        <p className="mt-4 text-sm text-slate-400 dark:text-slate-500">
          🎉 Tidak ada FAB/BAA yang tertunda. Semua tindak lanjut sudah aman.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900 dark:shadow-none sm:p-6">
      {/* Header */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <AlertCircle className="text-amber-500" size={20} />
          <h2 className="text-lg font-bold dark:text-white">Status SLA</h2>
        </div>
        <span className="self-start rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400 sm:ml-auto">
          {totalPending} Pending
        </span>
      </div>

      <div className="space-y-3">
        {paginatedItems.map((item) => {
          const isFab = "nama_pelanggan" in item;
          const fabItem = item as FabItem;
          const baaItem = item as BaaItem;
          const severity = getSlaSeverity(item.createdAt);
          const days = getDaysPending(item.createdAt);
          const colors = SLA_COLORS[severity];

          return (
            <Link
              key={isFab ? `fab-${fabItem.id_fab}` : `baa-${baaItem.id_baa}`}
              href={isFab ? `/workspace?view=fab` : `/workspace?view=baa`}
              className="block rounded-xl border border-slate-100 p-4 transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <span className={`mt-2 h-2.5 w-2.5 flex-shrink-0 rounded-full ${colors.dot}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {isFab ? fabItem.kode_fab : baaItem.kode_baa}
                    </p>
                    {isFab && (
                      <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                        {fabItem.nama_pelanggan}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                      {isFab ? "FAB" : "BAA"} • {days} hari menunggu
                    </p>
                  </div>
                </div>
                <span className={`self-start rounded-full px-3 py-1 text-xs font-semibold sm:self-center ${colors.bg} ${colors.text}`}>
                  {colors.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <ChevronLeft size={16} />
            Prev
          </button>
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`h-8 w-8 rounded-lg text-sm font-medium transition ${
                  p === page
                    ? "bg-indigo-500 text-white"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
