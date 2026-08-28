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

import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface UserPaginationProps {
  page: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
}

export const UserPagination = ({
  page,
  totalPages,
  totalItems,
  pageSize = 5,
}: UserPaginationProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const goTo = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`${pathname}?${params.toString()}`);
  };

  // Sama seperti FabPagination: tampilkan rentang halaman di sekitar
  // halaman aktif (delta 2), bukan semua nomor halaman sekaligus.
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
                className={`cursor-pointer rounded-xl border-slate-200 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 dark:border-slate-800 dark:hover:bg-purple-500/10 dark:hover:text-purple-400 ${
                  page === 1 ? "pointer-events-none opacity-50 dark:opacity-40" : ""
                }`}
                onClick={() => page > 1 && goTo(page - 1)}
              />
            </PaginationItem>

            {/* First Page (if not in range) */}
            {pageRange[0] > 1 && (
              <>
                <PaginationItem>
                  <PaginationLink
                    className="cursor-pointer rounded-xl border-slate-200 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 dark:border-slate-800 dark:hover:bg-purple-500/10 dark:hover:text-purple-400"
                    onClick={() => goTo(1)}
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
                  className={`cursor-pointer rounded-xl border-slate-200 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 dark:border-slate-800 dark:hover:bg-purple-500/10 dark:hover:text-purple-400 ${
                    p === page
                      ? "bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 text-white hover:bg-purple-600 hover:text-white border-transparent"
                      : ""
                  }`}
                  isActive={p === page}
                  onClick={() => goTo(p)}
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
                    className="cursor-pointer rounded-xl border-slate-200 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 dark:border-slate-800 dark:hover:bg-purple-500/10 dark:hover:text-purple-400"
                    onClick={() => goTo(totalPages)}
                  >
                    {totalPages}
                  </PaginationLink>
                </PaginationItem>
              </>
            )}

            {/* Next Button */}
            <PaginationItem>
              <PaginationNext
                className={`cursor-pointer rounded-xl border-slate-200 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 dark:border-slate-800 dark:hover:bg-purple-500/10 dark:hover:text-purple-400 ${
                  page === totalPages
                    ? "pointer-events-none opacity-50 dark:opacity-40"
                    : ""
                }`}
                onClick={() => page < totalPages && goTo(page + 1)}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
};