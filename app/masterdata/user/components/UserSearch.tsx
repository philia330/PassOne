"use client";

import { Search, Loader2 } from "lucide-react";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";

interface UserSearchProps {
  defaultValue: string;
}

export function UserSearch({
  defaultValue,
}: UserSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(defaultValue);
  const [isPending, startTransition] = useTransition();

  const firstRender = useRef(true);

  // Simpan pathname & searchParams terbaru di ref,
  // supaya effect debounce di bawah TIDAK perlu "watch" objek ini
  // (objeknya selalu baru tiap navigasi, kalau dijadikan dependency bikin infinite loop)
  const pathnameRef = useRef(pathname);
  const searchParamsRef = useRef(searchParams);

  useEffect(() => {
    pathnameRef.current = pathname;
    searchParamsRef.current = searchParams;
  });

  // Sinkronkan input jika URL berubah dari luar (misal tombol back browser)
  useEffect(() => {
    if (defaultValue !== search) {
      setSearch(defaultValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValue]);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParamsRef.current.toString());

      if (search.trim().length > 0) {
        params.set("search", search.trim());
      } else {
        params.delete("search");
      }

      params.set("page", "1");

      startTransition(() => {
        router.replace(`${pathnameRef.current}?${params.toString()}`, {
          scroll: false,
        });
      });
    }, 500);

    return () => clearTimeout(timeout);
    // Sengaja HANYA depend ke `search` — pathname/searchParams diakses lewat ref
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, router]);

  return (
    <div className="relative w-full max-w-sm">
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 -translate-x-0.5 text-slate-400 dark:text-slate-500"
        size={18}
      />

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Cari nama, username, email..."
        className="
          h-11
          w-full
          rounded-xl
          border
          border-slate-200
          bg-white
          pl-10
          pr-9
          text-sm
          text-slate-800
          outline-none
          transition
          placeholder:text-slate-400
          focus:border-indigo-500
          focus:ring-2
          focus:ring-indigo-200
          dark:border-slate-700
          dark:bg-slate-800
          dark:text-slate-100
          dark:placeholder:text-slate-500
          dark:focus:border-indigo-500
          dark:focus:ring-indigo-500/20
        "
      />

      {isPending && (
        <Loader2
          className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400 dark:text-slate-500"
          size={16}
        />
      )}
    </div>
  );
}