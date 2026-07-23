"use client";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export const OdpPagination = ({
  page,
  totalPages,
}: {
  page: number;
  totalPages: number;
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const goTo = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`${pathname}?${params.toString()}`);
  };

  if (totalPages <= 1) return null;

  return (
    <Pagination className="my-2">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            className={`cursor-pointer dark:hover:bg-slate-800 dark:hover:text-slate-100 ${
              page === 1 ? "pointer-events-none opacity-50 dark:opacity-40" : ""
            }`}
            onClick={() => page > 1 && goTo(page - 1)}
          />
        </PaginationItem>

        {Array.from({ length: totalPages }).map((_, index) => (
          <PaginationItem key={index}>
            <PaginationLink
              className="cursor-pointer dark:border-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              isActive={page === index + 1}
              onClick={() => goTo(index + 1)}
            >
              {index + 1}
            </PaginationLink>
          </PaginationItem>
        ))}

        <PaginationItem>
          <PaginationNext
            className={`cursor-pointer dark:hover:bg-slate-800 dark:hover:text-slate-100 ${
              page === totalPages
                ? "pointer-events-none opacity-50 dark:opacity-40"
                : ""
            }`}
            onClick={() =>
              page < totalPages && goTo(page + 1)
            }
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};