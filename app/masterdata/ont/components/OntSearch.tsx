"use client";

import { useEffect, useRef, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface OntSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export const OntSearch = ({ value, onChange }: OntSearchProps) => {
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
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParamsRef.current.toString());

      if (value.trim()) {
        params.set("search", value);
      } else {
        params.delete("search");
      }

      params.set("page", "1");

      startTransition(() => {
        router.replace(`${pathnameRef.current}?${params.toString()}`, {
          scroll: false,
        });
      });
    }, 400);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative w-full sm:w-80">
      {/* Wrapper ini yang handle posisi vertikal, JANGAN kasih animasi transform di sini */}
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center">
        <Search className="search-pulse-icon h-4 w-4 text-slate-400 dark:text-slate-500" />
      </div>

      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Cari serial, pelanggan, POP, atau ODP..."
        disabled={isPending}
        className="h-11 rounded-2xl border-slate-200 bg-white pl-10 text-slate-900 placeholder:text-slate-400 focus-visible:ring-purple-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-100 dark:placeholder:text-slate-500"
      />

      <style jsx global>{`
        @keyframes searchIconPulse {
          0%,
          80%,
          100% {
            transform: scale(1);
          }
          90% {
            transform: scale(1.4);
          }
        }

        .search-pulse-icon {
          transform-origin: center;
          animation: searchIconPulse 10s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};