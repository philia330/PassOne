"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Props = {
  page: number;
  totalPages: number;
};

export function UserPagination({
  page,
  totalPages,
}: Props) {
  const searchParams = useSearchParams();

  const search = searchParams.get("search") ?? "";

  const createLink = (newPage: number) => {
    const params = new URLSearchParams();

    if (search) {
      params.set("search", search);
    }

    params.set("page", String(newPage));

    return `/masterdata/user?${params.toString()}`;
  };

  return (
    <div className="flex items-center gap-3">
      <Link
        href={createLink(Math.max(page - 1, 1))}
        className={`
          rounded-xl
          border
          bg-white
          px-4
          py-2
          text-sm
          text-slate-700
          transition
          dark:border-slate-700
          dark:bg-slate-800
          dark:text-slate-300
          ${
            page === 1
              ? "pointer-events-none opacity-40"
              : "hover:bg-slate-100 dark:hover:bg-slate-700"
          }
        `}
      >
        Sebelumnya
      </Link>

      <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
        Halaman <strong className="dark:text-slate-200">{page}</strong> dari{" "}
        <strong className="dark:text-slate-200">{totalPages}</strong>
      </span>

      <Link
        href={createLink(
          Math.min(page + 1, totalPages)
        )}
        className={`
          rounded-xl
          border
          bg-white
          px-4
          py-2
          text-sm
          text-slate-700
          transition
          dark:border-slate-700
          dark:bg-slate-800
          dark:text-slate-300
          ${
            page === totalPages
              ? "pointer-events-none opacity-40"
              : "hover:bg-slate-100 dark:hover:bg-slate-700"
          }
        `}
      >
        Berikutnya
      </Link>
    </div>
  );
}