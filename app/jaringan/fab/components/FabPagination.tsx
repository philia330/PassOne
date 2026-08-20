"use client";

import { useMemo } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface FabPaginationProps {
  page: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
}

export const FabPagination = ({
  page,
  totalPages,
  totalItems,
  pageSize = 5,
  onPageChange,
}: FabPaginationProps) => {
  // ✅ Pindahkan useMemo ke sini (sebelum conditional return)
  const pageRange = useMemo(() => {
    const delta = 2;
    const range: number[] = [];
    const start = Math.max(1, page - delta);
    const end = Math.min(totalPages, page + delta);

    for (let i = start; i <= end; i++) {
      range.push(i);
    }

    return range;
  }, [page, totalPages]);

  // ✅ Baru setelah useMemo, baru conditional return
  if (totalPages <= 1) return null;

    return (
    <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      {/* Info total data */}
      {totalItems !== undefined && (
        <div className="whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
          Menampilkan {((page - 1) * pageSize) + 1} - {Math.min(page * pageSize, totalItems)} dari {totalItems} data
        </div>
      )}

      <div className="overflow-x-auto">
        <Pagination>
          <PaginationContent className="justify-center gap-1">
          {/* Previous Button */}
          <PaginationItem>
            <PaginationPrevious
              className={`cursor-pointer rounded-xl border-slate-200 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 ${
                page === 1 ? "pointer-events-none opacity-50" : ""
              }`}
              onClick={() => page > 1 && onPageChange(page - 1)}
            />
          </PaginationItem>

          {/* First Page (if not in range) */}
          {pageRange[0] > 1 && (
            <>
              <PaginationItem>
                <PaginationLink
                  className="cursor-pointer rounded-xl border-slate-200 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700"
                  onClick={() => onPageChange(1)}
                >
                  1
                </PaginationLink>
              </PaginationItem>
              {pageRange[0] > 2 && (
                <PaginationItem>
                  <span className="px-2 text-slate-400">...</span>
                </PaginationItem>
              )}
            </>
          )}

          {/* Page Numbers */}
          {pageRange.map((p) => (
            <PaginationItem key={p}>
              <PaginationLink
                className={`cursor-pointer rounded-xl border-slate-200 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 ${
                  p === page
                    ? "bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 text-white hover:bg-purple-600 hover:text-white border-transparent"
                    : ""
                }`}
                isActive={p === page}
                onClick={() => onPageChange(p)}
              >
                {p}
              </PaginationLink>
            </PaginationItem>
          ))}

          {/* Last Page (if not in range) */}
          {pageRange[pageRange.length - 1] < totalPages && (
            <>
              {pageRange[pageRange.length - 1] < totalPages - 1 && (
                <PaginationItem>
                  <span className="px-2 text-slate-400">...</span>
                </PaginationItem>
              )}
              <PaginationItem>
                <PaginationLink
                  className="cursor-pointer rounded-xl border-slate-200 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700"
                  onClick={() => onPageChange(totalPages)}
                >
                  {totalPages}
                </PaginationLink>
              </PaginationItem>
            </>
          )}

          {/* Next Button */}
          <PaginationItem>
            <PaginationNext
              className={`cursor-pointer rounded-xl border-slate-200 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 ${
                page === totalPages ? "pointer-events-none opacity-50" : ""
              }`}
              onClick={() => page < totalPages && onPageChange(page + 1)}
            />
          </PaginationItem>
        </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
};