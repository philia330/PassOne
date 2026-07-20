"use client";

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

  if (totalPages <= 1) return null;

  const goToPage = (target: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(target));
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => page > 1 && goToPage(page - 1)}
            className={
              page <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"
            }
          />
        </PaginationItem>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <PaginationItem key={p}>
            <PaginationLink
              isActive={p === page}
              onClick={() => goToPage(p)}
              className="cursor-pointer"
            >
              {p}
            </PaginationLink>
          </PaginationItem>
        ))}

        <PaginationItem>
          <PaginationNext
            onClick={() => page < totalPages && goToPage(page + 1)}
            className={
              page >= totalPages
                ? "pointer-events-none opacity-50"
                : "cursor-pointer"
            }
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};
