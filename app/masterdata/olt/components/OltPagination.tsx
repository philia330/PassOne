"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export const OltPagination = ({
  page,
  totalPages,
}: {
  page: number;
  totalPages: number;
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const goToPage = (target: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(target));
    router.push(`${pathname}?${params.toString()}`);
  };

  // Sama seperti UserPagination: tampilkan rentang halaman di sekitar
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
    <div className="overflow-x-auto">
      <Pagination>
        <PaginationContent className="justify-center gap-1">
          {/* Previous Button */}
          <PaginationItem>
            <PaginationPrevious
              onClick={() => page > 1 && goToPage(page - 1)}
              className={`cursor-pointer rounded-xl border-slate-200 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 dark:border-slate-800 dark:hover:bg-purple-500/10 dark:hover:text-purple-400 ${
                page <= 1 ? "pointer-events-none opacity-50 dark:opacity-40" : ""
              }`}
            />
          </PaginationItem>

          {/* First Page (if not in range) */}
          {pageRange[0] > 1 && (
            <>
              <PaginationItem>
                <PaginationLink
                  className="cursor-pointer rounded-xl border-slate-200 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 dark:border-slate-800 dark:hover:bg-purple-500/10 dark:hover:text-purple-400"
                  onClick={() => goToPage(1)}
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
                isActive={p === page}
                onClick={() => goToPage(p)}
                className={`cursor-pointer rounded-xl border-slate-200 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 dark:border-slate-800 dark:hover:bg-purple-500/10 dark:hover:text-purple-400 ${
                  p === page
                    ? "bg-gradient-to-r from-purple-600 via-fuchsia-500 to-sky-500 text-white hover:bg-purple-600 hover:text-white border-transparent"
                    : ""
                }`}
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
                  onClick={() => goToPage(totalPages)}
                >
                  {totalPages}
                </PaginationLink>
              </PaginationItem>
            </>
          )}

          {/* Next Button */}
          <PaginationItem>
            <PaginationNext
              onClick={() => page < totalPages && goToPage(page + 1)}
              className={`cursor-pointer rounded-xl border-slate-200 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 dark:border-slate-800 dark:hover:bg-purple-500/10 dark:hover:text-purple-400 ${
                page >= totalPages ? "pointer-events-none opacity-50 dark:opacity-40" : ""
              }`}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};