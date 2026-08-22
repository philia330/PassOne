"use client";

import { useEffect, useRef, useTransition } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface PaketSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export const PaketSearch = ({ value, onChange }: PaketSearchProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const pathnameRef = useRef(pathname);
  const searchParamsRef = useRef(searchParams);

  useEffect(() => {
    pathnameRef.current = pathname;
    searchParamsRef.current = searchParams;
  });

  // Sinkronisasi jika URL berubah dari luar (misal: highlight dari Command Palette)
  useEffect(() => {
    const urlSearch = searchParams.get("search") ?? "";
    if (value !== urlSearch) {
      onChange(urlSearch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    const handler = setTimeout(() => {
      const params = new URLSearchParams(searchParamsRef.current.toString());

      if (value) {
        params.set("search", value);
      } else {
        params.delete("search");
      }
      params.set("page", "1");

      startTransition(() => {
        router.push(`${pathnameRef.current}?${params.toString()}`, {
          scroll: false,
        });
      });
    }, 400);

    return () => clearTimeout(handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative w-full max-w-xs">
      <Search
        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500"
      />
      <Input
        type="text"
        placeholder="Cari kode / nama paket..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={isPending}
        className="h-11 rounded-2xl pl-9 border-slate-200 focus-visible:ring-purple-500 focus-visible:border-purple-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
      />
    </div>
  );
};